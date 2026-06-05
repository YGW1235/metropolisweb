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

export async function joinTopic(formData: FormData) {
  const topicId = getRequiredString(formData, "topic_id");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인 후 참가할 수 있습니다.")}`);
  }

  const { error } = await supabase.rpc("join_topic", {
    p_topic_id: topicId,
  });

  if (error) {
    redirect(
      `/topics/${topicId}?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);

  redirect(`/topics/${topicId}/debate`);
}