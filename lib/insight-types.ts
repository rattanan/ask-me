export interface InsightReport {
  summary: string;
  categories: { name: string; count: number; questionIds: string[] }[];
  insights: { title: string; detail: string; action: string; questionIds: string[] }[];
  questionCount: number;
  generatedAt: string;
  fingerprint: string;
}
