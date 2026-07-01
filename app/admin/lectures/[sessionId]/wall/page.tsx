import { notFound, redirect } from "next/navigation";
import { WallClient } from "@/features/wall/WallClient";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedSession, getQuestionStats, getSessionQuestions } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function AdminWallPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const { sessionId } = await params;
  const session = await getOwnedSession(sessionId, user.id);
  if (!session) {
    notFound();
  }
  const questions = await getSessionQuestions(session.id, ["approved", "pinned"]);
  return <WallClient initialQuestions={questions} initialStats={getQuestionStats(questions)} session={session} />;
}
