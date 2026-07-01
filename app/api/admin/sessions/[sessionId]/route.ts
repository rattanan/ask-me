import { NextResponse } from "next/server";
import { isAuthResponse, withAdminUser } from "@/lib/api-auth";
import { deleteOwnedSession, getOwnedSession, saveSession, setOwnedSessionActive } from "@/lib/storage";
import { sessionSchema } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await withAdminUser();
  if (isAuthResponse(user)) {
    return user;
  }
  const { sessionId } = await context.params;
  const session = await getOwnedSession(sessionId, user.id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function PUT(request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await withAdminUser();
  if (isAuthResponse(user)) {
    return user;
  }
  const { sessionId } = await context.params;
  const existing = await getOwnedSession(sessionId, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const parsed = sessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const session = await saveSession(user.id, parsed.data, sessionId);
  return NextResponse.json(session);
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await withAdminUser();
  if (isAuthResponse(user)) {
    return user;
  }
  const { sessionId } = await context.params;
  const body = (await request.json()) as { active?: unknown };
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "active must be a boolean" }, { status: 400 });
  }
  const session = await setOwnedSessionActive(sessionId, user.id, body.active);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await withAdminUser();
  if (isAuthResponse(user)) {
    return user;
  }
  const { sessionId } = await context.params;
  const deleted = await deleteOwnedSession(sessionId, user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
