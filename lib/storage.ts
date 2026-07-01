import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Question, QuestionInput, QuestionStats, Session, SessionInput } from "@/lib/types";
import { cleanText } from "@/lib/sanitize";

const dataDir = path.join(process.cwd(), "data");
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

export async function getSessions(): Promise<Session[]> {
  return readJson<Session[]>(sessionsFile, []);
}

export async function getQuestions(): Promise<Question[]> {
  return readJson<Question[]>(questionsFile, []);
}

export async function getActiveSession(): Promise<Session | null> {
  const sessions = await getSessions();
  return sessions.find((session) => session.active) ?? sessions[0] ?? null;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const sessions = await getSessions();
  return sessions.find((session) => session.id === sessionId) ?? null;
}

export async function saveSession(input: SessionInput, id?: string): Promise<Session> {
  const sessions = await getSessions();
  const now = new Date().toISOString();
  const session: Session = {
    id: id ?? randomUUID().slice(0, 8),
    title: cleanText(input.title),
    description: cleanText(input.description),
    presenter: cleanText(input.presenter),
    date: cleanText(input.date),
    active: input.active,
    createdAt: sessions.find((item) => item.id === id)?.createdAt ?? now,
    endedAt: input.active ? undefined : sessions.find((item) => item.id === id)?.endedAt,
  };
  const nextSessions = sessions
    .filter((item) => item.id !== session.id)
    .map((item) => ({ ...item, active: input.active ? false : item.active }));
  await writeJson(sessionsFile, [session, ...nextSessions]);
  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const sessions = await getSessions();
  const questions = await getQuestions();
  await writeJson(sessionsFile, sessions.filter((session) => session.id !== sessionId));
  await writeJson(questionsFile, questions.filter((question) => question.sessionId !== sessionId));
}

export async function setActiveSession(sessionId: string, active: boolean): Promise<Session | null> {
  const sessions = await getSessions();
  let updated: Session | null = null;
  const now = new Date().toISOString();
  const nextSessions = sessions.map((session) => {
    if (session.id === sessionId) {
      updated = { ...session, active, endedAt: active ? undefined : now };
      return updated;
    }
    return { ...session, active: active ? false : session.active };
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
    pinned: false,
    highlighted: false,
    hidden: false,
    liked: 0,
    createdAt: new Date().toISOString(),
  };
  await writeJson(questionsFile, [question, ...questions]);
  return question;
}

export async function getSessionQuestions(sessionId: string, includeHidden = true): Promise<Question[]> {
  const questions = await getQuestions();
  return questions
    .filter((question) => question.sessionId === sessionId)
    .filter((question) => includeHidden || !question.hidden)
    .sort((first, second) => Number(second.pinned) - Number(first.pinned) || Date.parse(second.createdAt) - Date.parse(first.createdAt));
}

export async function updateQuestion(questionId: string, patch: Partial<Question>): Promise<Question | null> {
  const questions = await getQuestions();
  let updated: Question | null = null;
  const nextQuestions = questions.map((question) => {
    if (question.id !== questionId) {
      return question;
    }
    updated = { ...question, ...patch };
    return updated;
  });
  await writeJson(questionsFile, nextQuestions);
  return updated;
}

export async function deleteQuestion(questionId: string): Promise<Question | null> {
  const questions = await getQuestions();
  const deleted = questions.find((question) => question.id === questionId) ?? null;
  await writeJson(questionsFile, questions.filter((question) => question.id !== questionId));
  return deleted;
}

export async function clearSessionQuestions(sessionId: string): Promise<void> {
  const questions = await getQuestions();
  await writeJson(questionsFile, questions.filter((question) => question.sessionId !== sessionId));
}

export function getQuestionStats(questions: Question[]): QuestionStats {
  const visibleQuestions = questions.filter((question) => !question.hidden);
  const sorted = [...visibleQuestions].sort((first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt));
  const firstTime = sorted[0] ? Date.parse(sorted[0].createdAt) : Date.now();
  const minutes = Math.max((Date.now() - firstTime) / 60000, 1);
  const emojiCounts = visibleQuestions.reduce<Record<string, number>>((accumulator, question) => {
    accumulator[question.emoji] = (accumulator[question.emoji] ?? 0) + 1;
    return accumulator;
  }, {});
  const mostUsedEmoji = Object.entries(emojiCounts).sort((first, second) => second[1] - first[1])[0]?.[0];
  return {
    total: visibleQuestions.length,
    questionsPerMinute: Number((visibleQuestions.length / minutes).toFixed(1)),
    mostUsedEmoji: mostUsedEmoji ? (mostUsedEmoji as QuestionStats["mostUsedEmoji"]) : "None",
  };
}
