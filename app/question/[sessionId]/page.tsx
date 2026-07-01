import Link from "next/link";
import { notFound } from "next/navigation";
import { QuestionForm } from "@/features/questions/QuestionForm";
import { getSession } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function QuestionPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-6">
      <section className="mx-auto max-w-xl">
        <Link className="text-sm font-semibold text-blue-600" href="/">
          Live Question Wall
        </Link>
        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="text-sm font-semibold text-blue-600">{session.active ? "Questions are open" : "Session is closed"}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">{session.title}</h1>
          {session.description ? <p className="mt-3 text-base leading-7 text-zinc-600">{session.description}</p> : null}
          <div className="mt-8">
            <QuestionForm sessionId={session.id} />
          </div>
        </div>
      </section>
    </main>
  );
}
