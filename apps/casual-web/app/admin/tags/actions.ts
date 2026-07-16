"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminAuditLog } from "@/lib/casual-admin-audit-log";
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

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage("/login", "로그인이 필요합니다.", "error");
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_casual_admin");

  if (adminError || !isAdmin) {
    redirectWithMessage("/", "관리자 권한이 필요합니다.", "error");
  }

  return { supabase };
}

function revalidateTagPaths() {
  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/admin/tags");
  revalidatePath("/admin/topics");
  revalidatePath("/admin/topics/[topicId]/edit", "page");
  revalidatePath("/admin/logs");
}

function createTagSlug(name: string) {
  return name
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createTopicTag(formData: FormData) {
  const name = getString(formData, "name").normalize("NFKC");

  if (!name) {
    redirectWithMessage("/admin/tags", "태그 이름을 입력해주세요.", "error");
  }

  if (name.length > 30) {
    redirectWithMessage(
      "/admin/tags",
      "태그 이름은 30자 이하로 입력해주세요.",
      "error",
    );
  }

  const slug = createTagSlug(name);

  if (!slug) {
    redirectWithMessage(
      "/admin/tags",
      "태그 이름으로 사용할 수 있는 글자를 입력해주세요.",
      "error",
    );
  }

  const { supabase } = await requireAdmin();

  const { data: existingByName } = await supabase
    .from("casual_topic_tags")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (existingByName) {
    redirectWithMessage("/admin/tags", "이미 등록된 태그 이름입니다.", "error");
  }

  const { data: existingBySlug } = await supabase
    .from("casual_topic_tags")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingBySlug) {
    redirectWithMessage("/admin/tags", "이미 등록된 태그 slug입니다.", "error");
  }

  const { data: tag, error } = await supabase
    .from("casual_topic_tags")
    .insert({
      name,
      slug,
    })
    .select("id")
    .single();

  if (error || !tag) {
    redirectWithMessage(
      "/admin/tags",
      error?.message ?? "태그를 생성하지 못했습니다.",
      "error",
    );
  }

  await createAdminAuditLog(supabase, {
    action: "tag_created",
    targetType: "tag",
    targetId: tag.id,
    message: "주제 태그를 생성했습니다.",
    metadata: {
      name,
      slug,
    },
  });

  revalidateTagPaths();

  redirectWithMessage("/admin/tags", "태그를 생성했습니다.", "success");
}

export async function deleteTopicTag(formData: FormData) {
  const tagId = getString(formData, "tagId");

  if (!tagId) {
    redirectWithMessage("/admin/tags", "태그 정보가 올바르지 않습니다.", "error");
  }

  const { supabase } = await requireAdmin();

  const { data: tag, error: tagError } = await supabase
    .from("casual_topic_tags")
    .select("id, name, slug")
    .eq("id", tagId)
    .maybeSingle();

  if (tagError || !tag) {
    redirectWithMessage(
      "/admin/tags",
      tagError?.message ?? "태그를 찾을 수 없습니다.",
      "error",
    );
  }

  const { count: linkedTopicCount, error: linkCountError } = await supabase
    .from("casual_topic_tag_links")
    .select("topic_id", { count: "exact", head: true })
    .eq("tag_id", tagId);

  if (linkCountError) {
    redirectWithMessage("/admin/tags", linkCountError.message, "error");
  }

  if ((linkedTopicCount ?? 0) > 0) {
    redirectWithMessage(
      "/admin/tags",
      "이 태그는 사용 중인 주제가 있어 삭제할 수 없습니다.",
      "error",
    );
  }

  const { error } = await supabase
    .from("casual_topic_tags")
    .delete()
    .eq("id", tagId);

  if (error) {
    redirectWithMessage("/admin/tags", error.message, "error");
  }

  await createAdminAuditLog(supabase, {
    action: "tag_deleted",
    targetType: "tag",
    targetId: tagId,
    message: "주제 태그를 삭제했습니다.",
    metadata: {
      name: tag.name,
      slug: tag.slug,
    },
  });

  revalidateTagPaths();

  redirectWithMessage("/admin/tags", "태그를 삭제했습니다.", "success");
}
