import type { ReactNode } from "react";

type FormMessageType = "success" | "error" | "info" | "warning";

type FormMessageProps = {
  type: FormMessageType;
  children: ReactNode;
  className?: string;
};

const toneStyles: Record<
  FormMessageType,
  {
    label: string;
    borderColor: string;
    background: string;
    color: string;
  }
> = {
  success: {
    label: "성공",
    borderColor: "var(--message-success-line)",
    background: "var(--message-success-bg)",
    color: "var(--message-success-text)",
  },
  error: {
    label: "오류",
    borderColor: "var(--message-error-line)",
    background: "var(--message-error-bg)",
    color: "var(--message-error-text)",
  },
  info: {
    label: "안내",
    borderColor: "var(--theme-line)",
    background: "var(--theme-surface)",
    color: "var(--theme-text)",
  },
  warning: {
    label: "주의",
    borderColor: "var(--theme-gold)",
    background: "var(--theme-surface)",
    color: "var(--theme-text)",
  },
};

export function FormMessage({ type, children, className }: FormMessageProps) {
  const tone = toneStyles[type];
  const role = type === "error" || type === "warning" ? "alert" : "status";

  return (
    <div
      role={role}
      className={[
        "rounded-2xl border p-4 text-sm font-bold leading-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        borderColor: tone.borderColor,
        background: tone.background,
        color: tone.color,
      }}
    >
      <span className="sr-only">{tone.label}: </span>
      {children}
    </div>
  );
}
