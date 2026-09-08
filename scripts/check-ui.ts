import { chromium, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import { getPool } from "../lib/db";
import { upsertUser, saveSession, addQuestion } from "../lib/storage";
import { questionFingerprint } from "../lib/analytics";
import assert from "node:assert/strict";
loadEnvConfig(process.cwd());
async function main() {
 const tag=randomUUID();let owner="";
 const browser=await chromium.launch({headless:true,channel:"chrome"});
 try {
  const user=await upsertUser({googleId:tag,email:`ui-${tag}@example.test`,name:"UI Test",image:""});owner=user.id;
  const session=await saveSession(owner,{title:"Workshop: Docker / MySQL",description:"UI verification",presenter:"Demo",date:"2026-09-08",active:true,allowQuestions:true});
  const questions=await Promise.all(Array.from({length:15},(_,i)=>addQuestion({sessionId:session.id,name:["กมล","สมชาย","พรทิพย์","Anonymous"][i%4],question:`คำถามทดสอบ ${i+1}: สำรองข้อมูล MySQL บน Docker อย่างไร`,emoji:"🤔",color:"blue"})));
  const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:"reduce"});
  const token=await encode({secret:process.env.NEXTAUTH_SECRET!,token:{email:user.email,name:user.name,sub:user.id},maxAge:3600});
  await context.addCookies([{name:"next-auth.session-token",value:token,domain:"localhost",path:"/",httpOnly:true,sameSite:"Lax"}]);
  const page=await context.newPage();const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  let requests=0;
  await page.route(`**/api/admin/insights/${session.id}`,async route=>{requests++;if(requests===1){await route.fulfill({status:502,contentType:"text/html",body:"<!DOCTYPE html><h1>Bad Gateway</h1>"});return;}await new Promise(r=>setTimeout(r,800));await route.fulfill({json:{summary:"ผู้ฟังให้ความสนใจกับการเก็บข้อมูลถาวรและการสำรองข้อมูล MySQL บน Docker ควรสาธิตการกู้คืนข้อมูลเพื่อสร้างความเข้าใจ",categories:[{name:"การสำรองและกู้คืนข้อมูล",count:10,questionIds:questions.slice(0,10).map(q=>q.id)},{name:"การตั้งค่า Docker",count:5,questionIds:questions.slice(10).map(q=>q.id)}],insights:[{title:"ผู้ฟังต้องการตัวอย่างที่นำไปใช้ได้จริง",detail:"คำถามเน้นวิธีสำรองข้อมูลและการทำงานของ volume สะท้อนความต้องการฝึกปฏิบัติ",action:"สาธิตการสำรองและกู้คืนฐานข้อมูลแบบทีละขั้นตอน",questionIds:[questions[0].id]}],questionCount:15,generatedAt:new Date().toISOString(),fingerprint:questionFingerprint(questions)}});});
  await page.goto("http://localhost:3000/admin");await page.getByRole("button",{name:"Generate AI Insight",exact:true}).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("เซิร์ฟเวอร์กำลังอัปเดต");
  await page.getByRole("dialog").getByRole("button",{name:"Generate AI Insight",exact:true}).click();
  await page.getByRole("heading",{name:"Top 10 หมวดหมู่คำถาม",exact:true}).waitFor();
  assert.equal(requests,2);await expect(page.getByRole("heading",{name:"Top 10 หมวดหมู่คำถาม",exact:true})).toBeVisible();await page.getByRole("heading",{name:"Top 10 หมวดหมู่คำถาม",exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:"/tmp/ask-me-insights-desktop.png",fullPage:true});
  await page.getByRole("button",{name:"ดูคำถามอ้างอิง 1 ข้อ"}).click();await page.getByRole("region",{name:"คำถามอ้างอิง"}).waitFor();
  await page.setViewportSize({width:390,height:844});await page.getByRole("heading",{name:"Top 10 หมวดหมู่คำถาม",exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:"/tmp/ask-me-insights-mobile.png",fullPage:true});
  assert.ok(await page.locator("dialog").evaluate(el=>el.scrollWidth<=el.clientWidth));
  await page.keyboard.press("Escape");await page.locator("dialog").waitFor({state:"hidden"});
  assert.deepEqual(errors,[]);console.log("UI passed: per-lecture launch, report, chart evidence, mobile width, Escape and no runtime errors.");
 } finally {await browser.close();if(owner)await getPool().execute("DELETE FROM users WHERE id=?",[owner]);await getPool().end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
