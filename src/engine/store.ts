import { useSyncExternalStore } from 'react';
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card } from 'ts-fsrs';
import { dayKey, daysBetween, weekKey } from './dates';

export interface StoredCard extends Omit<Card, 'due' | 'last_review'> {
  due: string;
  last_review?: string;
}

export interface Attempt {
  q: string; // question id
  c: string; // concept id
  ok: boolean;
  at: string; // ISO time
}

export interface Progress {
  version: 1;
  xp: number;
  dailyGoal: number;
  xpByDay: Record<string, number>;
  streak: { count: number; lastDay: string | null; freezes: number; freezeWeek: string; frozenDays: string[] };
  lessons: Record<string, { completions: number; bestPct: number; lastAt: string }>;
  cards: Record<string, StoredCard>; // keyed by concept id
  flags: Record<string, { note: string; at: string }>; // keyed by question id
  attempts: Attempt[];
}

const KEY = 'fund-balance-progress-v1';
const MAX_ATTEMPTS = 3000;
const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

export function freshProgress(): Progress {
  return {
    version: 1,
    xp: 0,
    dailyGoal: 30,
    xpByDay: {},
    streak: { count: 0, lastDay: null, freezes: 1, freezeWeek: weekKey(), frozenDays: [] },
    lessons: {},
    cards: {},
    flags: {},
    attempts: [],
  };
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...freshProgress(), ...JSON.parse(raw) };
  } catch {
    /* storage unavailable: start fresh in memory */
  }
  return freshProgress();
}

let state: Progress = load();
const listeners = new Set<() => void>();

function commit(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* keep working in memory */
  }
  listeners.forEach((l) => l());
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export function getProgress(): Progress {
  return state;
}

/** Ask the browser not to evict our storage (helps on iOS home-screen apps). */
export function requestPersistence() {
  try {
    void navigator.storage?.persist?.();
  } catch {
    /* not supported */
  }
}

// ---------- streak ----------

/** Streak as it should be shown today (0 if it has lapsed). */
export function currentStreak(p: Progress, today = dayKey()): number {
  const last = p.streak.lastDay;
  if (!last) return 0;
  const gap = daysBetween(last, today);
  if (gap <= 1) return p.streak.count;
  if (gap === 2 && freezesLeft(p) > 0) return p.streak.count; // one missed day can still be covered
  return 0;
}

export function freezesLeft(p: Progress, now = new Date()): number {
  return p.streak.freezeWeek === weekKey(now) ? p.streak.freezes : 1;
}

function bumpStreak(p: Progress, today: string): Progress['streak'] {
  const s = { ...p.streak };
  if (s.freezeWeek !== weekKey()) {
    s.freezeWeek = weekKey();
    s.freezes = 1;
  }
  if (s.lastDay === today) return s;
  const gap = s.lastDay ? daysBetween(s.lastDay, today) : Infinity;
  if (gap === 1) s.count += 1;
  else if (gap === 2 && s.freezes > 0) {
    s.freezes -= 1;
    const missed = new Date();
    missed.setDate(missed.getDate() - 1);
    s.frozenDays = [...s.frozenDays, dayKey(missed)].slice(-30);
    s.count += 1;
  } else s.count = 1;
  s.lastDay = today;
  return s;
}

export function addXp(amount: number) {
  if (amount <= 0) return;
  const today = dayKey();
  commit({
    ...state,
    xp: state.xp + amount,
    xpByDay: { ...state.xpByDay, [today]: (state.xpByDay[today] ?? 0) + amount },
    streak: bumpStreak(state, today),
  });
}

// ---------- attempts, lessons, scheduling ----------

export function recordAttempt(q: string, c: string, ok: boolean) {
  const attempts = [...state.attempts, { q, c, ok, at: new Date().toISOString() }];
  commit({ ...state, attempts: attempts.slice(-MAX_ATTEMPTS) });
}

export function finishLesson(lessonId: string, pct: number) {
  const prev = state.lessons[lessonId];
  commit({
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: {
        completions: (prev?.completions ?? 0) + 1,
        bestPct: Math.max(prev?.bestPct ?? 0, pct),
        lastAt: new Date().toISOString(),
      },
    },
  });
}

/** Schedule (or reschedule) a concept's next review. */
export function reviewConcept(conceptId: string, rating: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy) {
  const now = new Date();
  const existing = state.cards[conceptId];
  const card = existing ?? createEmptyCard(now);
  const { card: next } = scheduler.next(card, now, rating);
  const stored: StoredCard = {
    ...next,
    due: next.due.toISOString(),
    last_review: next.last_review ? new Date(next.last_review).toISOString() : undefined,
  };
  commit({ ...state, cards: { ...state.cards, [conceptId]: stored } });
}

export function dueConcepts(p: Progress, now = new Date()): string[] {
  return Object.entries(p.cards)
    .filter(([, c]) => new Date(c.due) <= now)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id]) => id);
}

/** Questions whose latest attempt was wrong. */
export function mistakeQuestions(p: Progress): string[] {
  const last = new Map<string, boolean>();
  for (const a of p.attempts) last.set(a.q, a.ok);
  return [...last.entries()].filter(([, ok]) => !ok).map(([q]) => q);
}

export function lastSeen(p: Progress): Map<string, string> {
  const m = new Map<string, string>();
  for (const a of p.attempts) m.set(a.q, a.at);
  return m;
}

// ---------- settings, flags, backup ----------

export function setDailyGoal(goal: number) {
  commit({ ...state, dailyGoal: goal });
}

export function toggleFlag(questionId: string, note = '') {
  const flags = { ...state.flags };
  if (flags[questionId]) delete flags[questionId];
  else flags[questionId] = { note, at: new Date().toISOString() };
  commit({ ...state, flags });
}

export function setFlagNote(questionId: string, note: string) {
  if (!state.flags[questionId]) return;
  commit({ ...state, flags: { ...state.flags, [questionId]: { ...state.flags[questionId], note } } });
}

export function exportProgress(): string {
  return JSON.stringify(state);
}

export function importProgress(json: string): string | null {
  try {
    const data = JSON.parse(json);
    if (data?.version !== 1 || typeof data.xp !== 'number') return 'That text isn’t a Fund Balance backup.';
    commit({ ...freshProgress(), ...data });
    return null;
  } catch {
    return 'That text isn’t valid backup data. Paste the whole backup, from the first { to the last }.';
  }
}

export function resetProgress() {
  commit(freshProgress());
}

export { Rating };
