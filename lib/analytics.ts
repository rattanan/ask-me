import type { Question } from "./types";
export function topUsers(questions: Question[]) {
  const users = new Map<string, { name: string; count: number }>();
  let anonymous = 0;
  for (const q of questions) {
    const name = q.name.normalize("NFKC").trim().replace(/\s+/g, " ");
    if (!name || name.toLowerCase() === "anonymous") { anonymous++; continue; }
    const key = name.toLowerCase();
    const user = users.get(key) ?? { name, count: 0 }; user.count++; users.set(key,user);
  }
  return { users: [...users.values()].sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name)).slice(0,10), anonymous, namedUsers: users.size };
}
export function questionFingerprint(questions: Pick<Question, "id" | "question">[]) {
  // Stable input marker for detecting stale reports; not a security hash.
  return JSON.stringify(questions.map(q=>[q.id,q.question]).sort((a,b)=>a[0].localeCompare(b[0])));
}
