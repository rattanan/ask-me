import { NextResponse } from "next/server";
import type { PoolConnection } from "mysql2/promise";
import { isAuthResponse, withAdminUser } from "@/lib/api-auth";
import { getOwnedSessionQuestions } from "@/lib/storage";
import { generateInsights } from "@/lib/insights";
import { getPool, rows } from "@/lib/db";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request, context: { params: Promise<{sessionId:string}> }) {
  let connection: PoolConnection | undefined;
  let lock: string | undefined;
  try {
    const user = await withAdminUser(); if (isAuthResponse(user)) return user;
    const {sessionId} = await context.params;
    const questions = await getOwnedSessionQuestions(sessionId,user.id);
    if (!questions) return NextResponse.json({error:"ไม่พบ lecture นี้"},{status:404});
    if (!questions.length) return NextResponse.json({error:"ยังไม่มีคำถามสำหรับวิเคราะห์"},{status:400});
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({error:"กรุณาตั้งค่า OPENAI_API_KEY ที่เซิร์ฟเวอร์ก่อนใช้งาน"},{status:503});
    connection = await getPool().getConnection();
    const lockName = `insight:${sessionId}`;
    const result = await rows<{acquired:number}>("SELECT GET_LOCK(?, 0) AS acquired",[lockName],connection);
    if (result[0].acquired !== 1) return NextResponse.json({error:"กำลังวิเคราะห์ lecture นี้อยู่ กรุณารอสักครู่"},{status:409});
    lock = lockName;
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(280_000)]);
    return NextResponse.json(await generateInsights(questions,signal));
  } catch (error) {
    console.error("[insights] Request failed", { type: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({error:"วิเคราะห์ไม่สำเร็จ หรือ AI ส่งผลลัพธ์ไม่ครบ กรุณาลองใหม่อีกครั้ง"},{status:502});
  } finally {
    if (connection) {
      try {
        if (lock) await connection.execute("SELECT RELEASE_LOCK(?)",[lock]);
        connection.release();
      } catch {
        // Never turn a completed JSON response into an HTML 500 during cleanup.
        connection.destroy();
      }
    }
  }
}
