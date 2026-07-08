"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
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

  if (!topicId) {
    redirectWithMessage("/topics", "주제 정보가 올바르지 않습니다.", "error");
  }

  if (body.length < 1 || body.length > 500) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "의견은 1자 이상 500자 이하로 입력해주세요.",
      "error",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage("/login", "의견을 작성하려면 로그인이 필요합니다.", "error");
  }

  await supabase.rpc("ensure_casual_profile");

  const { data: vote, error: voteError } = await supabase
    .from("casual_votes")
    .select("choice")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (voteError) {
    redirectWithMessage(`/topics/${topicId}`, voteError.message, "error");
  }

  if (!vote || (vote.choice !== "a" && vote.choice !== "b")) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "먼저 A/B 중 하나를 선택한 뒤 의견을 작성할 수 있습니다.",
      "error",
    );
  }

  const { error } = await supabase.from("casual_opinions").insert({
    topic_id: topicId,
    user_id: user.id,
    choice: vote.choice,
    body,
  });

  if (error) {
    redirectWithMessage(`/topics/${topicId}`, error.message, "error");
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

  if (body.length < 1 || body.length > 500) {
    redirectWithMessage(
      `/topics/${topicId}`,
      "의견은 1자 이상 500자 이하로 입력해주세요.",
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
    redirectWithMessage(`/topics/${topicId}`, error.message, "error");
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
