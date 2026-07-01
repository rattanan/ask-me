import { NextResponse } from "next/server";
import { getSessions, saveSession } from "@/lib/storage";
import { sessionSchema } from "@/lib/validation";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(await getSessions());
}

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = sessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const session = await saveSession(parsed.data);
  return NextResponse.json(session, { status: 201 });
}
