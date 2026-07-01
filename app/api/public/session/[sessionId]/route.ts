import { NextResponse } from "next/server";
import { getPublicSession } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { sessionId } = await context.params;
  const session = await getPublicSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}
