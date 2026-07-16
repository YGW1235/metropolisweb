"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  children: ReactNode;
  pendingText?: ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
};

export function PendingSubmitButton({
  children,
  pendingText = "처리 중...",
  className,
  disabled,
  title,
  ariaLabel,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || Boolean(disabled);

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={ariaLabel}
      title={title}
      className={[
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-gold)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {pending ? pendingText : children}
    </button>
  );
}
