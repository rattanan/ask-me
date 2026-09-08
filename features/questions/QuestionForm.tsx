"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/Button";
import { Field, Input, Textarea } from "@/components/Field";
import { EMOJIS, NOTE_COLORS, type Emoji, type NoteColor } from "@/lib/types";
import { colorClasses, colorLabels } from "@/lib/ui";

interface QuestionFormProps {
  sessionId: string;
}

export function QuestionForm({ sessionId }: QuestionFormProps) {
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [emoji, setEmoji] = useState<Emoji>("🤔");
  const [color, setColor] = useState<NoteColor>("yellow");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const submitting = useRef(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [showSuccess, successCount]);

  async function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setMessage("");
    setShowSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/public/questions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, name, question, emoji, color }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string | Record<string, string[]> };
        setMessage(typeof body.error === "string" ? body.error : "Please check your question and try again.");
        return;
      }
      setQuestion("");
      setSuccessCount((count) => count + 1);
      setShowSuccess(true);
    } catch {
      setMessage("ส่งคำถามไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitQuestion} className="grid gap-6">
      <Field label="Name (optional)">
        <Input maxLength={30} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
      </Field>

      <Field label="Question">
        <Textarea
          required
          disabled={isSubmitting}
          maxLength={200}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What would you like to ask?"
        />
        <span className="text-right text-xs font-medium text-zinc-500">{question.length}/200</span>
      </Field>

      <div className="grid gap-3">
        <p className="text-sm font-medium text-zinc-700">Emoji</p>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((item) => (
            <button
              aria-label={`Choose ${item}`}
              aria-pressed={emoji === item}
              className={`grid h-11 w-11 place-items-center rounded-2xl text-xl transition ${emoji === item ? "bg-blue-600 shadow-lg shadow-blue-600/20" : "bg-zinc-100 hover:bg-zinc-200"}`}
              key={item}
              onClick={() => setEmoji(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-medium text-zinc-700">Background Color</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {NOTE_COLORS.map((item) => (
            <button
              aria-pressed={color === item}
              className={`h-12 rounded-2xl border text-xs font-bold text-zinc-700 transition ${colorClasses[item]} ${color === item ? "border-blue-600 ring-4 ring-blue-100" : "border-transparent"}`}
              key={item}
              onClick={() => setColor(item)}
              type="button"
            >
              {colorLabels[item]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div aria-live="polite" aria-atomic="true" className="pointer-events-none absolute bottom-full left-0 right-0 z-10 mb-3 flex justify-center">
          <AnimatePresence>
            {showSuccess ? (
              <motion.div
                key={successCount}
                initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.94, y: reducedMotion ? 0 : 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, y: reducedMotion ? 0 : -6 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className="relative flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15"
              >
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                ส่งคำถามสำเร็จแล้ว
                <span aria-hidden="true" className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-emerald-600" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <Button className="h-14 w-full text-base" disabled={isSubmitting || question.trim().length === 0} type="submit">
          <Send className="h-5 w-5" />
          {isSubmitting ? "กำลังส่ง…" : "Submit"}
        </Button>
      </div>

      {message ? (
        <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{message}</p>
      ) : null}
    </form>
  );
}
