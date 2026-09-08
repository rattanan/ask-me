/** Never expose proxy HTML or raw JSON parsing errors to the interface. */
export async function readApiJson<T>(response: Response): Promise<T> {
  if (response.status === 401 || response.redirected) {
    throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง");
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    if ([408, 504, 524].includes(response.status)) {
      throw new Error("การวิเคราะห์ใช้เวลานานจนการเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง");
    }
    throw new Error("เซิร์ฟเวอร์กำลังอัปเดตหรือการเชื่อมต่อขัดข้อง กรุณารอสักครู่แล้วลองใหม่");
  }
  let body: T & { error?: unknown };
  try {
    body = await response.json();
  } catch {
    throw new Error("ได้รับผลลัพธ์ไม่ครบจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
  }
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : "คำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
  }
  return body;
}
