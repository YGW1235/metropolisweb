import { Resend } from "resend";

type ContactInquiryNotificationArgs = {
  inquiryId?: string | null;
  email: string;
  category: string;
  title: string;
  content: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    general: "일반 문의",
    account: "계정 문의",
    report: "신고/운영 문의",
    bug: "버그 제보",
    partnership: "제휴/협업",
    other: "기타",
  };

  return labels[category] ?? category;
}

export async function sendContactInquiryNotification({
  inquiryId,
  email,
  category,
  title,
  content,
}: ContactInquiryNotificationArgs) {
  const resend = getResendClient();
  const from = process.env.CONTACT_EMAIL_FROM;
  const to = process.env.CONTACT_NOTIFY_TO;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://metropolisweb.vercel.app";

  if (!resend || !from || !to) {
    console.warn("[contact notification skipped] Missing email env vars");
    return;
  }

  const adminUrl = `${siteUrl}/admin/inquiries`;

  const safeTitle = escapeHtml(title);
  const safeEmail = escapeHtml(email);
  const safeContent = escapeHtml(content);
  const safeCategory = escapeHtml(categoryLabel(category));

  const subject = `[Metropolis 문의] ${safeTitle}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
      <h1 style="font-size: 20px;">새 문의가 접수되었습니다</h1>

      <p><strong>문의 ID:</strong> ${escapeHtml(inquiryId ?? "-")}</p>
      <p><strong>유형:</strong> ${safeCategory}</p>
      <p><strong>답변 이메일:</strong> ${safeEmail}</p>
      <p><strong>제목:</strong> ${safeTitle}</p>

      <div style="margin-top: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; white-space: pre-wrap;">
        ${safeContent}
      </div>

      <p style="margin-top: 20px;">
        <a href="${adminUrl}" style="color: #2563eb;">관리자 문의 관리 페이지 열기</a>
      </p>
    </div>
  `;

  const text = [
    "새 문의가 접수되었습니다.",
    "",
    `문의 ID: ${inquiryId ?? "-"}`,
    `유형: ${categoryLabel(category)}`,
    `답변 이메일: ${email}`,
    `제목: ${title}`,
    "",
    content,
    "",
    `관리자 페이지: ${adminUrl}`,
  ].join("\n");

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("[contact notification failed]", error);
  }
}