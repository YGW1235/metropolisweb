"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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