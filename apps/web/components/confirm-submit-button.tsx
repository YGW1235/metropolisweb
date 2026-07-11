"use client";

import type { MouseEvent, ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
};

export function ConfirmSubmitButton({
  children,
  confirmMessage,
  className,
  disabled,
  title,
  ariaLabel,
}: ConfirmSubmitButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (disabled) {
      event.preventDefault();
      return;
    }

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={disabled}
      title={title ?? confirmMessage}
      aria-label={ariaLabel}
      className={[
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-gold)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
