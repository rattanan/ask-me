import { randomUUID } from "node:crypto";
import type { ResultSetHeader } from "mysql2/promise";
import { getPool, rows, transaction } from "@/lib/db";
import type { AdminUser, PublicSession, Question, QuestionInput, QuestionStats, Session, SessionInput } from "@/lib/types";
import { cleanText } from "@/lib/sanitize";
const sessionRow = (s: Session): Session => ({ ...s, active: Boolean(s.active), allowQuestions: Boolean(s.allowQuestions) });
const publicRow = (s: Session): PublicSession => ({ id: s.id, title: s.title, description: s.description, presenter: s.presenter, active: s.active, allowQuestions: s.allowQuestions });
export async function getUsers() { return rows<AdminUser>("SELECT * FROM users"); }
export async function getUserByEmail(email: string) { return (await rows<AdminUser>("SELECT * FROM users WHERE email = ?", [email]))[0] ?? null; }
export async function upsertUser(input: Omit<AdminUser, "id" | "createdAt">): Promise<AdminUser> {
  await getPool().execute("INSERT INTO users (id, googleId, email, name, image, createdAt) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, image = ?", [randomUUID(), input.googleId, cleanText(input.email), cleanText(input.name), input.image, new Date().toISOString(), cleanText(input.name), input.image]);
  const user = (await rows<AdminUser>("SELECT * FROM users WHERE googleId = ? OR email = ?", [input.googleId, input.email]))[0];
  if (!user) throw new Error("Unable to load signed-in user");
  return user;
}
export async function getSessions() { return (await rows<Session>("SELECT * FROM sessions ORDER BY createdAt DESC")).map(sessionRow); }
export async function getQuestions() { return rows<Question>("SELECT * FROM questions ORDER BY createdAt DESC"); }
export async function getSession(id: string) { const s = (await rows<Session>("SELECT * FROM sessions WHERE id = ?", [id]))[0]; return s ? sessionRow(s) : null; }
export async function getPublicSession(id: string) { const s = await getSession(id); return s ? publicRow(s) : null; }
export async function getPublicActiveSession() {
  const s = (await rows<Session>("SELECT * FROM sessions WHERE active = TRUE ORDER BY allowQuestions DESC, createdAt DESC LIMIT 1"))[0];
  return s ? publicRow(sessionRow(s)) : null;
}
export async function getOwnedSessions(owner: string) { return (await rows<Session>("SELECT * FROM sessions WHERE ownerUserId = ? ORDER BY createdAt DESC", [owner])).map(sessionRow); }
export async function getOwnedSession(id: string, owner: string) { const s = (await rows<Session>("SELECT * FROM sessions WHERE id = ? AND ownerUserId = ?", [id, owner]))[0]; return s ? sessionRow(s) : null; }
export async function saveSession(owner: string, input: SessionInput, id?: string): Promise<Session> {
  return transaction(async (c) => {
    await rows("SELECT id FROM users WHERE id = ? FOR UPDATE", [owner], c);
    const existing = id ? (await rows<Session>("SELECT * FROM sessions WHERE id = ? AND ownerUserId = ?", [id, owner], c))[0] : undefined;
    if (id && !existing) throw new Error("Session not found");
    const now = new Date().toISOString();
    const s: Session = { ...input, title: cleanText(input.title), description: cleanText(input.description), presenter: cleanText(input.presenter), date: cleanText(input.date), id: existing?.id ?? randomUUID(), ownerUserId: owner, createdAt: existing?.createdAt ?? now, updatedAt: now };
    if (s.active) await c.execute("UPDATE sessions SET active = FALSE, updatedAt = ? WHERE ownerUserId = ?", [now, owner]);
    if (existing) await c.execute("UPDATE sessions SET title=?, description=?, presenter=?, date=?, active=?, allowQuestions=?, updatedAt=? WHERE id=? AND ownerUserId=?", [s.title,s.description,s.presenter,s.date,s.active,s.allowQuestions,now,s.id,owner]);
    else await c.execute("INSERT INTO sessions (id,ownerUserId,title,description,presenter,date,active,allowQuestions,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)", [s.id,owner,s.title,s.description,s.presenter,s.date,s.active,s.allowQuestions,now,now]);
    return s;
  });
}
export async function setOwnedSessionActive(id: string, owner: string, active: boolean) {
  return transaction(async c => {
    await rows("SELECT id FROM users WHERE id = ? FOR UPDATE", [owner], c);
    const s = (await rows<Session>("SELECT * FROM sessions WHERE id=? AND ownerUserId=?", [id,owner], c))[0];
    if (!s) return null;
    const now = new Date().toISOString();
    if (active) await c.execute("UPDATE sessions SET active=FALSE, updatedAt=? WHERE ownerUserId=?", [now,owner]);
    await c.execute("UPDATE sessions SET active=?, updatedAt=? WHERE id=?", [active,now,id]);
    return sessionRow({...s,active,updatedAt:now});
  });
}
export async function deleteOwnedSession(id: string, owner: string) {
  const [result] = await getPool().execute<ResultSetHeader>("DELETE FROM sessions WHERE id=? AND ownerUserId=?", [id,owner]); return result.affectedRows > 0;
}
export async function addQuestion(input: QuestionInput): Promise<Question> {
  return transaction(async c => {
    const s = (await rows<Session>("SELECT * FROM sessions WHERE id=? FOR UPDATE", [input.sessionId], c))[0];
    if (!s?.active || !s.allowQuestions) throw new Error("Session is not accepting questions");
    const q: Question = { ...input, id: randomUUID(), name: cleanText(input.name?.trim() || "Anonymous"), question: cleanText(input.question), status: "approved", createdAt: new Date().toISOString() };
    await c.execute("INSERT INTO questions (id,sessionId,name,question,emoji,color,status,createdAt) VALUES (?,?,?,?,?,?,?,?)", [q.id,q.sessionId,q.name,q.question,q.emoji,q.color,q.status,q.createdAt]); return q;
  });
}
export async function getSessionQuestions(id: string, statuses?: Question["status"][]) {
  if (statuses?.length === 0) return [];
  return rows<Question>(`SELECT * FROM questions WHERE sessionId=? ${statuses ? `AND status IN (${statuses.map(()=>"?").join(",")})` : ""} ORDER BY (status='pinned') DESC, createdAt DESC`, [id,...(statuses ?? [])]);
}
export async function getOwnedSessionQuestions(id: string, owner: string) { return await getOwnedSession(id,owner) ? getSessionQuestions(id) : null; }
export async function updateOwnedQuestionStatus(id: string, owner: string, questionId: string, status: Question["status"]) {
  return transaction(async c => {
    const q = (await rows<Question>("SELECT q.* FROM questions q JOIN sessions s ON s.id=q.sessionId WHERE q.id=? AND s.id=? AND s.ownerUserId=? FOR UPDATE", [questionId,id,owner], c))[0];
    if (!q) return null;
    await c.execute("UPDATE questions SET status=? WHERE id=?", [status,questionId]); return {...q,status};
  });
}
export async function deleteOwnedQuestion(id: string, owner: string, questionId: string) {
  return transaction(async c => {
    const q = (await rows<Question>("SELECT q.* FROM questions q JOIN sessions s ON s.id=q.sessionId WHERE q.id=? AND s.id=? AND s.ownerUserId=? FOR UPDATE", [questionId,id,owner], c))[0];
    if (!q) return null;
    await c.execute("DELETE FROM questions WHERE id=?", [questionId]); return q;
  });
}
export async function clearOwnedSessionQuestions(id: string, owner: string) {
  return transaction(async c => {
    const s = await rows("SELECT id FROM sessions WHERE id=? AND ownerUserId=? FOR UPDATE", [id,owner], c);
    if (!s.length) return false;
    await c.execute("DELETE FROM questions WHERE sessionId=?", [id]); return true;
  });
}
export function getQuestionStats(questions: Question[]): QuestionStats {
  const approvedQuestions = questions.filter((question) => question.status === "approved" || question.status === "pinned");
  const sorted = [...approvedQuestions].sort((first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt));
  const firstTime = sorted[0] ? Date.parse(sorted[0].createdAt) : Date.now();
  const minutes = Math.max((Date.now() - firstTime) / 60000, 1);
  const emojiCounts = approvedQuestions.reduce<Record<string, number>>((accumulator, question) => {
    accumulator[question.emoji] = (accumulator[question.emoji] ?? 0) + 1;
    return accumulator;
  }, {});
  const mostUsedEmoji = Object.entries(emojiCounts).sort((first, second) => second[1] - first[1])[0]?.[0];
  return {
    total: approvedQuestions.length,
    questionsPerMinute: Number((approvedQuestions.length / minutes).toFixed(1)),
    mostUsedEmoji: mostUsedEmoji ? (mostUsedEmoji as QuestionStats["mostUsedEmoji"]) : "None",
  };
}
