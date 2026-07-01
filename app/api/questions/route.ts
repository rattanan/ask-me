import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { publishQuestion } from "@/lib/events";
import { canSubmitQuestion } from "@/lib/rate-limit";
import { addQuestion, getSession } from "@/lib/storage";
import { questionSchema } from "@/lib/validation";

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = questionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const session = await getSession(parsed.data.sessionId);
  if (!session || !session.active) {
    return NextResponse.json({ error: "This session is not accepting questions" }, { status: 403 });
  }

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? "local";
  if (!canSubmitQuestion(`${ip}:${parsed.data.sessionId}`)) {
    return NextResponse.json({ error: "Please wait 10 seconds before submitting again" }, { status: 429 });
  }

  const question = await addQuestion(parsed.data);
  publishQuestion(question);
  return NextResponse.json(question, { status: 201 });
}
