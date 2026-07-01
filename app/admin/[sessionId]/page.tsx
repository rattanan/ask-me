import { notFound } from "next/navigation";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { getQuestionStats, getSession, getSessionQuestions } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function AdminSessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) {
    notFound();
  }
  const questions = await getSessionQuestions(session.id);
  return <AdminDashboard initialQuestions={questions} initialStats={getQuestionStats(questions)} session={session} />;
}
