import { NextResponse } from "next/server";
import { isAuthResponse, withAdminUser } from "@/lib/api-auth";
import { getOwnedSessions, saveSession } from "@/lib/storage";
import { sessionSchema } from "@/lib/validation";

export async function GET(): Promise<NextResponse> {
  const user = await withAdminUser();
  if (isAuthResponse(user)) {
    return user;
  }
  return NextResponse.json(await getOwnedSessions(user.id));
}

export async function POST(request: Request): Promise<NextResponse> {
  const user = await withAdminUser();
  if (isAuthResponse(user)) {
    return user;
  }
  const parsed = sessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const session = await saveSession(user.id, parsed.data);
  return NextResponse.json(session, { status: 201 });
}
