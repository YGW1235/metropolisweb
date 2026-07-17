"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type SubmitButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & {
  children: ReactNode;
  pendingText?: ReactNode;
  type?: "submit";
};

export function SubmitButton({
  children,
  className = "",
  disabled = false,
  pendingText,
  type = "submit",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      {...props}
      aria-disabled={isDisabled}
      className={`${className} ${
        isDisabled ? "cursor-not-allowed opacity-60 pointer-events-none" : ""
      }`}
      disabled={isDisabled}
      type={type}
    >
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}
