import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { getPool } from "../lib/db";
import { upsertUser, saveSession, addQuestion, getOwnedSessionQuestions, updateOwnedQuestionStatus, setOwnedSessionActive, deleteOwnedSession, getOwnedSessions } from "../lib/storage";
loadEnvConfig(process.cwd());
test("MySQL: owner isolation, all statuses, concurrent writes, cascade and active-session invariant", {skip:process.env.MYSQL_INTEGRATION!=="1"},async()=>{
 const tag=randomUUID(); const owners:string[]=[];
 try {
  const a=await upsertUser({googleId:tag,email:`${tag}@example.test`,name:"Integration A",image:""});owners.push(a.id);
  const b=await upsertUser({googleId:tag+"b",email:`b${tag}@example.test`,name:"Integration B",image:""});owners.push(b.id);
  const input={title:"Integration lecture",description:"",presenter:"",date:"2026-09-08",active:true,allowQuestions:true};
  const s=await saveSession(a.id,input); const other=await saveSession(b.id,input);
  const submitted=await Promise.all(Array.from({length:12},(_,i)=>addQuestion({sessionId:s.id,name:"ผู้ถาม",question:`ภาษาไทย ${i} 🚀`,emoji:"🚀",color:"blue"})));
  await addQuestion({sessionId:other.id,name:"Other",question:"Other lecture only",emoji:"🤔",color:"blue"});
  await updateOwnedQuestionStatus(s.id,a.id,submitted[0].id,"hidden");await updateOwnedQuestionStatus(s.id,a.id,submitted[1].id,"approved");await updateOwnedQuestionStatus(s.id,a.id,submitted[2].id,"pinned");
  const all=await getOwnedSessionQuestions(s.id,a.id);assert.equal(all?.length,12);assert.equal(new Set(all?.map(q=>q.status)).size,4);assert.ok(all?.every(q=>q.sessionId===s.id));
  assert.equal(await getOwnedSessionQuestions(s.id,b.id),null);assert.equal(await updateOwnedQuestionStatus(s.id,b.id,submitted[0].id,"approved"),null);assert.equal(await deleteOwnedSession(s.id,b.id),false);
  const next=await saveSession(a.id,{...input,active:false});await Promise.all([setOwnedSessionActive(s.id,a.id,true),setOwnedSessionActive(next.id,a.id,true)]);
  assert.equal((await getOwnedSessions(a.id)).filter(s=>s.active).length,1);
  assert.equal(await setOwnedSessionActive("missing",a.id,true),null);assert.equal((await getOwnedSessions(a.id)).filter(s=>s.active).length,1);
  await deleteOwnedSession(s.id,a.id);const [remaining]=await getPool().query("SELECT id FROM questions WHERE sessionId=?",[s.id]);assert.equal((remaining as unknown[]).length,0);
 } finally {for(const id of owners)await getPool().execute("DELETE FROM users WHERE id=?",[id]);await getPool().end();}
});
