"use client";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChartNoAxesCombined, Lightbulb, LoaderCircle, Sparkles, Trophy, Users, X } from "lucide-react";
import { topUsers, questionFingerprint } from "@/lib/analytics";
import type { Question } from "@/lib/types";
import type { InsightReport } from "@/lib/insight-types";

function Bars({ items, total, violet = false, onSelect }: { items: {name:string;count:number}[]; total:number; violet?:boolean; onSelect:(index:number)=>void }) {
  const reduced = useReducedMotion();
  const max = Math.max(...items.map(i=>i.count),1);
  return <ol className="mt-6 space-y-3">{items.map((item,index)=><li key={item.name}>
    <button onClick={()=>onSelect(index)} className="group w-full rounded-xl px-2 py-1.5 text-left transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-blue-600 active:scale-[0.99]" aria-label={`${item.name}: ${item.count} คำถาม`}>
      <div className="mb-1.5 flex items-center gap-2 text-sm"><span className="w-5 text-xs tabular-nums text-zinc-400">{String(index+1).padStart(2,"0")}</span><span className="min-w-0 flex-1 break-words font-medium text-zinc-700">{item.name}</span><span className="font-bold tabular-nums text-zinc-900">{item.count}</span><span className="w-12 text-right text-xs tabular-nums text-zinc-400">{Math.round(item.count/Math.max(total,1)*100)}%</span></div>
      <div className="ml-7 h-2.5 overflow-hidden rounded-full bg-zinc-100"><motion.div initial={{width:0}} animate={{width:`${item.count/max*100}%`}} transition={{duration:reduced?0:0.6,delay:reduced?0:index*0.035}} className={`h-full rounded-full ${violet?"bg-gradient-to-r from-violet-500 to-fuchsia-400":"bg-gradient-to-r from-blue-600 to-cyan-400"}`} /></div>
    </button>
  </li>)}</ol>;
}
export function QuestionAnalytics({ questions, sessionId, autoGenerate = false }: { questions:Question[]; sessionId:string; autoGenerate?:boolean }) {
  const people = useMemo(()=>topUsers(questions),[questions]);
  const [report,setReport] = useState<InsightReport|null>(null);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [selection,setSelection] = useState<{title:string;ids:string[]}|null>(null);
  const controller = useRef<AbortController|null>(null);
  const autoStarted = useRef(false);
  const reduced = useReducedMotion();
  useEffect(()=>()=>controller.current?.abort(),[]);
  const stale = report && report.fingerprint !== questionFingerprint(questions);
  const generate = useCallback(async () => {
    if (controller.current) return;
    const abort = new AbortController(); controller.current=abort; setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/insights/${sessionId}`,{method:"POST",signal:abort.signal});
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "วิเคราะห์ไม่สำเร็จ");
      setReport(body); setSelection(null);
    } catch (e) { if (!abort.signal.aborted) setError(e instanceof Error?e.message:"วิเคราะห์ไม่สำเร็จ กรุณาลองใหม่"); }
    finally { controller.current=null; setLoading(false); }
  }, [sessionId]);
  useEffect(() => {
    if (!autoGenerate || !questions.length || autoStarted.current) return;
    const timer = setTimeout(() => { autoStarted.current = true; void generate(); }, 0);
    return () => clearTimeout(timer);
  }, [autoGenerate, questions.length, generate]);
  return <section className="my-6 space-y-5" aria-label="Question analytics">
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Audience participation</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Top 10 ผู้ถาม</h2></div><div className="rounded-2xl bg-amber-50 p-3 text-amber-600"><Trophy size={22}/></div></div>
        <p className="mt-2 text-sm leading-6 text-zinc-500">เรียงจำนวนคำถามมากไปน้อย · ทุกสถานะใน lecture นี้</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">{questions.length} คำถาม</span><span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-600"><Users size={14}/>{people.namedUsers} ชื่อผู้ถาม</span></div>
        {people.users.length ? <Bars items={people.users} total={questions.length} onSelect={i=>{const name=people.users[i].name.toLowerCase();setSelection({title:people.users[i].name,ids:questions.filter(q=>q.name.normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase()===name).map(q=>q.id)});}}/> : <div className="my-10 text-center text-sm text-zinc-400">ยังไม่มีคำถามที่ระบุชื่อ</div>}
        <p className="mt-5 border-t border-zinc-100 pt-4 text-xs leading-5 text-zinc-500">นับตามชื่อที่กรอก ชื่อเหมือนกันจะรวมเป็นกลุ่มเดียว · ไม่ระบุชื่อ {people.anonymous} คำถาม (ไม่รวมในอันดับ)</p>
      </div>
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-7 text-white shadow-lg shadow-indigo-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl"/>
        <div className="relative flex h-full flex-col"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200"><Sparkles size={16}/> AI Question Intelligence</div>
          <h2 className="mt-6 max-w-md text-3xl font-semibold leading-snug tracking-tight">เปลี่ยนทุกคำถาม<br/>เป็นความเข้าใจที่ลึกขึ้น</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-indigo-200">ค้นหาหัวข้อที่ผู้ฟังสนใจ ช่องว่างความเข้าใจ และสิ่งที่ควรอธิบายต่อ จากคำถามทั้งหมดใน lecture นี้</p>
          <div className="my-7 grid grid-cols-3 gap-2">{[[ChartNoAxesCombined,"Top 10 หมวดหมู่"],[Lightbulb,"ประเด็นน่าสนใจ"],[ArrowUpRight,"แนวทางต่อยอด"]].map(([Icon,label])=>{const I=Icon as typeof Sparkles;return <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-indigo-100"><I className="mb-2 text-violet-300" size={20}/>{String(label)}</div>;})}</div>
          <div className="mt-auto"><motion.button disabled={loading||!questions.length} whileHover={reduced?{}:{scale:1.02}} whileTap={reduced?{}:{scale:0.97}} onClick={generate} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 shadow-lg transition hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50">{loading?<LoaderCircle className="motion-safe:animate-spin" size={18}/>:<Sparkles size={18}/>} {loading?"กำลังวิเคราะห์คำถามทั้งหมด…":report?"Generate AI Insight อีกครั้ง":"Generate AI Insight"}</motion.button>
          <p className="mt-3 text-center text-xs leading-5 text-indigo-300">ส่งข้อความคำถามทุกสถานะให้ AI ที่ตั้งค่าไว้ · ไม่ส่งชื่อผู้ถาม</p></div>
        </div>
      </div>
    </div>
    {error&&<div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div aria-live="polite" aria-busy={loading}>
      {loading&&<div role="status" className="rounded-[2rem] border border-violet-100 bg-white p-7"><div className="flex items-center gap-3 text-violet-700"><LoaderCircle size={20} className="motion-safe:animate-spin"/><span>กำลังอ่าน จัดหมวดหมู่ และเชื่อมโยงประเด็น… คำถามจำนวนมากอาจใช้เวลาหลายนาที</span></div><div className="mt-5 grid gap-4 sm:grid-cols-3">{[0,1,2].map(i=><div key={i} className="h-24 rounded-2xl bg-gradient-to-r from-zinc-100 to-violet-50 motion-safe:animate-pulse"/>)}</div></div>}
    </div>
    <AnimatePresence>{report&&!loading&&<motion.div initial={{opacity:reduced?1:0,y:reduced?0:16}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:0.4}} className="space-y-5">
      <div className="rounded-[2rem] border border-violet-100 bg-violet-50/60 p-7"><p className="flex items-center gap-2 text-sm font-bold text-violet-700"><Sparkles size={17}/> ภาพรวมจาก AI</p><p className="mt-3 whitespace-pre-line text-lg leading-8 text-zinc-800">{report.summary}</p><p className="mt-4 text-xs text-zinc-500">วิเคราะห์ {report.questionCount} คำถาม · {new Date(report.generatedAt).toLocaleString("th-TH")} · ผลสรุปโดย AI ควรตรวจสอบกับคำถามอ้างอิง</p>{stale&&<p role="status" className="mt-3 text-sm font-medium text-amber-700">มีการเปลี่ยนแปลงคำถามแล้ว กด Generate อีกครั้งเพื่ออัปเดตผล</p>}</div>
      <div className="grid items-start gap-5 lg:grid-cols-2"><div className="rounded-[2rem] border border-zinc-100 bg-white p-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Most asked topics</p><h3 className="mt-2 text-2xl font-bold">Top 10 หมวดหมู่คำถาม</h3><p className="mt-2 text-sm text-zinc-500">หนึ่งคำถามต่อหนึ่งหมวดหมู่หลัก · กดกราฟเพื่อดูคำถาม</p><Bars items={report.categories.slice(0,10)} total={report.questionCount} violet onSelect={i=>setSelection({title:report.categories[i].name,ids:report.categories[i].questionIds})}/>{report.categories.length>10&&<p className="mt-4 text-xs text-zinc-500">อีก {report.categories.length-10} หมวดหมู่ รวม {report.categories.slice(10).reduce((s,c)=>s+c.count,0)} คำถาม</p>}</div>
      <div className="space-y-4">{report.insights.map((insight,i)=><motion.article key={i} whileHover={reduced?{}:{y:-3}} className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"><div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-600">{String(i+1).padStart(2,"0")}</span><h3 className="pt-1 text-lg font-bold">{insight.title}</h3></div><p className="mt-3 text-sm leading-7 text-zinc-600">{insight.detail}</p><div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900"><p className="mb-1 font-bold">สิ่งที่ทำต่อได้</p>{insight.action}</div><button onClick={()=>setSelection({title:insight.title,ids:insight.questionIds})} className="mt-4 rounded-lg text-sm font-semibold text-violet-700 underline-offset-4 hover:underline focus-visible:outline-2">ดูคำถามอ้างอิง {insight.questionIds.length} ข้อ ↗</button></motion.article>)}</div></div>
    </motion.div>}</AnimatePresence>
    {selection&&<div className="rounded-3xl border border-blue-200 bg-blue-50 p-6" role="region" aria-label="คำถามอ้างอิง"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold">คำถาม: {selection.title}</h3><button aria-label="ปิดคำถามอ้างอิง" onClick={()=>setSelection(null)} className="rounded-lg p-2 hover:bg-blue-100"><X size={20}/></button></div><ul className="mt-3 space-y-2">{selection.ids.map(id=>{const q=questions.find(q=>q.id===id);return <li key={id} className="rounded-xl bg-white p-3 text-sm leading-6">{q?q.question:"คำถามนี้ถูกลบแล้ว"}</li>;})}</ul></div>}
  </section>;
}
