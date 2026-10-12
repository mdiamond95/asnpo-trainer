import { useMemo, useState } from 'react';
import type { Question, Side } from '../content/types';
import { parseAmount, type AnswerValue, type DraftLine } from '../engine/grade';

interface Props<A extends AnswerValue> {
  q: Question;
  value: A;
  onChange: (v: A) => void;
  locked: boolean; // true after Check
}

const money = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 2 });
export const fmt = (n: number) => money.format(n);

function useOrder(n: number, key: string): number[] {
  // Shuffled once per question appearance so the right answer isn't always in the same spot.
  return useMemo(() => {
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, [n, key]);
}

function MC({ q, value, onChange, locked }: Props<Extract<AnswerValue, { type: 'mc' }>>) {
  if (q.type !== 'mc') return null;
  const order = useOrder(q.options.length, q.id);
  return (
    <div className="choices" role="radiogroup">
      {order.map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value.choice === i}
          className="choice"
          data-selected={value.choice === i}
          data-correct={locked && i === q.answer}
          data-locked={locked}
          disabled={locked}
          onClick={() => onChange({ ...value, choice: i })}
        >
          {q.options[i]}
        </button>
      ))}
    </div>
  );
}

function TF({ q, value, onChange, locked }: Props<Extract<AnswerValue, { type: 'tf' }>>) {
  if (q.type !== 'tf') return null;
  return (
    <div className="stack">
      <div className="tf-row" role="radiogroup" aria-label="True or false">
        {[true, false].map((b) => (
          <button
            key={String(b)}
            type="button"
            role="radio"
            aria-checked={value.value === b}
            className="choice tf"
            data-selected={value.value === b}
            data-correct={locked && q.answer === b}
            data-locked={locked}
            disabled={locked}
            onClick={() => onChange({ ...value, value: b })}
          >
            {b ? 'True' : 'False'}
          </button>
        ))}
      </div>
      {q.reasons && (
        <>
          <p className="eyebrow">Why?</p>
          <div className="choices" role="radiogroup" aria-label="Why">
            {q.reasons.map((r, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={value.reason === i}
                className="choice small"
                data-selected={value.reason === i}
                data-correct={locked && q.reason === i}
                data-locked={locked}
                disabled={locked}
                onClick={() => onChange({ ...value, reason: i })}
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Classify({ q, value, onChange, locked }: Props<Extract<AnswerValue, { type: 'classify' }>>) {
  if (q.type !== 'classify') return null;
  return (
    <ul className="classify">
      {q.items.map((item, i) => (
        <li key={i} className="classify-item" data-wrong={locked && value.picks[i] !== item.bucket}>
          <p>{item.text}</p>
          <div className="segmented" role="radiogroup" aria-label={item.text}>
            {q.buckets.map((b, bi) => (
              <button
                key={bi}
                type="button"
                role="radio"
                aria-checked={value.picks[i] === bi}
                data-selected={value.picks[i] === bi}
                data-correct={locked && item.bucket === bi}
                data-locked={locked}
                disabled={locked}
                onClick={() => {
                  const picks = [...value.picks];
                  picks[i] = bi;
                  onChange({ ...value, picks });
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

function JE({ q, value, onChange, locked }: Props<Extract<AnswerValue, { type: 'je' }>>) {
  if (q.type !== 'je') return null;
  const lines = value.lines;
  const set = (next: DraftLine[]) => onChange({ ...value, lines: next });
  const total = (side: Side) =>
    lines.filter((l) => l.side === side).reduce((s, l) => s + (parseAmount(l.amount) || 0), 0);
  const dr = total('dr');
  const cr = total('cr');
  return (
    <div className="je">
      <p className="eyebrow">Tap an account to add a line</p>
      <div className="chips">
        {q.accounts.map((a) => (
          <button
            key={a}
            type="button"
            className="chip"
            disabled={locked}
            onClick={() => set([...lines, { account: a, side: lines.length === 0 ? 'dr' : 'cr', amount: '' }])}
          >
            + {a}
          </button>
        ))}
      </div>
      <div className="ledger" role="table" aria-label="Your journal entry">
        <div className="ledger-head" role="row">
          <span role="columnheader">Account</span>
          <span role="columnheader">Dr / Cr</span>
          <span role="columnheader" className="num">Amount ($)</span>
          <span aria-hidden="true" />
        </div>
        {lines.length === 0 && <p className="ledger-empty">No lines yet.</p>}
        {lines.map((l, i) => (
          <div key={i} className="ledger-row" role="row" data-side={l.side}>
            <span className="acct" role="cell">{l.account}</span>
            <span role="cell">
              <button
                type="button"
                className="side-toggle"
                disabled={locked}
                aria-label={`${l.side === 'dr' ? 'Debit' : 'Credit'}, tap to switch`}
                onClick={() => set(lines.map((x, j) => (j === i ? { ...x, side: x.side === 'dr' ? 'cr' : 'dr' } : x)))}
              >
                {l.side === 'dr' ? 'Dr' : 'Cr'}
              </button>
            </span>
            <span role="cell">
              <input
                id={`${q.id}-amt-${i}`}
                className="amount"
                inputMode="decimal"
                placeholder="0"
                aria-label={`Amount for ${l.account}`}
                value={l.amount}
                disabled={locked}
                onChange={(e) => set(lines.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
              />
            </span>
            <span role="cell">
              <button
                type="button"
                className="remove"
                aria-label={`Remove ${l.account}`}
                disabled={locked}
                onClick={() => set(lines.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </span>
          </div>
        ))}
        <div className="ledger-foot" data-balanced={dr === cr && dr > 0}>
          <span>Debits {fmt(dr)}</span>
          <span>Credits {fmt(cr)}</span>
        </div>
      </div>
    </div>
  );
}

function Calc({ q, value, onChange, locked }: Props<Extract<AnswerValue, { type: 'calc' }>>) {
  if (q.type !== 'calc') return null;
  return (
    <label className="calc">
      <span className="eyebrow">Your answer{q.unit ? ` (${q.unit})` : ''}</span>
      <span className="calc-field">
        {q.unit === '$' && <span className="affix">$</span>}
        <input
          id={`${q.id}-calc`}
          inputMode="decimal"
          autoComplete="off"
          value={value.text}
          disabled={locked}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
        />
        {q.unit && q.unit !== '$' && <span className="affix">{q.unit}</span>}
      </span>
    </label>
  );
}

function Match({ q, value, onChange, locked }: Props<Extract<AnswerValue, { type: 'match' }>>) {
  const [active, setActive] = useState<number | null>(null);
  if (q.type !== 'match') return null;
  const order = useOrder(q.pairs.length, q.id);
  const usedBy = (right: number) => value.picks.findIndex((p) => p === right);
  return (
    <div className="match">
      <p className="eyebrow">Tap a term, then its match</p>
      <div className="match-grid">
        <div className="match-col">
          {q.pairs.map((p, i) => (
            <button
              key={i}
              type="button"
              className="match-item"
              data-active={active === i}
              data-paired={value.picks[i] !== null}
              data-pair={value.picks[i] !== null ? (value.picks[i] as number) % 5 : undefined}
              data-wrong={locked && value.picks[i] !== i}
              disabled={locked}
              onClick={() => setActive(active === i ? null : i)}
            >
              {p.left}
            </button>
          ))}
        </div>
        <div className="match-col">
          {order.map((ri) => {
            const owner = usedBy(ri);
            return (
              <button
                key={ri}
                type="button"
                className="match-item"
                data-paired={owner >= 0}
                data-pair={owner >= 0 ? ri % 5 : undefined}
                disabled={locked || active === null}
                onClick={() => {
                  if (active === null) return;
                  const picks = value.picks.map((p) => (p === ri ? null : p));
                  picks[active] = ri;
                  onChange({ ...value, picks });
                  setActive(null);
                }}
              >
                {q.pairs[ri].right}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function QuestionBody(props: Props<AnswerValue>) {
  switch (props.q.type) {
    case 'mc':
      return <MC {...(props as Props<Extract<AnswerValue, { type: 'mc' }>>)} />;
    case 'tf':
      return <TF {...(props as Props<Extract<AnswerValue, { type: 'tf' }>>)} />;
    case 'classify':
      return <Classify {...(props as Props<Extract<AnswerValue, { type: 'classify' }>>)} />;
    case 'je':
      return <JE {...(props as Props<Extract<AnswerValue, { type: 'je' }>>)} />;
    case 'calc':
      return <Calc {...(props as Props<Extract<AnswerValue, { type: 'calc' }>>)} />;
    case 'match':
      return <Match {...(props as Props<Extract<AnswerValue, { type: 'match' }>>)} />;
  }
}

export const typeLabel: Record<Question['type'], string> = {
  mc: 'Choose one',
  tf: 'True or false',
  classify: 'Sort these',
  je: 'Record the entry',
  calc: 'Calculate',
  match: 'Match the pairs',
};

/** The model answer, shown in the feedback sheet when the learner gets it wrong. */
export function CorrectAnswer({ q }: { q: Question }) {
  switch (q.type) {
    case 'mc':
      return <p>{q.options[q.answer]}</p>;
    case 'tf':
      return (
        <p>
          {q.answer ? 'True' : 'False'}
          {q.reasons && q.reason !== undefined ? `. ${q.reasons[q.reason]}` : ''}
        </p>
      );
    case 'calc':
      return (
        <p className="num">
          {q.unit === '$' ? '$' : ''}
          {fmt(q.answer)}
          {q.unit && q.unit !== '$' ? ` ${q.unit}` : ''}
        </p>
      );
    case 'classify':
      return (
        <ul className="answer-list">
          {q.items.map((it, i) => (
            <li key={i}>
              {it.text} <b>{q.buckets[it.bucket]}</b>
            </li>
          ))}
        </ul>
      );
    case 'match':
      return (
        <ul className="answer-list">
          {q.pairs.map((p, i) => (
            <li key={i}>
              {p.left} <b>{p.right}</b>
            </li>
          ))}
        </ul>
      );
    case 'je':
      return (
        <table className="je-answer">
          <tbody>
            {[...q.lines]
              .sort((a, b) => (a.side === b.side ? 0 : a.side === 'dr' ? -1 : 1))
              .map((l, i) => (
                <tr key={i} data-side={l.side}>
                  <td>{l.side === 'dr' ? 'Dr' : 'Cr'}</td>
                  <td className={l.side === 'cr' ? 'indent' : ''}>{l.account}</td>
                  <td className="num">{fmt(l.amount)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      );
  }
}
