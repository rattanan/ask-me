import { subscribeToQuestions } from "@/lib/events";
import { getSessionQuestions } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { sessionId } = await context.params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sentQuestionIds = new Set<string>();
      const initialQuestions = await getSessionQuestions(sessionId, false);
      initialQuestions.forEach((question) => sentQuestionIds.add(question.id));

      controller.enqueue(encoder.encode("event: ready\ndata: {}\n\n"));
      const unsubscribe = subscribeToQuestions(sessionId, (question) => {
        sentQuestionIds.add(question.id);
        controller.enqueue(encoder.encode(`event: question\ndata: ${JSON.stringify(question)}\n\n`));
      });
      const heartbeat = setInterval(async () => {
        const questions = await getSessionQuestions(sessionId, false);
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
      _request.signal.addEventListener("abort", cleanup, { once: true });
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
