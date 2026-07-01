"use client";

import { useEffect, useMemo, useState } from "react";
import { Maximize2, Shuffle } from "lucide-react";
import { Button } from "@/components/Button";
import { useQuestionStore } from "@/features/questions/useQuestionStore";
import { QuestionNote } from "@/features/wall/QuestionNote";
import type { Question, QuestionStats, Session } from "@/lib/types";

interface WallClientProps {
  initialQuestions: Question[];
  initialStats: QuestionStats;
  session: Session;
}

export function WallClient({ initialQuestions, initialStats, session }: WallClientProps) {
  const { questions, stats, setQuestions, addQuestion } = useQuestionStore();
  const [now, setNow] = useState(() => new Date());
  const [shuffleSeed, setShuffleSeed] = useState(0);

  useEffect(() => {
    setQuestions(initialQuestions, initialStats);
  }, [initialQuestions, initialStats, setQuestions]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const source = new EventSource(`/api/events/${session.id}`);
    source.addEventListener("question", (event) => {
      const question = JSON.parse((event as MessageEvent<string>).data) as Question;
      addQuestion(question);
    });
    return () => source.close();
  }, [addQuestion, session.id]);

  useEffect(() => {
    let cancelled = false;

    async function syncQuestions() {
      try {
        const response = await fetch(`/api/questions/${session.id}?includeHidden=false`, {
          cache: "no-store",
        });
        if (!response.ok || cancelled) {
          return;
        }
        const body = (await response.json()) as { questions: Question[]; stats: QuestionStats };
        setQuestions(body.questions, body.stats);
      } catch {
        return;
      }
    }

    const interval = setInterval(syncQuestions, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session.id, setQuestions]);

  const visibleQuestions = useMemo(() => {
    const filtered = questions.filter((question) => !question.hidden);
    if (shuffleSeed === 0) {
      return filtered;
    }
    return [...filtered].sort((first, second) => (first.id + shuffleSeed).localeCompare(second.id + shuffleSeed));
  }, [questions, shuffleSeed]);

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-50 px-5 py-5">
      <header className="mx-auto flex max-w-7xl flex-col gap-4 rounded-[1.75rem] bg-white/90 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-5xl">{session.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl bg-zinc-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Questions</p>
            <p className="text-2xl font-bold text-zinc-950">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-zinc-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Top emoji</p>
            <p className="text-2xl font-bold text-zinc-950">{stats.mostUsedEmoji}</p>
          </div>
          <Button variant="secondary" onClick={() => setShuffleSeed((seed) => seed + 1)}>
            <Shuffle className="h-4 w-4" />
            Shuffle
          </Button>
          <Button variant="secondary" onClick={() => document.documentElement.requestFullscreen().catch(() => undefined)}>
            <Maximize2 className="h-4 w-4" />
            Fullscreen
          </Button>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-7xl columns-1 gap-5 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
        {visibleQuestions.map((question, index) => (
          <QuestionNote index={index} key={question.id} question={question} />
        ))}
      </section>

      {visibleQuestions.length === 0 ? (
        <div className="grid min-h-[50vh] place-items-center text-center">
          <div>
            <p className="text-6xl">💡</p>
            <p className="mt-4 text-2xl font-bold text-zinc-950">Waiting for the first question</p>
            <p className="mt-2 text-zinc-500">New notes will appear here instantly.</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
