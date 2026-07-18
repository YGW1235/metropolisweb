"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getCasualUserRestrictionMessage,
  getCasualUserStatus,
  type CasualUserPermission,
} from "@/lib/casual-user-status";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const OPINION_IMAGE_BUCKET = "casual-opinion-images";
const MAX_OPINION_BODY_LENGTH = 5000;
const MAX_OPINION_IMAGE_COUNT = 3;
const MAX_OPINION_IMAGE_SIZE = 5 * 1024 * 1024;
const OPINION_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getOpinionImageFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function getOpinionImageExtension(file: File) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "";
  }
}

function validateOpinionImages(files: File[], returnPath: string) {
  if (files.length > MAX_OPINION_IMAGE_COUNT) {
    redirectWithMessage(
      returnPath,
      "이미지는 최대 3장까지 첨부할 수 있습니다.",
      "error",
    );
  }

  for (const file of files) {
    if (!OPINION_IMAGE_TYPES.has(file.type)) {
      redirectWithMessage(
        returnPath,
        "이미지는 JPEG, PNG, WEBP, GIF 형식만 첨부할 수 있습니다.",
        "error",
      );
    }

    if (file.size > MAX_OPINION_IMAGE_SIZE) {
      redirectWithMessage(
        returnPath,
        "이미지는 파일당 5MB 이하만 첨부할 수 있습니다.",
        "error",
      );
    }
  }
}

function redirectWithMessage(
  path: string,
  message: string,
  type: "success" | "error" = "success",
): never {
  const params = new URLSearchParams({
    message,
    type,
  });

  redirect(`${path}?${params.toString()}`);
}

async function createNotification(
  supabase: SupabaseClient,
  {
    commentId,
    opinionId,
    topicId,
    type,
    userId,
  }: {
    commentId: string | null;
    opinionId: string;
    topicId: string;
    type: "opinion_comment";
    userId: string;
  },
) {
  await supabase.rpc("create_casual_notification", {
    p_user_id: userId,
    p_type: type,
    p_topic_id: topicId,
    p_opinion_id: opinionId,
    p_comment_id: commentId,
  });
}

async function redirectIfUserRestricted(
  supabase: SupabaseClient,
  userId: string,
  returnPath: string,
  permission: CasualUserPermission,
) {
  const { status, errorMessage } = await getCasualUserStatus(supabase, userId);

  if (errorMessage) {
    redirectWithMessage(returnPath, errorMessage, "error");
  }

  const restrictionMessage = getCasualUserRestrictionMessage(
    status,
    permission,
  );

  if (restrictionMessage) {
    redirectWithMessage(returnPath, restrictionMessage, "error");
  }
}

async function removeUploadedOpinionImages(
  supabase: SupabaseClient,
  storagePaths: string[],
) {
  if (storagePaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage
    .from(OPINION_IMAGE_BUCKET)
    .remove(storagePaths);

  if (error) {
    console.error("Failed to remove uploaded opinion images", error);
  }
}

async function hideFailedOpinion(supabase: SupabaseClient, opinionId: string) {
  const { error } = await supabase.rpc("hide_own_casual_opinion", {
    p_opinion_id: opinionId,
  });

  if (error) {
    console.error("Failed to hide opinion after image failure", error);
  }
}

async function cleanupFailedOpinionImages({
  opinionId,
  storagePaths,
  supabase,
}: {
  opinionId: string;
  storagePaths: string[];
  supabase: SupabaseClient;
}) {
  await removeUploadedOpinionImages(supabase, storagePaths);
  await hideFailedOpinion(supabase, opinionId);
}

export async function voteTopic(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const choice = getString(formData, "choice");

  if (!topicId) {
    redirectWithMessage("/topics", "주제 정보가 올바르지 않습니다.", "error");
  }

  if (choice !== "a" && choice !== "b") {
    redirectWithMessage(
      `/topics/${topicId}`,
      "올바른 선택지가 아닙니다.",
      "error",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage(
      `/login`,
      "투표하려면 로그인이 필요합니다.",
      "error",
    );
  }

  await supabase.rpc("ensure_casual_profile");

  const { error } = await supabase.from("casual_votes").upsert(
    {
      topic_id: topicId,
      user_id: user.id,
      choice,
    },
    {
      onConflict: "topic_id,user_id",
    },
  );

  if (error) {
    redirectWithMessage(`/topics/${topicId}`, error.message, "error");
  }

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);

  redirectWithMessage(
    `/topics/${topicId}`,
    choice === "a" ? "A 선택지에 투표했습니다." : "B 선택지에 투표했습니다.",
    "success",
  );
}

export async function createOpinion(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const body = getString(formData, "body");
  const imageFiles = getOpinionImageFiles(formData);

  if (!topicId) {
    redirectWithMessage("/topics", "주제 정보가 올바르지 않습니다.", "error");
  }

  if (body.length < 1 || body.length > MAX_OPINION_BODY_LENGTH) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "의견은 1자 이상 5,000자 이하로 입력해주세요.",
      "error",
    );
  }

  validateOpinionImages(imageFiles, `/topics/${topicId}`);

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage("/login", "의견을 작성하려면 로그인이 필요합니다.", "error");
  }

  await redirectIfUserRestricted(
    supabase,
    user.id,
    `/topics/${topicId}`,
    "participation",
  );

  await supabase.rpc("ensure_casual_profile");

  const { data: vote, error: voteError } = await supabase
    .from("casual_votes")
    .select("choice")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (voteError) {
    console.error("Failed to read current vote for opinion:", voteError.message);
    redirectWithMessage(
      `/topics/${topicId}`,
      "투표 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if (!vote || (vote.choice !== "a" && vote.choice !== "b")) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "먼저 A/B 중 하나를 선택한 뒤 의견을 작성할 수 있습니다.",
      "error",
    );
  }

  const opinionRateLimitCutoff = new Date(Date.now() - 30_000).toISOString();

  const { data: duplicateOpinions, error: duplicateOpinionsError } =
    await supabase
      .from("casual_opinions")
      .select("id")
      .eq("user_id", user.id)
      .eq("topic_id", topicId)
      .eq("choice", vote.choice)
      .eq("body", body)
      .eq("is_hidden", false)
      .gt("created_at", opinionRateLimitCutoff)
      .limit(1);

  if (duplicateOpinionsError) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "의견 제출 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if ((duplicateOpinions ?? []).length > 0) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "이미 같은 내용이 제출되었습니다. 잠시 후 확인해주세요.",
      "success",
    );
  }

  const { data: recentOpinions, error: recentOpinionsError } = await supabase
    .from("casual_opinions")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_hidden", false)
    .gt("created_at", opinionRateLimitCutoff)
    .limit(1);

  if (recentOpinionsError) {
    console.error(
      "Failed to check recent casual opinions:",
      recentOpinionsError.message,
    );
    redirectWithMessage(
      `/topics/${topicId}`,
      "의견 제출 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if ((recentOpinions ?? []).length > 0) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "의견을 너무 빠르게 작성하고 있습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  const { data: opinion, error } = await supabase
    .from("casual_opinions")
    .insert({
      topic_id: topicId,
      user_id: user.id,
      choice: vote.choice,
      body,
    })
    .select("id")
    .single();

  if (error || !opinion) {
    if (error) {
      console.error("Failed to create casual opinion:", error.message);
    }

    redirectWithMessage(
      `/topics/${topicId}`,
      "의견을 남기지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  const uploadedImages: {
    display_order: number;
    storage_path: string;
  }[] = [];

  for (const [index, file] of imageFiles.entries()) {
    const extension = getOpinionImageExtension(file);
    const storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(OPINION_IMAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      await cleanupFailedOpinionImages({
        opinionId: opinion.id,
        storagePaths: uploadedImages.map((image) => image.storage_path),
        supabase,
      });

      redirectWithMessage(
        `/topics/${topicId}`,
        "이미지 업로드에 실패해 의견 작성을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
        "error",
      );
    }

    uploadedImages.push({
      display_order: index,
      storage_path: storagePath,
    });
  }

  if (uploadedImages.length > 0) {
    const { error: imageInsertError } = await supabase
      .from("casual_opinion_images")
      .insert(
        uploadedImages.map((image) => ({
          opinion_id: opinion.id,
          user_id: user.id,
          storage_bucket: OPINION_IMAGE_BUCKET,
          storage_path: image.storage_path,
          display_order: image.display_order,
        })),
      );

    if (imageInsertError) {
      await cleanupFailedOpinionImages({
        opinionId: opinion.id,
        storagePaths: uploadedImages.map((image) => image.storage_path),
        supabase,
      });

      redirectWithMessage(
        `/topics/${topicId}`,
        "이미지 정보를 저장하지 못해 의견 작성을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
        "error",
      );
    }
  }

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);

  redirectWithMessage(`/topics/${topicId}`, "의견을 남겼습니다.", "success");
}

export async function reactOpinion(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const opinionId = getString(formData, "opinionId");
  const reactionType = getString(formData, "reactionType");

  if (!topicId || !opinionId) {
    redirectWithMessage("/topics", "의견 정보가 올바르지 않습니다.", "error");
  }

  if (reactionType !== "like" && reactionType !== "dislike") {
    redirectWithMessage(
      `/topics/${topicId}`,
      "올바른 반응이 아닙니다.",
      "error",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage(
      "/login",
      "공감/비공감을 누르려면 로그인이 필요합니다.",
      "error",
    );
  }

  await redirectIfUserRestricted(
    supabase,
    user.id,
    `/topics/${topicId}`,
    "interaction",
  );

  const { error } = await supabase.rpc("set_casual_opinion_reaction", {
    p_opinion_id: opinionId,
    p_reaction_type: reactionType,
  });

  if (error) {
    redirectWithMessage(`/topics/${topicId}`, error.message, "error");
  }

  revalidatePath(`/topics/${topicId}`);
  revalidatePath("/topics");

  redirect(`/topics/${topicId}`);
}

export async function clearOpinionReaction(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const opinionId = getString(formData, "opinionId");

  if (!topicId || !opinionId) {
    redirectWithMessage("/topics", "의견 정보가 올바르지 않습니다.", "error");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage(
      "/login",
      "반응을 취소하려면 로그인이 필요합니다.",
      "error",
    );
  }

  const { error } = await supabase.rpc("clear_casual_opinion_reaction", {
    p_opinion_id: opinionId,
  });

  if (error) {
    redirectWithMessage(`/topics/${topicId}`, error.message, "error");
  }

  revalidatePath(`/topics/${topicId}`);
  revalidatePath("/topics");

  redirect(`/topics/${topicId}`);
}

export async function toggleTopicBookmark(formData: FormData) {
  const topicId = getString(formData, "topicId");

  if (!topicId) {
    redirectWithMessage("/topics", "주제 정보가 올바르지 않습니다.", "error");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage(
      "/login",
      "주제를 저장하려면 로그인이 필요합니다.",
      "error",
    );
  }

  await redirectIfUserRestricted(
    supabase,
    user.id,
    `/topics/${topicId}`,
    "interaction",
  );

  const { data: existingBookmark, error: readError } = await supabase
    .from("casual_topic_bookmarks")
    .select("topic_id")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) {
    redirectWithMessage(`/topics/${topicId}`, readError.message, "error");
  }

  if (existingBookmark) {
    const { error } = await supabase
      .from("casual_topic_bookmarks")
      .delete()
      .eq("topic_id", topicId)
      .eq("user_id", user.id);

    if (error) {
      redirectWithMessage(`/topics/${topicId}`, error.message, "error");
    }
  } else {
    const { error } = await supabase.from("casual_topic_bookmarks").insert({
      topic_id: topicId,
      user_id: user.id,
    });

    if (error) {
      redirectWithMessage(`/topics/${topicId}`, error.message, "error");
    }
  }

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath("/me");

  redirectWithMessage(
    `/topics/${topicId}`,
    existingBookmark ? "저장을 해제했습니다." : "주제를 저장했습니다.",
    "success",
  );
}

export async function createComment(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const opinionId = getString(formData, "opinionId");
  const body = getString(formData, "body");

  if (!topicId || !opinionId) {
    redirectWithMessage("/topics", "댓글 대상 정보가 올바르지 않습니다.", "error");
  }

  if (body.length < 1 || body.length > 300) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "댓글은 1자 이상 300자 이하로 입력해주세요.",
      "error",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage("/login", "댓글을 작성하려면 로그인이 필요합니다.", "error");
  }

  await redirectIfUserRestricted(
    supabase,
    user.id,
    `/topics/${topicId}`,
    "participation",
  );

  await supabase.rpc("ensure_casual_profile");

  const { data: opinion, error: opinionError } = await supabase
    .from("casual_opinions")
    .select("id, topic_id, user_id, is_hidden")
    .eq("id", opinionId)
    .eq("topic_id", topicId)
    .maybeSingle();

  if (opinionError || !opinion) {
    redirectWithMessage(
      `/topics/${topicId}`,
      opinionError?.message ?? "의견을 찾을 수 없습니다.",
      "error",
    );
  }

  if (opinion.is_hidden) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "숨김 처리된 의견에는 댓글을 작성할 수 없습니다.",
      "error",
    );
  }

  const commentRateLimitCutoff = new Date(Date.now() - 15_000).toISOString();

  const { data: duplicateComments, error: duplicateCommentsError } =
    await supabase
      .from("casual_comments")
      .select("id")
      .eq("user_id", user.id)
      .eq("opinion_id", opinionId)
      .eq("body", body)
      .eq("is_hidden", false)
      .gt("created_at", commentRateLimitCutoff)
      .limit(1);

  if (duplicateCommentsError) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "댓글 제출 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if ((duplicateComments ?? []).length > 0) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "이미 같은 내용이 제출되었습니다. 잠시 후 확인해주세요.",
      "success",
    );
  }

  const { data: recentComments, error: recentCommentsError } = await supabase
    .from("casual_comments")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_hidden", false)
    .gt("created_at", commentRateLimitCutoff)
    .limit(1);

  if (recentCommentsError) {
    redirectWithMessage(
      `/topics/${topicId}`,
      recentCommentsError.message,
      "error",
    );
  }

  if ((recentComments ?? []).length > 0) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "댓글을 너무 빠르게 작성하고 있습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  const { data: comment, error } = await supabase
    .from("casual_comments")
    .insert({
      opinion_id: opinionId,
      user_id: user.id,
      body,
    })
    .select("id")
    .single();

  if (error || !comment) {
    redirectWithMessage(
      `/topics/${topicId}`,
      error?.message ?? "댓글을 남기지 못했습니다.",
      "error",
    );
  }

  await createNotification(supabase, {
    commentId: comment.id,
    opinionId,
    topicId,
    type: "opinion_comment",
    userId: opinion.user_id,
  });

  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/notifications");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);

  redirectWithMessage(`/topics/${topicId}`, "댓글을 남겼습니다.", "success");
}

export async function updateOpinion(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const opinionId = getString(formData, "opinionId");
  const body = getString(formData, "body");
  const confirmReset = formData.get("confirmReset") === "on";

  if (!topicId || !opinionId) {
    redirectWithMessage("/topics", "의견 정보가 올바르지 않습니다.", "error");
  }

  if (body.length < 1 || body.length > MAX_OPINION_BODY_LENGTH) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "의견은 1자 이상 5,000자 이하로 입력해주세요.",
      "error",
    );
  }

  if (!confirmReset) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "의견을 수정하려면 공감/비공감 초기화에 동의해야 합니다.",
      "error",
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("update_own_casual_opinion", {
    p_opinion_id: opinionId,
    p_body: body,
  });

  if (error) {
    console.error("Failed to update casual opinion:", error.message);
    redirectWithMessage(
      `/topics/${topicId}`,
      "의견을 수정하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);

  redirectWithMessage(
    `/topics/${topicId}`,
    "의견을 수정했습니다. 기존 공감/비공감은 초기화되었습니다.",
    "success",
  );
}

export async function deleteOpinion(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const opinionId = getString(formData, "opinionId");

  if (!topicId || !opinionId) {
    redirectWithMessage("/topics", "의견 정보가 올바르지 않습니다.", "error");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("hide_own_casual_opinion", {
    p_opinion_id: opinionId,
  });

  if (error) {
    redirectWithMessage(`/topics/${topicId}`, error.message, "error");
  }

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);

  redirectWithMessage(`/topics/${topicId}`, "의견을 삭제했습니다.", "success");
}

export async function updateComment(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const commentId = getString(formData, "commentId");
  const body = getString(formData, "body");

  if (!topicId || !commentId) {
    redirectWithMessage("/topics", "댓글 정보가 올바르지 않습니다.", "error");
  }

  if (body.length < 1 || body.length > 300) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "댓글은 1자 이상 300자 이하로 입력해주세요.",
      "error",
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("update_own_casual_comment", {
    p_comment_id: commentId,
    p_body: body,
  });

  if (error) {
    redirectWithMessage(`/topics/${topicId}`, error.message, "error");
  }

  revalidatePath(`/topics/${topicId}`);

  redirectWithMessage(`/topics/${topicId}`, "댓글을 수정했습니다.", "success");
}

export async function deleteComment(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const commentId = getString(formData, "commentId");

  if (!topicId || !commentId) {
    redirectWithMessage("/topics", "댓글 정보가 올바르지 않습니다.", "error");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("hide_own_casual_comment", {
    p_comment_id: commentId,
  });

  if (error) {
    redirectWithMessage(`/topics/${topicId}`, error.message, "error");
  }

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);

  redirectWithMessage(`/topics/${topicId}`, "댓글을 삭제했습니다.", "success");
}
