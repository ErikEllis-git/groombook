"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
};

/** Submit button that disables itself while its form's action is running. */
export function SubmitButton({
  children,
  pendingText,
  className,
  name,
  value,
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-disabled={pending}
      className={`${className ?? ""} disabled:cursor-wait disabled:opacity-60`}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
