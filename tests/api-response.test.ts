import { test } from "node:test";
import assert from "node:assert/strict";
import { readApiJson } from "../lib/api-response";
test("proxy HTML produces a friendly retry message, not a JSON syntax error", async () => {
  await assert.rejects(readApiJson(new Response("<!DOCTYPE html><h1>Bad Gateway</h1>", {status:502,headers:{"Content-Type":"text/html"}})), /เซิร์ฟเวอร์กำลังอัปเดต/);
});
test("timeout, expired session, malformed JSON, and API errors have actionable messages", async () => {
  await assert.rejects(readApiJson(new Response("<!DOCTYPE html>",{status:524})), /หมดเวลา/);
  await assert.rejects(readApiJson(Response.json({}, {status:401})), /เข้าสู่ระบบใหม่/);
  await assert.rejects(readApiJson(new Response("{",{headers:{"content-type":"application/json"}})), /ผลลัพธ์ไม่ครบ/);
  await assert.rejects(readApiJson(Response.json({error:"กำลังวิเคราะห์"},{status:409})), /กำลังวิเคราะห์/);
});
test("successful JSON is preserved", async () => {
  assert.deepEqual(await readApiJson(Response.json({questionCount:11})),{questionCount:11});
});
