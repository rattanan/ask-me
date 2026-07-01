import type { NoteColor } from "@/lib/types";

export const colorClasses: Record<NoteColor, string> = {
  yellow: "bg-[#fff6b8]",
  pink: "bg-[#ffd6e7]",
  green: "bg-[#d8f8cf]",
  blue: "bg-[#d8ecff]",
  purple: "bg-[#eadcff]",
  orange: "bg-[#ffe0bd]",
};

export const colorLabels: Record<NoteColor, string> = {
  yellow: "Yellow",
  pink: "Pink",
  green: "Green",
  blue: "Blue",
  purple: "Purple",
  orange: "Orange",
};

export function getQuestionUrl(sessionId: string, origin?: string): string {
  const baseUrl = origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/question/${sessionId}`;
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
