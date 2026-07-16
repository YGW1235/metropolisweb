"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  return value.trim();
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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

function getCreatedPostId(data: unknown) {
  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    return (data[0] as { id?: string } | undefined)?.id ?? null;
  }

  if (data && typeof data === "object" && "id" in data) {
    return (data as { id?: string }).id ?? null;
  }

  return null;
}


function getImageFile(formData: FormData) {
  const value = formData.get("image");

  if (!(value instanceof File) || value.size === 0) {
    return {
      error: null,
      file: null,
    };
  }

  if (!ALLOWED_IMAGE_TYPES.has(value.type)) {
    return {
      error: "이미지는 JPG, PNG, WEBP 형식만 업로드할 수 있습니다.",
      file: null,
    };
  }

  if (value.size > MAX_IMAGE_SIZE) {
    return {
      error: "이미지는 최대 5MB까지만 업로드할 수 있습니다.",
      file: null,
    };
  }

  return {
    error: null,
    file: value,
  };
}

function getImageExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function createImagePath({
  topicId,
  userId,
  postId,
  file,
}: {
  topicId: string;
  userId: string;
  postId: string;
  file: File;
}) {
  const extension = getImageExtension(file);
  const uniqueId = randomUUID();

  return `${topicId}/${userId}/${postId}-${uniqueId}.${extension}`;
}

export async function createDebatePost(formData: FormData) {
  const topicId = getString(formData, "topic_id");
  const title = getString(formData, "title");
  const content = getString(formData, "content");
  const imageResult = getImageFile(formData);

  if (!topicId) {
    redirectWithMessage("/topics", "의제 정보를 찾을 수 없습니다.", "error");
  }

  if (!title || title.length < 2) {
    redirectWithMessage(
      `/topics/${topicId}/debate/new`,
      "제목은 2자 이상 입력해주세요.",
      "error",
    );
  }

  if (!content || content.length < 5) {
    redirectWithMessage(
      `/topics/${topicId}/debate/new`,
      "내용은 5자 이상 입력해주세요.",
      "error",
    );
  }

  if (imageResult.error) {
    redirectWithMessage(
      `/topics/${topicId}/debate/new`,
      imageResult.error,
      "error",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent(
        "로그인 후 발언을 작성할 수 있습니다.",
      )}&redirectTo=${encodeURIComponent(`/topics/${topicId}/debate/new`)}`,
    );
  }

  const { data, error } = await supabase.rpc("create_debate_post", {
    p_topic_id: topicId,
    p_title: title,
    p_content: content,
  });

  if (error) {
    console.error("Create debate post failed", error);
    redirectWithMessage(
      `/topics/${topicId}/debate/new`,
      "발언을 작성하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  const createdPostId = getCreatedPostId(data);

  if (!createdPostId) {
    redirectWithMessage(
      `/topics/${topicId}/debate`,
      "발언은 작성되었지만 상세 위치를 확인하지 못했습니다.",
      "success",
    );
  }

  const imageFile = imageResult.file;

  if (imageFile) {
    const imagePath = createImagePath({
      topicId,
      userId: user.id,
      postId: createdPostId,
      file: imageFile,
    });

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("debate-images")
      .upload(imagePath, imageBuffer, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Debate post image upload failed", uploadError);
      revalidatePath(`/topics/${topicId}/debate`);
      revalidatePath(`/topics/${topicId}/debate/${createdPostId}`);

      redirectWithMessage(
        `/topics/${topicId}/debate/${createdPostId}`,
        "발언은 작성되었지만 첨부 이미지 업로드에 실패했습니다. 잠시 후 다시 확인해주세요.",
        "error",
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("debate-images")
      .getPublicUrl(imagePath);

    const { error: updateError } = await supabase
      .from("debate_posts")
      .update({
        image_url: publicUrlData.publicUrl,
        image_path: imagePath,
      })
      .eq("id", createdPostId)
      .eq("author_id", user.id);

    if (updateError) {
      console.error("Debate post image metadata update failed", updateError);
      revalidatePath(`/topics/${topicId}/debate`);
      revalidatePath(`/topics/${topicId}/debate/${createdPostId}`);

      redirectWithMessage(
        `/topics/${topicId}/debate/${createdPostId}`,
        "발언은 작성되었지만 첨부 이미지 연결에 실패했습니다. 잠시 후 다시 확인해주세요.",
        "error",
      );
    }
  }

  revalidatePath(`/topics/${topicId}/debate`);
  revalidatePath(`/topics/${topicId}/debate/${createdPostId}`);
  revalidatePath("/me");

  redirect(`/topics/${topicId}/debate/${createdPostId}`);
}

export async function createDebateComment(formData: FormData) {
  const topicId = getRequiredString(formData, "topic_id");
  const postId = getRequiredString(formData, "post_id");
  const content = getRequiredString(formData, "content");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인 후 이용할 수 있습니다.")}`);
  }

  const { error } = await supabase.rpc("create_debate_comment", {
    p_post_id: postId,
    p_content: content,
  });

  if (error) {
    console.error("Create debate comment failed", error);
    redirectWithMessage(
      `/topics/${topicId}/debate/${postId}`,
      "댓글을 작성하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  revalidatePath(`/topics/${topicId}/debate`);
  revalidatePath(`/topics/${topicId}/debate/${postId}`);

  redirect(`/topics/${topicId}/debate/${postId}`);
}

export async function deleteDebatePost(formData: FormData) {
  const topicId = getString(formData, "topic_id");
  const postId = getString(formData, "post_id");

  if (!topicId || !postId) {
    redirectWithMessage("/topics", "삭제할 발언 정보를 찾을 수 없습니다.", "error");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent("로그인 후 이용할 수 있습니다.")}`,
    );
  }

  const { data: post, error: postReadError } = await supabase
    .from("debate_posts")
    .select("id, topic_id, author_id, image_path")
    .eq("id", postId)
    .eq("topic_id", topicId)
    .maybeSingle();

  if (postReadError || !post) {
    redirectWithMessage(
      `/topics/${topicId}/debate`,
      "삭제할 발언을 찾을 수 없습니다.",
      "error",
    );
  }

  if (post.author_id !== user.id) {
    redirectWithMessage(
      `/topics/${topicId}/debate/${postId}`,
      "본인이 작성한 발언만 삭제할 수 있습니다.",
      "error",
    );
  }

  const { error: deletePostError } = await supabase
    .from("debate_posts")
    .update({
      status: "deleted",
      image_url: null,
      image_path: null,
    })
    .eq("id", postId)
    .eq("author_id", user.id);

  if (deletePostError) {
    console.error("Delete debate post failed", deletePostError);
    redirectWithMessage(
      `/topics/${topicId}/debate/${postId}`,
      "발언을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if (post.image_path) {
    const { error: imageDeleteError } = await supabase.storage
      .from("debate-images")
      .remove([post.image_path]);

    if (imageDeleteError) {
      console.error("Debate post image delete failed", imageDeleteError);
      redirectWithMessage(
        `/topics/${topicId}/debate`,
        "발언은 삭제되었지만 첨부 이미지 정리에 실패했습니다. 잠시 후 다시 확인해주세요.",
        "error",
      );
    }
  }

  revalidatePath(`/topics/${topicId}/debate`);
  revalidatePath(`/topics/${topicId}/debate/${postId}`);
  revalidatePath("/me");

  redirectWithMessage(
    `/topics/${topicId}/debate`,
    "발언과 첨부 이미지가 삭제되었습니다.",
    "success",
  );
}

export async function deleteDebateComment(formData: FormData) {
  const topicId = getRequiredString(formData, "topic_id");
  const postId = getRequiredString(formData, "post_id");
  const commentId = getRequiredString(formData, "comment_id");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인 후 이용할 수 있습니다.")}`);
  }

  const { error } = await supabase.rpc("delete_my_debate_comment", {
    p_comment_id: commentId,
  });

  if (error) {
    console.error("Delete debate comment failed", error);
    redirectWithMessage(
      `/topics/${topicId}/debate/${postId}`,
      "댓글을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  revalidatePath(`/topics/${topicId}/debate`);
  revalidatePath(`/topics/${topicId}/debate/${postId}`);

  redirectWithMessage(
    `/topics/${topicId}/debate/${postId}`,
    "댓글이 삭제되었습니다.",
    "success",
  );
}
