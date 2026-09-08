"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Sparkles, X } from "lucide-react";
import { readApiJson } from "@/lib/api-response";
import { QuestionAnalytics } from "./QuestionAnalytics";
import type { Question, Session } from "@/lib/types";
export function LectureInsights({ session }: {session: Session}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController|null>(null);
  const [questions,setQuestions] = useState<Question[]|null>(null);
  const [error,setError] = useState("");
  const [open,setOpen] = useState(false);
  useEffect(()=>()=>request.current?.abort(),[]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/questions/${session.id}`, {signal:controller.signal});
        if (response.ok) { const data = await readApiJson<{questions:Question[]}>(response); setQuestions(data.questions); }
      } catch { /* Retry while the dialog remains open. */ }
    }, 5000);
    return () => { clearInterval(interval); controller.abort(); };
  }, [open, session.id]);
  async function show() {
    if (open) return;
    setQuestions(null); setError("");setOpen(true); dialog.current?.showModal();
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch(`/api/admin/questions/${session.id}`,{signal:controller.signal});
      const body = await readApiJson<{questions:Question[]}>(response);setQuestions(body.questions);
    } catch(e) {if (!controller.signal.aborted) setError(e instanceof Error?e.message:"โหลดคำถามไม่สำเร็จ");}
  }
  function close() { request.current?.abort();setOpen(false);dialog.current?.close(); }
  return <>
    <button onClick={show} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 active:scale-95"><Sparkles size={16}/>Generate AI Insight</button>
    <dialog ref={dialog} onCancel={close} onClose={()=>setOpen(false)} aria-labelledby={`insights-${session.id}`} className="fixed inset-0 m-auto max-h-[92dvh] w-[min(1200px,95vw)] overflow-y-auto rounded-[2rem] bg-zinc-50 p-5 shadow-2xl backdrop:bg-slate-950/60 sm:p-8">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-violet-600">Lecture insights</p><h2 id={`insights-${session.id}`} className="mt-2 text-2xl font-bold">{session.title}</h2><p className="mt-1 text-sm text-zinc-500">วิเคราะห์คำถามทุกสถานะ เฉพาะ lecture นี้เท่านั้น</p></div><button onClick={close} aria-label="ปิดผลวิเคราะห์" className="rounded-xl bg-white p-3 transition hover:bg-zinc-200"><X size={20}/></button></div>
      {open&&(questions?<QuestionAnalytics questions={questions} sessionId={session.id} autoGenerate/>:error?<p role="alert" className="py-10 text-red-600">{error}</p>:<p role="status" className="flex items-center gap-2 py-12 text-violet-700"><LoaderCircle className="motion-safe:animate-spin"/>กำลังโหลดคำถาม…</p>)}
    </dialog>
  </>;
}
