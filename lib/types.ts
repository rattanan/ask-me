export const EMOJIS = ["😀", "😄", "😍", "🤔", "😎", "🥳", "🚀", "💡", "❤️", "👏", "🔥"] as const;

export const NOTE_COLORS = ["yellow", "pink", "green", "blue", "purple", "orange"] as const;

export type Emoji = (typeof EMOJIS)[number];
export type NoteColor = (typeof NOTE_COLORS)[number];
export type QuestionStatus = "pending" | "approved" | "hidden" | "pinned";

export interface AdminUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  image: string;
  createdAt: string;
}

export interface Session {
  id: string;
  ownerUserId: string;
  title: string;
  description: string;
  presenter: string;
  date: string;
  active: boolean;
  allowQuestions: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicSession {
  id: string;
  title: string;
  description: string;
  presenter: string;
  active: boolean;
  allowQuestions: boolean;
}

export interface Question {
  id: string;
  sessionId: string;
  name: string;
  question: string;
  emoji: Emoji;
  color: NoteColor;
  status: QuestionStatus;
  createdAt: string;
}

export interface SessionInput {
  title: string;
  description: string;
  presenter: string;
  date: string;
  active: boolean;
  allowQuestions: boolean;
}

export interface QuestionInput {
  sessionId: string;
  name?: string;
  question: string;
  emoji: Emoji;
  color: NoteColor;
}

export interface QuestionStats {
  total: number;
  questionsPerMinute: number;
  mostUsedEmoji: Emoji | "None";
}
