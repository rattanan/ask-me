import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AdminUser, PublicSession, Question, QuestionInput, QuestionStats, Session, SessionInput } from "@/lib/types";
import { cleanText } from "@/lib/sanitize";

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");
const sessionsFile = path.join(dataDir, "sessions.json");
const questionsFile = path.join(dataDir, "questions.json");

async function ensureDataDir(): Promise<void> {
  await mkdir(dataDir, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  const tempFile = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tempFile, filePath);
}

function toPublicSession(session: Session): PublicSession {
  return {
    id: session.id,
    title: session.title,
    description: session.description,
    presenter: session.presenter,
    active: session.active,
    allowQuestions: session.allowQuestions,
  };
}

export async function getUsers(): Promise<AdminUser[]> {
  return readJson<AdminUser[]>(usersFile, []);
}

export async function upsertUser(input: Omit<AdminUser, "id" | "createdAt">): Promise<AdminUser> {
  const users = await getUsers();
  const existing = users.find((user) => user.googleId === input.googleId || user.email === input.email);
  const user: AdminUser = {
    id: existing?.id ?? randomUUID(),
    googleId: input.googleId,
    email: cleanText(input.email),
    name: cleanText(input.name),
    image: input.image,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  const nextUsers = [user, ...users.filter((item) => item.id !== user.id)];
  await writeJson(usersFile, nextUsers);
  return user;
}

export async function getUserByEmail(email: string): Promise<AdminUser | null> {
  const users = await getUsers();
  return users.find((user) => user.email === email) ?? null;
}

export async function getSessions(): Promise<Session[]> {
  return readJson<Session[]>(sessionsFile, []);
}

export async function getQuestions(): Promise<Question[]> {
  return readJson<Question[]>(questionsFile, []);
}

export async function getPublicActiveSession(): Promise<PublicSession | null> {
  const sessions = await getSessions();
  const session = sessions.find((item) => item.active && item.allowQuestions) ?? sessions.find((item) => item.active) ?? null;
  return session ? toPublicSession(session) : null;
}

export async function getPublicSession(sessionId: string): Promise<PublicSession | null> {
  const sessions = await getSessions();
  const session = sessions.find((item) => item.id === sessionId) ?? null;
  return session ? toPublicSession(session) : null;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const sessions = await getSessions();
  return sessions.find((session) => session.id === sessionId) ?? null;
}

export async function getOwnedSessions(ownerUserId: string): Promise<Session[]> {
  const sessions = await getSessions();
  return sessions.filter((session) => session.ownerUserId === ownerUserId);
}

export async function getOwnedSession(sessionId: string, ownerUserId: string): Promise<Session | null> {
  const session = await getSession(sessionId);
  return session?.ownerUserId === ownerUserId ? session : null;
}

export async function saveSession(ownerUserId: string, input: SessionInput, id?: string): Promise<Session> {
  const sessions = await getSessions();
  const existing = id ? sessions.find((item) => item.id === id && item.ownerUserId === ownerUserId) : undefined;
  const now = new Date().toISOString();
  const session: Session = {
    id: existing?.id ?? randomUUID().slice(0, 8),
    ownerUserId,
    title: cleanText(input.title),
    description: cleanText(input.description),
    presenter: cleanText(input.presenter),
    date: cleanText(input.date),
    active: input.active,
    allowQuestions: input.allowQuestions,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const nextSessions = sessions
    .filter((item) => item.id !== session.id)
    .map((item) => (item.ownerUserId === ownerUserId && input.active ? { ...item, active: false, updatedAt: now } : item));
  await writeJson(sessionsFile, [session, ...nextSessions]);
  return session;
}

export async function deleteOwnedSession(sessionId: string, ownerUserId: string): Promise<boolean> {
  const session = await getOwnedSession(sessionId, ownerUserId);
  if (!session) {
    return false;
  }
  const sessions = await getSessions();
  const questions = await getQuestions();
  await writeJson(sessionsFile, sessions.filter((item) => item.id !== sessionId));
  await writeJson(questionsFile, questions.filter((question) => question.sessionId !== sessionId));
  return true;
}

export async function setOwnedSessionActive(sessionId: string, ownerUserId: string, active: boolean): Promise<Session | null> {
  const sessions = await getSessions();
  let updated: Session | null = null;
  const now = new Date().toISOString();
  const nextSessions = sessions.map((session) => {
    if (session.id === sessionId && session.ownerUserId === ownerUserId) {
      updated = { ...session, active, updatedAt: now };
      return updated;
    }
    if (session.ownerUserId === ownerUserId && active) {
      return { ...session, active: false, updatedAt: now };
    }
    return session;
  });
  await writeJson(sessionsFile, nextSessions);
  return updated;
}

export async function addQuestion(input: QuestionInput): Promise<Question> {
  const questions = await getQuestions();
  const question: Question = {
    id: randomUUID(),
    sessionId: input.sessionId,
    name: cleanText(input.name?.trim() ? input.name : "Anonymous"),
    question: cleanText(input.question),
    emoji: input.emoji,
    color: input.color,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await writeJson(questionsFile, [question, ...questions]);
  return question;
}

export async function getSessionQuestions(sessionId: string, statuses?: Question["status"][]): Promise<Question[]> {
  const questions = await getQuestions();
  return questions
    .filter((question) => question.sessionId === sessionId)
    .filter((question) => !statuses || statuses.includes(question.status))
    .sort((first, second) => Number(second.status === "pinned") - Number(first.status === "pinned") || Date.parse(second.createdAt) - Date.parse(first.createdAt));
}

export async function getOwnedSessionQuestions(sessionId: string, ownerUserId: string): Promise<Question[] | null> {
  const session = await getOwnedSession(sessionId, ownerUserId);
  if (!session) {
    return null;
  }
  return getSessionQuestions(sessionId);
}

export async function updateOwnedQuestionStatus(
  sessionId: string,
  ownerUserId: string,
  questionId: string,
  status: Question["status"],
): Promise<Question | null> {
  const session = await getOwnedSession(sessionId, ownerUserId);
  if (!session) {
    return null;
  }
  const questions = await getQuestions();
  let updated: Question | null = null;
  const nextQuestions = questions.map((question) => {
    if (question.id !== questionId || question.sessionId !== sessionId) {
      return question;
    }
    updated = { ...question, status };
    return updated;
  });
  await writeJson(questionsFile, nextQuestions);
  return updated;
}

export async function deleteOwnedQuestion(sessionId: string, ownerUserId: string, questionId: string): Promise<Question | null> {
  const session = await getOwnedSession(sessionId, ownerUserId);
  if (!session) {
    return null;
  }
  const questions = await getQuestions();
  const deleted = questions.find((question) => question.id === questionId && question.sessionId === sessionId) ?? null;
  await writeJson(questionsFile, questions.filter((question) => !(question.id === questionId && question.sessionId === sessionId)));
  return deleted;
}

export async function clearOwnedSessionQuestions(sessionId: string, ownerUserId: string): Promise<boolean> {
  const session = await getOwnedSession(sessionId, ownerUserId);
  if (!session) {
    return false;
  }
  const questions = await getQuestions();
  await writeJson(questionsFile, questions.filter((question) => question.sessionId !== sessionId));
  return true;
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
