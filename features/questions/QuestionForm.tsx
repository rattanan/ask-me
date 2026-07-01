"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  async function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/public/questions/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, name, question, emoji, color }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string | Record<string, string[]> };
      setMessage(typeof body.error === "string" ? body.error : "Please check your question and try again.");
      setIsSubmitting(false);
      return;
    }

    setName("");
    setQuestion("");
    setEmoji("🤔");
    setColor("yellow");
    setSuccessCount((count) => count + 1);
    setMessage("Question sent for review");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={submitQuestion} className="grid gap-6">
      <Field label="Name (optional)">
        <Input maxLength={30} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
      </Field>

      <Field label="Question">
        <Textarea
          required
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

      <Button className="h-14 text-base" disabled={isSubmitting || question.trim().length === 0} type="submit">
        <Send className="h-5 w-5" />
        Submit
      </Button>

      <AnimatePresence>
        {message ? (
          <motion.div
            key={`${message}-${successCount}`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${message === "Question sent for review" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
          >
            {message === "Question sent for review" ? <Sparkles className="h-4 w-4" /> : null}
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
