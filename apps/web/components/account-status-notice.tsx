type AccountStatusNoticeProps = {
  status: string | null | undefined;
  reason?: string | null;
  changedAt?: string | null;
};

function statusLabel(status: string) {
  if (status === "suspended") return "정지";
  if (status === "deleted") return "삭제";
  if (status === "active") return "활성";
  return status;
}

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
}

export function AccountStatusNotice({
  status,
  reason,
  changedAt,
}: AccountStatusNoticeProps) {
  if (!status || status === "active") {
    return null;
  }

  const changedAtText = formatDate(changedAt);

  return (
    <div className="rounded-2xl border border-[var(--message-error-line)] bg-[var(--message-error-bg)] p-5 text-[var(--message-error-text)]">
      <p className="text-sm font-semibold">계정 이용 제한 안내</p>

      <p className="mt-2 text-sm">
        현재 계정 상태는 <span className="font-semibold">{statusLabel(status)}</span>
        입니다. 이 상태에서는 주제 참가, 게시글 작성, 댓글 작성이 제한될 수 있습니다.
      </p>

      {reason ? (
        <p className="mt-3 whitespace-pre-line break-words text-sm">
          사유: {reason}
        </p>
      ) : null}

      {changedAtText ? (
        <p className="mt-2 text-xs opacity-80">
          상태 변경 시간: {changedAtText}
        </p>
      ) : null}
    </div>
  );
}
