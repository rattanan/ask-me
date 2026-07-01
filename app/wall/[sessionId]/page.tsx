import { notFound } from "next/navigation";
import { WallClient } from "@/features/wall/WallClient";
import { getQuestionStats, getSession, getSessionQuestions } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function WallPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) {
    notFound();
  }
  const questions = await getSessionQuestions(session.id, false);
  return <WallClient initialQuestions={questions} initialStats={getQuestionStats(questions)} session={session} />;
}
