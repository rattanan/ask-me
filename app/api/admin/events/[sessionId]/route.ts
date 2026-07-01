import { NextResponse } from "next/server";
import { isAuthResponse, withAdminUser } from "@/lib/api-auth";
import { subscribeToQuestions } from "@/lib/events";
import { getOwnedSession, getSessionQuestions } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const user = await withAdminUser();
  if (isAuthResponse(user)) {
    return user;
  }
  const { sessionId } = await context.params;
  const session = await getOwnedSession(sessionId, user.id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sentQuestionIds = new Set<string>();
      const initialQuestions = await getSessionQuestions(sessionId, ["approved", "pinned"]);
      initialQuestions.forEach((question) => sentQuestionIds.add(question.id));

      controller.enqueue(encoder.encode("event: ready\ndata: {}\n\n"));
      const unsubscribe = subscribeToQuestions(sessionId, (question) => {
        if (question.status === "approved" || question.status === "pinned") {
          sentQuestionIds.add(question.id);
          controller.enqueue(encoder.encode(`event: question\ndata: ${JSON.stringify(question)}\n\n`));
        }
      });
      const heartbeat = setInterval(async () => {
        const questions = await getSessionQuestions(sessionId, ["approved", "pinned"]);
        const newQuestions = questions
          .filter((question) => !sentQuestionIds.has(question.id))
          .sort((first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt));
        newQuestions.forEach((question) => {
          sentQuestionIds.add(question.id);
          controller.enqueue(encoder.encode(`event: question\ndata: ${JSON.stringify(question)}\n\n`));
        });
        controller.enqueue(encoder.encode("event: heartbeat\ndata: {}\n\n"));
      }, 1000);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
      request.signal.addEventListener("abort", cleanup, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
}
