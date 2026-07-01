import { NextResponse } from "next/server";
import { isAuthResponse, withAdminUser } from "@/lib/api-auth";
import {
  clearOwnedSessionQuestions,
  deleteOwnedQuestion,
  getOwnedSessionQuestions,
  getQuestionStats,
  updateOwnedQuestionStatus,
} from "@/lib/storage";
import { questionPatchSchema } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await withAdminUser();
  if (isAuthResponse(user)) {
    return user;
  }
  const { sessionId } = await context.params;
  const questions = await getOwnedSessionQuestions(sessionId, user.id);
  if (!questions) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ questions, stats: getQuestionStats(questions) });
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await withAdminUser();
  if (isAuthResponse(user)) {
    return user;
  }
  const { sessionId } = await context.params;
  const body = (await request.json()) as { id?: unknown };
  if (typeof body.id !== "string") {
    return NextResponse.json({ error: "Question id is required" }, { status: 400 });
  }
  const parsed = questionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const question = await updateOwnedQuestionStatus(sessionId, user.id, body.id, parsed.data.status);
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }
  return NextResponse.json(question);
}

export async function DELETE(request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await withAdminUser();
  if (isAuthResponse(user)) {
    return user;
  }
  const { sessionId } = await context.params;
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const question = await deleteOwnedQuestion(sessionId, user.id, id);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, question });
  }
  const cleared = await clearOwnedSessionQuestions(sessionId, user.id);
  if (!cleared) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
