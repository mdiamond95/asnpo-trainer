import type { Question, Side } from '../content/types';

export interface DraftLine {
  account: string;
  side: Side;
  amount: string;
}

export type AnswerValue =
  | { type: 'mc'; choice: number | null }
  | { type: 'tf'; value: boolean | null; reason: number | null }
  | { type: 'classify'; picks: (number | null)[] }
  | { type: 'je'; lines: DraftLine[] }
  | { type: 'calc'; text: string }
  | { type: 'match'; picks: (number | null)[] };

export function emptyAnswer(q: Question): AnswerValue {
  switch (q.type) {
    case 'mc':
      return { type: 'mc', choice: null };
    case 'tf':
      return { type: 'tf', value: null, reason: null };
    case 'classify':
      return { type: 'classify', picks: q.items.map(() => null) };
    case 'je':
      return { type: 'je', lines: [] };
    case 'calc':
      return { type: 'calc', text: '' };
    case 'match':
      return { type: 'match', picks: q.pairs.map(() => null) };
  }
}

/** Accepts "$40,000", "40 000", "40000.00", "(1,200)" and "-1200". Returns NaN when unreadable. */
export function parseAmount(text: string): number {
  let t = text.trim().replace(/[$,%\s]/g, '');
  let negative = false;
  if (/^\(.*\)$/.test(t)) {
    negative = true;
    t = t.slice(1, -1);
  }
  if (t === '' || !/^-?\d*\.?\d+$/.test(t)) return NaN;
  const n = Number(t);
  return negative ? -n : n;
}

/** True once the learner has given enough to be checked. */
export function isComplete(q: Question, a: AnswerValue): boolean {
  switch (a.type) {
    case 'mc':
      return a.choice !== null;
    case 'tf':
      return a.value !== null && (q.type !== 'tf' || !q.reasons || a.reason !== null);
    case 'classify':
    case 'match':
      return a.picks.every((p) => p !== null);
    case 'je':
      return a.lines.length > 0 && a.lines.every((l) => !Number.isNaN(parseAmount(l.amount)));
    case 'calc':
      return !Number.isNaN(parseAmount(a.text));
  }
}

function summarize(lines: { account: string; side: Side; amount: number }[]): string[] {
  const totals = new Map<string, number>();
  for (const l of lines) {
    const key = `${l.account.trim().toLowerCase()}|${l.side}`;
    totals.set(key, Math.round(((totals.get(key) ?? 0) + l.amount) * 100) / 100);
  }
  return [...totals.entries()]
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${k}|${v}`)
    .sort();
}

export function grade(q: Question, a: AnswerValue): boolean {
  switch (q.type) {
    case 'mc':
      return a.type === 'mc' && a.choice === q.answer;
    case 'tf':
      if (a.type !== 'tf' || a.value !== q.answer) return false;
      return !q.reasons || a.reason === q.reason;
    case 'classify':
      return a.type === 'classify' && q.items.every((item, i) => a.picks[i] === item.bucket);
    case 'match':
      return a.type === 'match' && q.pairs.every((_, i) => a.picks[i] === i);
    case 'calc': {
      if (a.type !== 'calc') return false;
      const n = parseAmount(a.text);
      return !Number.isNaN(n) && Math.abs(n - q.answer) <= (q.tolerance ?? 0.5);
    }
    case 'je': {
      if (a.type !== 'je') return false;
      const given = a.lines.map((l) => ({ account: l.account, side: l.side, amount: parseAmount(l.amount) }));
      if (given.some((l) => Number.isNaN(l.amount))) return false;
      const want = summarize(q.lines);
      const got = summarize(given);
      return want.length === got.length && want.every((w, i) => w === got[i]);
    }
  }
}
