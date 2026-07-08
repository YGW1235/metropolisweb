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

  return { supabase, user };
}

async function markReport(
  reportId: string,
  status: "resolved" | "dismissed",
  note: string,
  auditAction: "report_resolved" | "report_dismissed",
  auditMessage: string,
) {
  const { supabase, user } = await requireAdmin();

  const { data: report } = await supabase
    .from("casual_reports")
    .select("id, reason, target_type, target_id")
    .eq("id", reportId)
    .maybeSingle();

  const { error } = await supabase
    .from("casual_reports")
    .update({
      status,
      admin_note: note,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    redirectWithMessage("/admin/reports", error.message, "error");
  }

  await createAdminAuditLog(supabase, {
    action: auditAction,
    targetType: "report",
    targetId: reportId,
    message: auditMessage,
    metadata: {
      reportId,
      reason: report?.reason ?? null,
      note,
      status,
      targetType: report?.target_type ?? null,
      targetId: report?.target_id ?? null,
    },
  });

  revalidatePath("/admin/logs");
}

export async function dismissReport(formData: FormData) {
  const reportId = getString(formData, "reportId");
  const note = getString(formData, "adminNote");

  if (!reportId) {
    redirectWithMessage(
      "/admin/reports",
      "신고 정보가 올바르지 않습니다.",
      "error",
    );
  }

  await markReport(
    reportId,
    "dismissed",
    note || "기각",
    "report_dismissed",
    "신고를 기각했습니다.",
  );

  revalidatePath("/admin/reports");
  redirectWithMessage("/admin/reports", "신고를 기각했습니다.", "success");
}

export async function resolveReport(formData: FormData) {
  const reportId = getString(formData, "reportId");
  const note = getString(formData, "adminNote");

  if (!reportId) {
    redirectWithMessage(
      "/admin/reports",
      "신고 정보가 올바르지 않습니다.",
      "error",
    );
  }

  await markReport(
    reportId,
    "resolved",
    note || "처리 완료",
    "report_resolved",
    "신고를 처리 완료했습니다.",
  );

  revalidatePath("/admin/reports");
  redirectWithMessage("/admin/reports", "신고를 처리 완료했습니다.", "success");
}

export async function hideOpinionAndResolve(formData: FormData) {
  const reportId = getString(formData, "reportId");
  const opinionId = getString(formData, "targetId");
  const note = getString(formData, "adminNote");

  if (!reportId || !opinionId) {
    redirectWithMessage(
      "/admin/reports",
      "신고 또는 의견 정보가 올바르지 않습니다.",
      "error",
    );
  }

  const { supabase, user } = await requireAdmin();

  const { data: opinion, error: readError } = await supabase
    .from("casual_opinions")
    .select("id, topic_id, user_id")
    .eq("id", opinionId)
    .single();

  if (readError || !opinion) {
    redirectWithMessage(
      "/admin/reports",
      readError?.message ?? "의견을 찾을 수 없습니다.",
      "error",
    );
  }

  const { data: report } = await supabase
    .from("casual_reports")
    .select("reason")
    .eq("id", reportId)
    .maybeSingle();

  const { error: hideError } = await supabase
    .from("casual_opinions")
    .update({ is_hidden: true })
    .eq("id", opinionId);

  if (hideError) {
    redirectWithMessage("/admin/reports", hideError.message, "error");
  }

  const { error: reportError } = await supabase
    .from("casual_reports")
    .update({
      status: "resolved",
      admin_note: note || "의견 숨김 처리",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (reportError) {
    redirectWithMessage("/admin/reports", reportError.message, "error");
  }

  await createAdminAuditLog(supabase, {
    action: "opinion_hidden",
    targetType: "opinion",
    targetId: opinionId,
    targetUserId: opinion.user_id,
    message: "신고된 의견을 숨김 처리했습니다.",
    metadata: {
      reportId,
      reason: report?.reason ?? null,
      note: note || "의견 숨김 처리",
      topicId: opinion.topic_id,
    },
  });

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${opinion.topic_id}`);
  revalidatePath("/admin/reports");
  revalidatePath("/admin/logs");

  redirectWithMessage("/admin/reports", "의견을 숨김 처리했습니다.", "success");
}

export async function unhideOpinion(formData: FormData) {
  const opinionId = getString(formData, "targetId");

  if (!opinionId) {
    redirectWithMessage("/admin/reports", "의견 정보가 올바르지 않습니다.", "error");
  }

  const { supabase } = await requireAdmin();

  const { data: opinion, error: readError } = await supabase
    .from("casual_opinions")
    .select("id, topic_id, user_id")
    .eq("id", opinionId)
    .single();

  if (readError || !opinion) {
    redirectWithMessage(
      "/admin/reports",
      readError?.message ?? "의견을 찾을 수 없습니다.",
      "error",
    );
  }

  const { error } = await supabase
    .from("casual_opinions")
    .update({ is_hidden: false })
    .eq("id", opinionId);

  if (error) {
    redirectWithMessage("/admin/reports", error.message, "error");
  }

  await createAdminAuditLog(supabase, {
    action: "opinion_unhidden",
    targetType: "opinion",
    targetId: opinionId,
    targetUserId: opinion.user_id,
    message: "의견 숨김을 해제했습니다.",
    metadata: {
      topicId: opinion.topic_id,
    },
  });

  revalidatePath(`/topics/${opinion.topic_id}`);
  revalidatePath("/admin/reports");
  revalidatePath("/admin/logs");

  redirectWithMessage("/admin/reports", "의견 숨김을 해제했습니다.", "success");
}

export async function closeTopicAndResolve(formData: FormData) {
  const reportId = getString(formData, "reportId");
  const topicId = getString(formData, "targetId");
  const note = getString(formData, "adminNote");

  if (!reportId || !topicId) {
    redirectWithMessage(
      "/admin/reports",
      "신고 또는 주제 정보가 올바르지 않습니다.",
      "error",
    );
  }

  const { supabase, user } = await requireAdmin();

  const { data: topic } = await supabase
    .from("casual_topics")
    .select("id, title, created_by")
    .eq("id", topicId)
    .maybeSingle();

  const { data: report } = await supabase
    .from("casual_reports")
    .select("reason")
    .eq("id", reportId)
    .maybeSingle();

  const { error: topicError } = await supabase
    .from("casual_topics")
    .update({
      status: "closed",
      is_today: false,
    })
    .eq("id", topicId);

  if (topicError) {
    redirectWithMessage("/admin/reports", topicError.message, "error");
  }

  const { error: reportError } = await supabase
    .from("casual_reports")
    .update({
      status: "resolved",
      admin_note: note || "주제 종료 처리",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (reportError) {
    redirectWithMessage("/admin/reports", reportError.message, "error");
  }

  await createAdminAuditLog(supabase, {
    action: "topic_closed",
    targetType: "topic",
    targetId: topicId,
    targetUserId: topic?.created_by ?? null,
    message: "신고된 주제를 종료 처리했습니다.",
    metadata: {
      reportId,
      reason: report?.reason ?? null,
      note: note || "주제 종료 처리",
      title: topic?.title ?? null,
      status: "closed",
    },
  });

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath("/admin/reports");
  revalidatePath("/admin/logs");

  redirectWithMessage("/admin/reports", "주제를 종료 처리했습니다.", "success");
}

export async function hideCommentAndResolve(formData: FormData) {
  const reportId = getString(formData, "reportId");
  const commentId = getString(formData, "targetId");
  const note = getString(formData, "adminNote");

  if (!reportId || !commentId) {
    redirectWithMessage(
      "/admin/reports",
      "신고 또는 댓글 정보가 올바르지 않습니다.",
      "error",
    );
  }

  const { supabase, user } = await requireAdmin();

  const { data: comment, error: readError } = await supabase
    .from("casual_comments")
    .select("id, opinion_id, user_id")
    .eq("id", commentId)
    .single();

  if (readError || !comment) {
    redirectWithMessage(
      "/admin/reports",
      readError?.message ?? "댓글을 찾을 수 없습니다.",
      "error",
    );
  }

  const { data: opinion } = await supabase
    .from("casual_opinions")
    .select("topic_id")
    .eq("id", comment.opinion_id)
    .maybeSingle();

  const { data: report } = await supabase
    .from("casual_reports")
    .select("reason")
    .eq("id", reportId)
    .maybeSingle();

  const { error: hideError } = await supabase
    .from("casual_comments")
    .update({ is_hidden: true })
    .eq("id", commentId);

  if (hideError) {
    redirectWithMessage("/admin/reports", hideError.message, "error");
  }

  const { error: reportError } = await supabase
    .from("casual_reports")
    .update({
      status: "resolved",
      admin_note: note || "댓글 숨김 처리",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (reportError) {
    redirectWithMessage("/admin/reports", reportError.message, "error");
  }

  await createAdminAuditLog(supabase, {
    action: "comment_hidden",
    targetType: "comment",
    targetId: commentId,
    targetUserId: comment.user_id,
    message: "신고된 댓글을 숨김 처리했습니다.",
    metadata: {
      reportId,
      reason: report?.reason ?? null,
      note: note || "댓글 숨김 처리",
      opinionId: comment.opinion_id,
      topicId: opinion?.topic_id ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath("/topics");

  if (opinion?.topic_id) {
    revalidatePath(`/topics/${opinion.topic_id}`);
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin/logs");

  redirectWithMessage("/admin/reports", "댓글을 숨김 처리했습니다.", "success");
}

export async function unhideComment(formData: FormData) {
  const commentId = getString(formData, "targetId");

  if (!commentId) {
    redirectWithMessage("/admin/reports", "댓글 정보가 올바르지 않습니다.", "error");
  }

  const { supabase } = await requireAdmin();

  const { data: comment, error: readError } = await supabase
    .from("casual_comments")
    .select("id, opinion_id, user_id")
    .eq("id", commentId)
    .single();

  if (readError || !comment) {
    redirectWithMessage(
      "/admin/reports",
      readError?.message ?? "댓글을 찾을 수 없습니다.",
      "error",
    );
  }

  const { data: opinion } = await supabase
    .from("casual_opinions")
    .select("topic_id")
    .eq("id", comment.opinion_id)
    .maybeSingle();

  const { error } = await supabase
    .from("casual_comments")
    .update({ is_hidden: false })
    .eq("id", commentId);

  if (error) {
    redirectWithMessage("/admin/reports", error.message, "error");
  }

  await createAdminAuditLog(supabase, {
    action: "comment_unhidden",
    targetType: "comment",
    targetId: commentId,
    targetUserId: comment.user_id,
    message: "댓글 숨김을 해제했습니다.",
    metadata: {
      opinionId: comment.opinion_id,
      topicId: opinion?.topic_id ?? null,
    },
  });

  if (opinion?.topic_id) {
    revalidatePath(`/topics/${opinion.topic_id}`);
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin/logs");

  redirectWithMessage("/admin/reports", "댓글 숨김을 해제했습니다.", "success");
}
