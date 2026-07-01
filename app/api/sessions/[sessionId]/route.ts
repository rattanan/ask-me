import { NextResponse } from "next/server";
import { deleteSession, getSession, saveSession, setActiveSession } from "@/lib/storage";
import { sessionSchema } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { sessionId } = await context.params;
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function PUT(request: Request, context: RouteContext): Promise<NextResponse> {
  const { sessionId } = await context.params;
  const parsed = sessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const session = await saveSession(parsed.data, sessionId);
  return NextResponse.json(session);
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const { sessionId } = await context.params;
  const body = (await request.json()) as { active?: unknown };
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "active must be a boolean" }, { status: 400 });
  }
  const session = await setActiveSession(sessionId, body.active);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { sessionId } = await context.params;
  await deleteSession(sessionId);
  return NextResponse.json({ ok: true });
}
