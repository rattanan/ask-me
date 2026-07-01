const submissions = new Map<string, number>();
const WINDOW_MS = 10_000;

export function canSubmitQuestion(key: string): boolean {
  const now = Date.now();
  const lastSubmission = submissions.get(key) ?? 0;
  if (now - lastSubmission < WINDOW_MS) {
    return false;
  }
  submissions.set(key, now);
  return true;
}
