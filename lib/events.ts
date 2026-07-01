import type { Question } from "@/lib/types";

type Listener = (question: Question) => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribeToQuestions(sessionId: string, listener: Listener): () => void {
  const sessionListeners = listeners.get(sessionId) ?? new Set<Listener>();
  sessionListeners.add(listener);
  listeners.set(sessionId, sessionListeners);
  return () => {
    sessionListeners.delete(listener);
    if (sessionListeners.size === 0) {
      listeners.delete(sessionId);
    }
  };
}

export function publishQuestion(question: Question): void {
  listeners.get(question.sessionId)?.forEach((listener) => listener(question));
}
