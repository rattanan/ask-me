import { loadEnvConfig } from "@next/env";
import { generateInsights } from "../lib/insights";
import type { Question } from "../lib/types";
loadEnvConfig(process.cwd());
const questions:Question[]=["Docker ต่างจาก VM อย่างไร","จะเก็บข้อมูล MySQL อย่างไรเมื่อ container restart","Docker volume สำรองข้อมูลอย่างไร","จะป้องกัน SQL injection ได้อย่างไร"].map((question,i)=>({id:`smoke-${i}`,sessionId:"synthetic-smoke",name:"Test",question,emoji:"🤔",color:"blue",status:(["pending","approved","hidden","pinned"] as const)[i],createdAt:new Date().toISOString()}));
generateInsights(questions,AbortSignal.timeout(120_000)).then(r=>console.log(`AI smoke test passed: ${r.questionCount} synthetic questions, ${r.categories.length} categories, ${r.insights.length} insights.`)).catch(()=>{console.error("AI smoke test failed: inspect endpoint/model compatibility and server connectivity.");process.exitCode=1;});
