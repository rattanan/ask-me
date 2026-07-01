"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { Copy, Download, Pencil, Play, Printer, Square, Trash2 } from "lucide-react";
import { AuthButton } from "@/components/AuthButton";
import { Button } from "@/components/Button";
import { Field, Input, Textarea } from "@/components/Field";
import type { AuthenticatedUser } from "@/lib/auth";
import type { Session } from "@/lib/types";
import { getQuestionUrl } from "@/lib/ui";

interface AdminHomeProps {
  initialOrigin: string;
  initialSessions: Session[];
  user: AuthenticatedUser;
}

interface SessionForm {
  title: string;
  description: string;
  presenter: string;
  date: string;
  active: boolean;
  allowQuestions: boolean;
}

const emptyForm: SessionForm = {
  title: "",
  description: "",
  presenter: "",
  date: new Date().toISOString().slice(0, 10),
  active: false,
  allowQuestions: true,
};

export function AdminHome({ initialOrigin, initialSessions, user }: AdminHomeProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [form, setForm] = useState<SessionForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    sessions.forEach((session) => {
      QRCode.toDataURL(getQuestionUrl(session.id, initialOrigin), { margin: 1, width: 220 }).then((value) => {
        setQrCodes((current) => ({ ...current, [session.id]: value }));
      });
    });
  }, [initialOrigin, sessions]);

  async function refreshSessions() {
    const response = await fetch("/api/admin/sessions");
    setSessions((await response.json()) as Session[]);
  }

  async function saveSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetch(editingId ? `/api/admin/sessions/${editingId}` : "/api/admin/sessions", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    setEditingId(null);
    await refreshSessions();
  }

  async function setActive(sessionId: string, active: boolean) {
    await fetch(`/api/admin/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    await refreshSessions();
  }

  async function deleteSession(sessionId: string) {
    await fetch(`/api/admin/sessions/${sessionId}`, { method: "DELETE" });
    await refreshSessions();
  }

  function editSession(session: Session) {
    setEditingId(session.id);
    setForm({
      title: session.title,
      description: session.description,
      presenter: session.presenter,
      date: session.date,
      active: session.active,
      allowQuestions: session.allowQuestions,
    });
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-6">
      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={saveSession} className="h-fit rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-blue-600">Admin</p>
            <AuthButton user={user} />
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">{editingId ? "Edit Lecture" : "Create Lecture"}</h1>
          <div className="mt-6 grid gap-4">
            <Field label="Title">
              <Input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <Field label="Presenter">
              <Input value={form.presenter} onChange={(event) => setForm({ ...form, presenter: event.target.value })} />
            </Field>
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </Field>
            <label className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-4 text-sm font-semibold text-zinc-700">
              <input checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} type="checkbox" />
              Active
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-4 text-sm font-semibold text-zinc-700">
              <input checked={form.allowQuestions} onChange={(event) => setForm({ ...form, allowQuestions: event.target.checked })} type="checkbox" />
              Allow Questions
            </label>
            <div className="flex gap-2">
              <Button className="flex-1" type="submit">{editingId ? "Save" : "Create"}</Button>
              {editingId ? <Button variant="secondary" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</Button> : null}
            </div>
          </div>
        </form>

        <div className="grid gap-4">
          {sessions.map((session) => {
            const url = getQuestionUrl(session.id, initialOrigin);
            return (
              <article className="rounded-[2rem] bg-white p-5 shadow-sm" key={session.id}>
                <div className="grid gap-5 xl:grid-cols-[1fr_220px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${session.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                        {session.active ? "Active" : "Inactive"}
                      </span>
                      <span className="text-sm font-medium text-zinc-500">{session.date}</span>
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-zinc-950">{session.title}</h2>
                    <p className="mt-2 max-w-2xl text-zinc-600">{session.description}</p>
                    <p className="mt-2 text-sm font-semibold text-zinc-500">{session.presenter}</p>
                    <p className="mt-4 break-all rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-500">{url}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => editSession(session)}><Pencil className="h-4 w-4" />Edit</Button>
                      <Button variant="secondary" onClick={() => setActive(session.id, !session.active)}>{session.active ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}{session.active ? "End Session" : "Start Session"}</Button>
                      <Button variant="secondary" onClick={() => navigator.clipboard.writeText(url)}><Copy className="h-4 w-4" />Copy URL</Button>
                      <Link className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200" href={`/admin/lectures/${session.id}/questions`}>Questions</Link>
                      <Link className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200" href={`/admin/lectures/${session.id}/wall`}>Wall</Link>
                      <Button variant="danger" onClick={() => deleteSession(session.id)}><Trash2 className="h-4 w-4" />Delete</Button>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-zinc-50 p-4 text-center">
                    {qrCodes[session.id] ? <Image className="mx-auto h-[180px] w-[180px]" src={qrCodes[session.id]} alt={`QR code for ${session.title}`} width={180} height={180} unoptimized /> : null}
                    <div className="mt-3 flex justify-center gap-2">
                      <a className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-3 text-sm font-semibold text-zinc-700" href={qrCodes[session.id]} download={`${session.id}-qr.png`}>
                        <Download className="h-4 w-4" />QR
                      </a>
                      <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {sessions.length === 0 ? <div className="rounded-[2rem] bg-white p-12 text-center text-zinc-500 shadow-sm">You have not created any lectures yet.</div> : null}
        </div>
      </section>
    </main>
  );
}
