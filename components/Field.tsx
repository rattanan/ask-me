import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={`h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${className}`}
      {...rest}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      className={`min-h-32 resize-none rounded-2xl border border-zinc-200 bg-white p-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${className}`}
      {...rest}
    />
  );
}
