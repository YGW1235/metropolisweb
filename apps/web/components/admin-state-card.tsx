import type { CSSProperties, ReactNode } from "react";

type AdminStateTone = "default" | "warning" | "danger" | "success";

type AdminStateCardProps = {
  title: string;
  description: string;
  tone?: AdminStateTone;
  action?: ReactNode;
};

const toneStyles: Record<
  AdminStateTone,
  { label: string; borderColor: string; background: string; labelColor: string }
> = {
  default: {
    label: "안내",
    borderColor: "var(--theme-line)",
    background: "var(--theme-panel)",
    labelColor: "var(--theme-blue)",
  },
  warning: {
    label: "주의",
    borderColor: "var(--theme-gold)",
    background: "var(--theme-surface)",
    labelColor: "var(--theme-gold)",
  },
  danger: {
    label: "오류",
    borderColor: "var(--message-error-line)",
    background: "var(--message-error-bg)",
    labelColor: "var(--message-error-text)",
  },
  success: {
    label: "완료",
    borderColor: "var(--message-success-line)",
    background: "var(--message-success-bg)",
    labelColor: "var(--message-success-text)",
  },
};

export function AdminStateCard({
  title,
  description,
  tone = "default",
  action,
}: AdminStateCardProps) {
  const style = {
    borderColor: toneStyles[tone].borderColor,
    background: toneStyles[tone].background,
  } satisfies CSSProperties;

  return (
    <aside
      role={tone === "danger" ? "alert" : "status"}
      className="theme-card rounded-2xl p-5 text-left"
      style={style}
    >
      <p
        className="text-xs font-black uppercase tracking-[0.22em]"
        style={{ color: toneStyles[tone].labelColor }}
      >
        {toneStyles[tone].label}
      </p>
      <h2 className="mt-3 text-lg font-black text-[var(--theme-text)]">
        {title}
      </h2>
      <p className="mt-2 break-words text-sm leading-7 text-[var(--theme-muted)]">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </aside>
  );
}
