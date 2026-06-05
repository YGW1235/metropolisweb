"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  return value.trim();
}

export async function createDebatePost(formData: FormData) {
  const topicId = getRequiredString(formData, "topic_id");
  const title = getRequiredString(formData, "title");
  const content = getRequiredString(formData, "content");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인 후 이용할 수 있습니다.")}`);
  }

  const { data, error } = await supabase.rpc("create_debate_post", {
    p_topic_id: topicId,
    p_title: title,
    p_content: content,
  });

  if (error) {
    redirect(
      `/topics/${topicId}/debate?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/topics/${topicId}/debate`);

  redirect(`/topics/${topicId}/debate#post-${data.id}`);
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
    redirect(
      `/topics/${topicId}/debate?message=${encodeURIComponent(error.message)}#post-${postId}`,
    );
  }

  revalidatePath(`/topics/${topicId}/debate`);

  redirect(`/topics/${topicId}/debate#post-${postId}`);
}