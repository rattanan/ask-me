"use client";

import { motion } from "framer-motion";
import type { Question } from "@/lib/types";
import { formatTime, colorClasses } from "@/lib/ui";

interface QuestionNoteProps {
  question: Question;
  index: number;
}

export function QuestionNote({ question, index }: QuestionNoteProps) {
  const rotations = [-2, -1, 0, 1, 2];
  const rotation = rotations[index % rotations.length];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.88, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`${colorClasses[question.color]} mb-5 inline-block w-[220px] break-inside-avoid rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.13)] ${question.status === "pinned" ? "ring-4 ring-blue-400" : ""}`}
      style={{ rotate: `${rotation}deg` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-3xl">{question.emoji}</span>
        {question.status === "pinned" ? <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold text-zinc-700">Pinned</span> : null}
      </div>
      <p className="whitespace-pre-wrap text-xl font-semibold leading-snug text-zinc-950">{question.question}</p>
      <div className="mt-4 flex items-center justify-between text-xs font-medium text-zinc-600">
        <span>{question.name}</span>
        <span>{formatTime(question.createdAt)}</span>
      </div>
    </motion.article>
  );
}
