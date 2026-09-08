import { NextResponse } from "next/server";
import { isAuthResponse, withAdminUser } from "@/lib/api-auth";
import { getOwnedSessionQuestions } from "@/lib/storage";
import { generateInsights } from "@/lib/insights";
import { getPool, rows } from "@/lib/db";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request, context: { params: Promise<{sessionId:string}> }) {
  const user = await withAdminUser(); if (isAuthResponse(user)) return user;
  const {sessionId} = await context.params;
  const questions = await getOwnedSessionQuestions(sessionId,user.id);
  if (!questions) return NextResponse.json({error:"ไม่พบ lecture นี้"},{status:404});
  if (!questions.length) return NextResponse.json({error:"ยังไม่มีคำถามสำหรับวิเคราะห์"},{status:400});
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({error:"กรุณาตั้งค่า OPENAI_API_KEY ที่เซิร์ฟเวอร์ก่อนใช้งาน"},{status:503});
  const connection = await getPool().getConnection();
  const lock = `insight:${sessionId}`;
  let locked = false;
  try {
    const result = await rows<{acquired:number}>("SELECT GET_LOCK(?, 0) AS acquired",[lock],connection);
    locked = result[0].acquired === 1;
    if (!locked) return NextResponse.json({error:"กำลังวิเคราะห์ lecture นี้อยู่ กรุณารอสักครู่"},{status:409});
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(280_000)]);
    return NextResponse.json(await generateInsights(questions,signal));
  } catch {
    return NextResponse.json({error:"วิเคราะห์ไม่สำเร็จ หรือ AI ส่งผลลัพธ์ไม่ครบ กรุณาลองใหม่ และตรวจการตั้งค่า AI ที่เซิร์ฟเวอร์"},{status:502});
  } finally {
    try { if (locked) await connection.execute("SELECT RELEASE_LOCK(?)",[lock]); }
    finally { connection.release(); }
  }
}
