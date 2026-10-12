import { describe, expect, it } from 'vitest';
import { grade, parseAmount } from './grade';
import type { JEQuestion } from '../content/types';

const je: JEQuestion = {
  id: 'x', concept: 'c', prompt: '', explain: '', ref: '', type: 'je',
  accounts: ['Cash', 'Deferred contributions', 'Contribution revenue'],
  lines: [
    { account: 'Cash', side: 'dr', amount: 500000 },
    { account: 'Deferred contributions', side: 'cr', amount: 500000 },
  ],
};

describe('parseAmount', () => {
  it('reads accounting formats', () => {
    expect(parseAmount('$40,000')).toBe(40000);
    expect(parseAmount('40 000')).toBe(40000);
    expect(parseAmount('(1,200)')).toBe(-1200);
    expect(parseAmount('abc')).toBeNaN();
    expect(parseAmount('')).toBeNaN();
  });
});

describe('journal entries', () => {
  it('accepts the entry in any order and with split lines', () => {
    expect(grade(je, { type: 'je', lines: [
      { account: 'Deferred contributions', side: 'cr', amount: '500,000' },
      { account: 'Cash', side: 'dr', amount: '200000' },
      { account: 'Cash', side: 'dr', amount: '300000' },
    ] })).toBe(true);
  });
  it('rejects the wrong side or account', () => {
    expect(grade(je, { type: 'je', lines: [
      { account: 'Cash', side: 'dr', amount: '500000' },
      { account: 'Contribution revenue', side: 'cr', amount: '500000' },
    ] })).toBe(false);
    expect(grade(je, { type: 'je', lines: [
      { account: 'Cash', side: 'cr', amount: '500000' },
      { account: 'Deferred contributions', side: 'dr', amount: '500000' },
    ] })).toBe(false);
  });
});
