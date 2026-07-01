import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function LecturePage({ params }: PageProps) {
  const { sessionId } = await params;
  redirect(`/admin/lectures/${sessionId}/questions`);
}
