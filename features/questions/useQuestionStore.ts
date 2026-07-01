"use client";

import { create } from "zustand";
import type { Question, QuestionStats } from "@/lib/types";

interface QuestionState {
  questions: Question[];
  stats: QuestionStats;
  setQuestions: (questions: Question[], stats: QuestionStats) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (question: Question) => void;
  removeQuestion: (questionId: string) => void;
  clearQuestions: () => void;
}

const emptyStats: QuestionStats = {
  total: 0,
  questionsPerMinute: 0,
  mostUsedEmoji: "None",
};

function calculateStats(questions: Question[]): QuestionStats {
  const visible = questions.filter((question) => !question.hidden);
  const firstTime = visible.at(-1)?.createdAt ? Date.parse(visible.at(-1)!.createdAt) : Date.now();
  const minutes = Math.max((Date.now() - firstTime) / 60000, 1);
  const emojiCounts = visible.reduce<Record<string, number>>((accumulator, question) => {
    accumulator[question.emoji] = (accumulator[question.emoji] ?? 0) + 1;
    return accumulator;
  }, {});
  const mostUsedEmoji = Object.entries(emojiCounts).sort((first, second) => second[1] - first[1])[0]?.[0];
  return {
    total: visible.length,
    questionsPerMinute: Number((visible.length / minutes).toFixed(1)),
    mostUsedEmoji: mostUsedEmoji ? (mostUsedEmoji as QuestionStats["mostUsedEmoji"]) : "None",
  };
}

export const useQuestionStore = create<QuestionState>((set) => ({
  questions: [],
  stats: emptyStats,
  setQuestions: (questions, stats) => set({ questions, stats }),
  addQuestion: (question) =>
    set((state) => {
      const questions = [question, ...state.questions.filter((item) => item.id !== question.id)];
      return { questions, stats: calculateStats(questions) };
    }),
  updateQuestion: (question) =>
    set((state) => {
      const questions = state.questions.map((item) => (item.id === question.id ? question : item));
      return { questions, stats: calculateStats(questions) };
    }),
  removeQuestion: (questionId) =>
    set((state) => {
      const questions = state.questions.filter((question) => question.id !== questionId);
      return { questions, stats: calculateStats(questions) };
    }),
  clearQuestions: () => set({ questions: [], stats: emptyStats }),
}));
