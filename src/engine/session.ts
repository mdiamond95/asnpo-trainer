import type { Question } from '../content/types';
import { questionIndex, questionsByConcept } from '../content';
import { dueConcepts, lastSeen, mistakeQuestions, type Progress } from './store';

export type SessionKind = 'lesson' | 'review' | 'mistakes' | 'practice';

export interface SessionPlan {
  kind: SessionKind;
  title: string;
  lessonId?: string;
  questions: Question[];
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** For each concept, the question the learner has seen least recently. */
function pickPerConcept(p: Progress, conceptIds: string[]): Question[] {
  const seen = lastSeen(p);
  const picks: Question[] = [];
  for (const c of conceptIds) {
    const pool = questionsByConcept.get(c);
    if (!pool?.length) continue;
    const ordered = shuffle(pool).sort((a, b) => (seen.get(a.id) ?? '').localeCompare(seen.get(b.id) ?? ''));
    picks.push(ordered[0]);
  }
  return shuffle(picks);
}

export const REVIEW_SIZE = 12;

export function reviewSession(p: Progress): SessionPlan {
  return { kind: 'review', title: 'Daily review', questions: pickPerConcept(p, dueConcepts(p).slice(0, REVIEW_SIZE)) };
}

/** Practice when nothing is due: the concepts closest to being forgotten. */
export function practiceSession(p: Progress): SessionPlan {
  const ids = Object.entries(p.cards)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .slice(0, 10)
    .map(([id]) => id);
  return { kind: 'practice', title: 'Extra practice', questions: pickPerConcept(p, ids) };
}

export function mistakesSession(p: Progress): SessionPlan {
  const qs = mistakeQuestions(p)
    .map((id) => questionIndex.get(id)?.question)
    .filter((q): q is Question => !!q);
  return { kind: 'mistakes', title: 'Fix your mistakes', questions: shuffle(qs).slice(0, 15) };
}
