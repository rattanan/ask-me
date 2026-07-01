"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, EyeOff, Highlighter, Pin, Search, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Field";
import { useQuestionStore } from "@/features/questions/useQuestionStore";
import type { Question, QuestionStats, Session } from "@/lib/types";
import { colorClasses, formatTime } from "@/lib/ui";

interface AdminDashboardProps {
  initialQuestions: Question[];
  initialStats: QuestionStats;
  session: Session;
}

export function AdminDashboard({ initialQuestions, initialStats, session }: AdminDashboardProps) {
  const { questions, stats, setQuestions, updateQuestion, removeQuestion, clearQuestions } = useQuestionStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    setQuestions(initialQuestions, initialStats);
  }, [initialQuestions, initialStats, setQuestions]);

  const filteredQuestions = useMemo(() => {
    const query = search.toLowerCase();
    return questions.filter((question) => `${question.question} ${question.name} ${question.emoji}`.toLowerCase().includes(query));
  }, [questions, search]);

  async function patchQuestion(question: Question, patch: Partial<Question>) {
    const response = await fetch(`/api/questions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: question.id, ...patch }),
    });
    updateQuestion((await response.json()) as Question);
  }

  async function deleteOne(questionId: string) {
    await fetch(`/api/questions/${session.id}?id=${questionId}`, { method: "DELETE" });
    removeQuestion(questionId);
  }

  async function clearSession() {
    await fetch(`/api/questions/${session.id}`, { method: "DELETE" });
    clearQuestions();
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${session.id}-questions.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-6">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">Dashboard</p>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-950">{session.title}</h1>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Questions" value={stats.total.toString()} />
              <Stat label="Per min" value={stats.questionsPerMinute.toString()} />
              <Stat label="Top emoji" value={stats.mostUsedEmoji} />
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
              <Input className="w-full pl-10" placeholder="Search questions" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Button variant="secondary" onClick={exportJson}><Download className="h-4 w-4" />Export JSON</Button>
            <Button variant="danger" onClick={clearSession}>Clear Session</Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {filteredQuestions.map((question) => (
            <article className={`rounded-[1.5rem] p-4 shadow-sm ${colorClasses[question.color]} ${question.hidden ? "opacity-45" : ""}`} key={question.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
                    <span className="text-2xl">{question.emoji}</span>
                    <span>{question.name}</span>
                    <span>{formatTime(question.createdAt)}</span>
                    {question.pinned ? <span>Pinned</span> : null}
                    {question.highlighted ? <span>Highlighted</span> : null}
                  </div>
                  <p className="mt-2 text-xl font-bold text-zinc-950">{question.question}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => patchQuestion(question, { pinned: !question.pinned })}><Pin className="h-4 w-4" />Pin</Button>
                  <Button variant="secondary" onClick={() => patchQuestion(question, { highlighted: !question.highlighted })}><Highlighter className="h-4 w-4" />Highlight</Button>
                  <Button variant="secondary" onClick={() => patchQuestion(question, { hidden: !question.hidden })}><EyeOff className="h-4 w-4" />Hide</Button>
                  <Button variant="secondary" onClick={() => patchQuestion(question, { liked: question.liked + 1 })}><Star className="h-4 w-4" />{question.liked}</Button>
                  <Button variant="danger" onClick={() => deleteOne(question.id)}><Trash2 className="h-4 w-4" />Delete</Button>
                </div>
              </div>
            </article>
          ))}
          {filteredQuestions.length === 0 ? <div className="rounded-[2rem] bg-white p-12 text-center text-zinc-500 shadow-sm">No questions yet.</div> : null}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-100 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-xl font-bold text-zinc-950">{value}</p>
    </div>
  );
}
