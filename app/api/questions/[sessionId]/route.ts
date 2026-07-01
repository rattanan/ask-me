import { NextResponse } from "next/server";
import { clearSessionQuestions, deleteQuestion, getQuestionStats, getSessionQuestions, updateQuestion } from "@/lib/storage";
import { questionPatchSchema } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  const { sessionId } = await context.params;
  const includeHidden = new URL(request.url).searchParams.get("includeHidden") !== "false";
  const questions = await getSessionQuestions(sessionId, includeHidden);
  return NextResponse.json({ questions, stats: getQuestionStats(questions) });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { id?: unknown };
  if (typeof body.id !== "string") {
    return NextResponse.json({ error: "Question id is required" }, { status: 400 });
  }
  const parsed = questionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const question = await updateQuestion(body.id, parsed.data);
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }
  return NextResponse.json(question);
}

export async function DELETE(request: Request, context: RouteContext): Promise<NextResponse> {
  const { sessionId } = await context.params;
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const question = await deleteQuestion(id);
    return NextResponse.json({ ok: true, question });
  }
  await clearSessionQuestions(sessionId);
  return NextResponse.json({ ok: true });
}
