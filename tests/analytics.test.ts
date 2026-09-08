import { test } from "node:test";
import assert from "node:assert/strict";
import { topUsers } from "../lib/analytics";
import { validateCoverage, generateInsights } from "../lib/insights";
import type { Question } from "../lib/types";
const q = (id:string,name="Alice"):Question=>({id,name,sessionId:"lecture-one",question:`Question ${id}`,emoji:"🤔",color:"blue",status:"pending",createdAt:"2026-09-08T00:00:00Z"});
test("ranking groups normalized names, excludes anonymous and sorts descending",()=>{
 const result=topUsers([q("1"," Alice "),q("2","alice"),q("3","Bob"),q("4","Anonymous"),q("5","")]);
 assert.deepEqual(result.users,[{name:"Alice",count:2},{name:"Bob",count:1}]);assert.equal(result.anonymous,2);
});
const report=(ids:string[])=>({summary:"ภาพรวม",categories:[{name:"หมวดหลัก",questionIds:ids}],insights:[{title:"ข้อค้นพบ",detail:"รายละเอียด",action:"อธิบายเพิ่มเติม",questionIds:[ids[0]]}]});
test("coverage rejects missing, duplicate, foreign question IDs and invented evidence",()=>{
 assert.throws(()=>validateCoverage(report(["1"]),["1","2"]));
 assert.throws(()=>validateCoverage(report(["1","1"]),["1"]));
 assert.throws(()=>validateCoverage(report(["other-lecture"]),["1"]));
 const bad=report(["1"]);bad.insights[0].questionIds=["other"];assert.throws(()=>validateCoverage(bad,["1"]));
 assert.equal(validateCoverage(report(["1","2"]),["1","2"]).categories.length,1);
});
test("processes all questions across batches, counts exact membership and strips names",async()=>{
 const original=global.fetch;let calls=0;
 global.fetch=async (_url,options)=>{
  const body=JSON.parse(String(options?.body));const payload=JSON.parse(body.messages[1].content);calls++;
  const ids=payload.questions?payload.questions.map((q:{id:string})=>q.id):payload.batches.flatMap((b:ReturnType<typeof report>)=>b.categories.flatMap(c=>c.questionIds));
  if(payload.questions) assert.ok(payload.questions.every((q:object)=>!("name" in q)));
  return Response.json({choices:[{finish_reason:"stop",message:{content:JSON.stringify(report(ids))}}]});
 };
 try {const result=await generateInsights(Array.from({length:61},(_,i)=>q(String(i))),new AbortController().signal);assert.equal(calls,3);assert.equal(result.questionCount,61);assert.equal(result.categories[0].count,61);}
 finally {global.fetch=original;}
});
test("provider failure never returns fabricated insights",async()=>{
 const original=global.fetch;global.fetch=async()=>new Response("unavailable",{status:503});
 try {await assert.rejects(()=>generateInsights([q("1")],new AbortController().signal));}finally{global.fetch=original;}
});

test("repairs one invalid AI response and still requires full question coverage", async () => {
 const original = global.fetch; let calls = 0;
 global.fetch = async (_url, options) => {
  calls++;
  const body = JSON.parse(String(options?.body));
  assert.match(body.messages[0].content, /"required"/);
  const value = calls === 1 ? {summary:"incomplete"} : report(["1"]);
  return Response.json({choices:[{finish_reason:"stop",message:{content:JSON.stringify(value)}}]});
 };
 try {const result=await generateInsights([q("1")],new AbortController().signal);assert.equal(calls,2);assert.equal(result.questionCount,1);}
 finally {global.fetch=original;}
});
