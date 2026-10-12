// Content schema. Lesson content lives in /content/*.yaml and is validated by scripts/check-content.ts.

export type Side = 'dr' | 'cr';

interface QuestionBase {
  id: string;
  concept: string; // id of a concept in the same unit
  prompt: string;
  explain: string; // shown after answering, right or wrong
  ref: string; // Handbook reference, e.g. "Part III, Section 4410"
}

export interface MCQuestion extends QuestionBase {
  type: 'mc';
  options: string[];
  answer: number; // index into options
}

export interface TFQuestion extends QuestionBase {
  type: 'tf';
  answer: boolean;
  // Optional second step: pick why
  reasons?: string[];
  reason?: number;
}

export interface ClassifyQuestion extends QuestionBase {
  type: 'classify';
  buckets: string[];
  items: { text: string; bucket: number }[];
}

export interface JELine {
  account: string;
  side: Side;
  amount: number;
}

export interface JEQuestion extends QuestionBase {
  type: 'je';
  accounts: string[]; // account choices shown to the learner (must include every answer account)
  lines: JELine[]; // the correct entry, order-insensitive
}

export interface CalcQuestion extends QuestionBase {
  type: 'calc';
  answer: number;
  tolerance?: number; // absolute, default 0.5
  unit?: '$' | '%' | 'years';
}

export interface MatchQuestion extends QuestionBase {
  type: 'match';
  pairs: { left: string; right: string }[];
}

export type Question =
  | MCQuestion
  | TFQuestion
  | ClassifyQuestion
  | JEQuestion
  | CalcQuestion
  | MatchQuestion;

export interface Concept {
  id: string;
  title: string;
  summary: string; // 1-3 sentences, plain-language paraphrase (never quote the Handbook)
  ref: string;
}

export interface Lesson {
  id: string;
  title: string;
  intro: string; // one or two sentences shown before the lesson starts
  questions: Question[];
}

export type CourseId = 'basics' | 'capital' | 'consolidation';

export interface Unit {
  id: string;
  course: CourseId;
  number: number; // position within its course, starting at 1
  title: string;
  summary: string;
  refs: string[];
  status: 'ready' | 'planned';
  concepts: Concept[];
  lessons: Lesson[];
}
