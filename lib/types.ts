export const EMOJIS = ["😀", "😄", "😍", "🤔", "😎", "🥳", "🚀", "💡", "❤️", "👏", "🔥"] as const;

export const NOTE_COLORS = ["yellow", "pink", "green", "blue", "purple", "orange"] as const;

export type Emoji = (typeof EMOJIS)[number];
export type NoteColor = (typeof NOTE_COLORS)[number];

export interface Session {
  id: string;
  title: string;
  description: string;
  presenter: string;
  date: string;
  active: boolean;
  createdAt: string;
  endedAt?: string;
}

export interface Question {
  id: string;
  sessionId: string;
  name: string;
  question: string;
  emoji: Emoji;
  color: NoteColor;
  pinned: boolean;
  highlighted: boolean;
  hidden: boolean;
  liked: number;
  createdAt: string;
}

export interface SessionInput {
  title: string;
  description: string;
  presenter: string;
  date: string;
  active: boolean;
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
