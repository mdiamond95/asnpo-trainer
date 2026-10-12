import { useMemo, useState } from 'react';
import type { Lesson, Unit } from '../content/types';
import { conceptIndex, lessonConcepts, questionIndex, units } from '../content';
import { dayKey } from '../engine/dates';
import { mistakesSession, practiceSession, reviewSession, REVIEW_SIZE, type SessionPlan } from '../engine/session';
import {
  currentStreak,
  dueConcepts,
  exportProgress,
  freezesLeft,
  importProgress,
  mistakeQuestions,
  resetProgress,
  setDailyGoal,
  toggleFlag,
  useProgress,
  type Progress,
} from '../engine/store';
import type { SessionResult } from './Player';

// ---------- shared bits ----------

export function StatusStrip() {
  const p = useProgress();
  const today = p.xpByDay[dayKey()] ?? 0;
  const pct = Math.min(1, today / p.dailyGoal);
  const streak = currentStreak(p);
  const due = dueConcepts(p).length;
  return (
    <div className="status-strip">
      <span className="stat" title="Day streak">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="stat-icon streak-icon">
          <path d="M8 1c.6 2.4 4 4.2 4 8a4 4 0 0 1-8 0c0-1.7.8-2.9 1.7-3.8.2 1.2.8 2 1.6 2.3C6.9 5.2 7.4 3 8 1z" />
        </svg>
        <b className="num">{streak}</b>
        <span className="sr">day streak</span>
      </span>
      <span className="stat" title={`${today} of ${p.dailyGoal} XP today`}>
        <svg viewBox="0 0 20 20" aria-hidden="true" className="ring">
          <circle cx="10" cy="10" r="8" className="ring-track" />
          <circle
            cx="10"
            cy="10"
            r="8"
            className="ring-fill"
            strokeDasharray={`${pct * 50.27} 50.27`}
            transform="rotate(-90 10 10)"
          />
        </svg>
        <b className="num">
          {today}/{p.dailyGoal}
        </b>
        <span className="sr">XP today</span>
      </span>
      <span className="stat" title="Concepts due for review">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="stat-icon">
          <path d="M8 2a6 6 0 1 0 6 6h-1.6A4.4 4.4 0 1 1 8 3.6V6l3.2-3.2L8 0z" />
        </svg>
        <b className="num">{due}</b>
        <span className="sr">due</span>
      </span>
    </div>
  );
}

function nextLesson(p: Progress): { lesson: Lesson; unit: Unit } | undefined {
  for (const unit of units) for (const lesson of unit.lessons) if (!p.lessons[lesson.id]) return { lesson, unit };
  return undefined;
}

// ---------- Learn ----------

export function LearnScreen({ onOpenLesson }: { onOpenLesson: (lessonId: string) => void }) {
  const p = useProgress();
  const upNext = nextLesson(p);
  return (
    <div className="screen">
      {upNext && (
        <button type="button" className="up-next" onClick={() => onOpenLesson(upNext.lesson.id)}>
          <span className="eyebrow">Up next · Unit {upNext.unit.number}</span>
          <span className="up-next-title">{upNext.lesson.title}</span>
          <span className="up-next-meta">{upNext.lesson.questions.length} questions · about 5 minutes</span>
        </button>
      )}
      <ol className="path">
        {units.map((unit) => {
          const doneCount = unit.lessons.filter((l) => p.lessons[l.id]).length;
          return (
            <li key={unit.id} className="unit" data-status={unit.status}>
              <div className="unit-head">
                <span className="unit-no num">{String(unit.number).padStart(2, '0')}</span>
                <div className="unit-text">
                  <h2>{unit.title}</h2>
                  <p>{unit.summary}</p>
                  <p className="refs">Sections {unit.refs.map((r) => r.replace(/^(Part III, )?Section /, '')).join(' · ')}</p>
                </div>
              </div>
              {unit.status === 'ready' ? (
                <>
                  <div className="unit-meter" aria-label={`${doneCount} of ${unit.lessons.length} lessons done`}>
                    <span style={{ width: `${(doneCount / unit.lessons.length) * 100}%` }} />
                  </div>
                  <ol className="lessons">
                    {unit.lessons.map((l, i) => {
                      const rec = p.lessons[l.id];
                      const isNext = upNext?.lesson.id === l.id;
                      return (
                        <li key={l.id}>
                          <button
                            type="button"
                            className="lesson-node"
                            data-state={rec ? 'done' : isNext ? 'next' : 'open'}
                            onClick={() => onOpenLesson(l.id)}
                          >
                            <span className="node-dot num" aria-hidden="true">
                              {rec ? '✓' : i + 1}
                            </span>
                            <span className="node-text">
                              <span className="node-title">{l.title}</span>
                              <span className="node-meta">
                                {rec
                                  ? `Best ${rec.bestPct}% first try${rec.completions > 1 ? ` · done ${rec.completions}×` : ''}`
                                  : `${l.questions.length} questions`}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </>
              ) : (
                <p className="coming">Lessons coming in a later update</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function LessonIntro({
  lessonId,
  onStart,
  onBack,
}: {
  lessonId: string;
  onStart: () => void;
  onBack: () => void;
}) {
  const found = units.flatMap((u) => u.lessons.map((l) => ({ l, u }))).find((x) => x.l.id === lessonId);
  if (!found) return null;
  const { l, u } = found;
  const concepts = lessonConcepts(l, u);
  return (
    <div className="screen intro">
      <button type="button" className="back" onClick={onBack}>
        ‹ Back
      </button>
      <p className="eyebrow">
        Unit {u.number} · Lesson {u.lessons.indexOf(l) + 1} of {u.lessons.length}
      </p>
      <h1>{l.title}</h1>
      <p className="lede">{l.intro}</p>
      <h3 className="section-label">Key ideas</h3>
      <ul className="concepts">
        {concepts.map((c) => (
          <li key={c.id}>
            <b>{c.title}</b>
            <p>{c.summary}</p>
            <span className="ref">{c.ref}</span>
          </li>
        ))}
      </ul>
      <div className="sticky-cta">
        <button type="button" className="btn primary wide" onClick={onStart}>
          Start lesson · {l.questions.length} questions
        </button>
      </div>
    </div>
  );
}

export function SummaryScreen({ result, onContinue }: { result: SessionResult; onContinue: () => void }) {
  const p = useProgress();
  const pct = Math.round((result.firstTry / Math.max(1, result.total)) * 100);
  const heading =
    result.plan.kind === 'lesson' ? 'Lesson complete' : result.plan.kind === 'review' ? 'Review done' : 'Session done';
  return (
    <div className="screen summary">
      <div className="summary-card">
        <p className="eyebrow">{result.plan.title}</p>
        <h1>{heading}</h1>
        <dl className="summary-stats">
          <div>
            <dt>First-try accuracy</dt>
            <dd className="num">{pct}%</dd>
          </div>
          <div>
            <dt>XP earned</dt>
            <dd className="num">+{result.xp}</dd>
          </div>
          <div>
            <dt>Day streak</dt>
            <dd className="num">{currentStreak(p)}</dd>
          </div>
        </dl>
        {pct === 100 && <p className="perfect">Perfect run. Every entry balanced the first time.</p>}
      </div>
      <button type="button" className="btn primary wide" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}

// ---------- Review ----------

export function ReviewScreen({ onStart }: { onStart: (plan: SessionPlan) => void }) {
  const p = useProgress();
  const due = dueConcepts(p);
  const mistakes = mistakeQuestions(p).length;
  const learned = Object.keys(p.cards).length;
  const nextDue = useMemo(() => {
    const dues = Object.values(p.cards).map((c) => c.due).sort();
    return dues.find((d) => new Date(d) > new Date());
  }, [p.cards]);

  return (
    <div className="screen">
      <h1 className="screen-title">Review</h1>
      <section className="panel review-main">
        <p className="big num">{due.length}</p>
        <p>{due.length === 1 ? 'concept is' : 'concepts are'} due for review</p>
        {due.length > 0 ? (
          <button type="button" className="btn primary wide" onClick={() => onStart(reviewSession(p))}>
            Start review · {Math.min(due.length, REVIEW_SIZE)} questions
          </button>
        ) : learned > 0 ? (
          <>
            <p className="muted">
              Nothing due right now.
              {nextDue ? ` Next review ${formatWhen(nextDue)}`.replace(/\.?$/, '.') : ''}
            </p>
            <button type="button" className="btn wide" onClick={() => onStart(practiceSession(p))}>
              Practise anyway
            </button>
          </>
        ) : (
          <p className="muted">Finish a lesson and its concepts join your review schedule.</p>
        )}
      </section>
      <section className="panel">
        <h3 className="section-label">Mistakes</h3>
        <p>
          {mistakes === 0
            ? 'No open mistakes. Questions you miss show up here until you get them right.'
            : `${mistakes} question${mistakes === 1 ? '' : 's'} you last got wrong.`}
        </p>
        {mistakes > 0 && (
          <button type="button" className="btn wide" onClick={() => onStart(mistakesSession(p))}>
            Fix mistakes
          </button>
        )}
      </section>
      <section className="panel">
        <h3 className="section-label">Mastery by unit</h3>
        <ul className="mastery">
          {units
            .filter((u) => u.status === 'ready')
            .map((u) => {
              const ids = u.concepts.map((c) => c.id);
              const seen = ids.filter((id) => p.cards[id]).length;
              const strong = ids.filter((id) => (p.cards[id]?.stability ?? 0) >= 21).length;
              return (
                <li key={u.id}>
                  <div className="mastery-row">
                    <span>
                      Unit {u.number}: {u.title}
                    </span>
                    <span className="num muted">
                      {strong}/{ids.length} strong
                    </span>
                  </div>
                  <div className="mastery-bar" aria-hidden="true">
                    <span className="seen" style={{ width: `${(seen / ids.length) * 100}%` }} />
                    <span className="strong" style={{ width: `${(strong / ids.length) * 100}%` }} />
                  </div>
                </li>
              );
            })}
        </ul>
        <p className="fine">Strong means you’re expected to remember it for at least three weeks.</p>
      </section>
    </div>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const days = Math.round((d.getTime() - Date.now()) / 864e5);
  if (days <= 0) return `today at ${d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}`;
  if (days === 1) return 'tomorrow';
  return `on ${d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}`;
}

// ---------- Library ----------

export function LibraryScreen() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  return (
    <div className="screen">
      <h1 className="screen-title">Library</h1>
      <input
        id="library-search"
        className="search"
        type="search"
        placeholder="Search concepts, e.g. endowment"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {units
        .filter((u) => u.status === 'ready')
        .map((u) => {
          const items = u.concepts.filter(
            (c) => !q || `${c.title} ${c.summary} ${c.ref}`.toLowerCase().includes(q),
          );
          if (!items.length) return null;
          return (
            <section key={u.id} className="library-unit">
              <h3 className="section-label">
                Unit {u.number} · {u.title}
              </h3>
              <ul className="concepts">
                {items.map((c) => (
                  <li key={c.id}>
                    <b>{c.title}</b>
                    <p>{c.summary}</p>
                    <span className="ref">{c.ref}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      <p className="fine">
        Summaries paraphrase CPA Canada Handbook – Accounting, Part III. Check the Handbook itself before relying on a
        point at work.
      </p>
    </div>
  );
}

// ---------- Profile ----------

const GOALS = [
  { xp: 10, label: 'Light' },
  { xp: 20, label: 'Steady' },
  { xp: 30, label: 'Serious' },
  { xp: 50, label: 'Intense' },
];

async function copy(text: string, el: HTMLTextAreaElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    el?.focus();
    el?.select();
    return false;
  }
}

export function ProfileScreen() {
  const p = useProgress();
  const [backupText, setBackupText] = useState('');
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const flagged = Object.entries(p.flags);

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = dayKey(d);
    return { k, xp: p.xpByDay[k] ?? 0, label: d.toLocaleDateString('en-CA', { weekday: 'narrow' }) };
  });
  const maxXp = Math.max(p.dailyGoal, ...week.map((w) => w.xp));

  const flagText = flagged
    .map(([id, f]) => {
      const info = questionIndex.get(id);
      return `${id} (Unit ${info?.unit.number}, ${info?.lesson.title}): ${info?.question.prompt}${f.note ? `\n  Note: ${f.note}` : ''}`;
    })
    .join('\n\n');

  return (
    <div className="screen">
      <h1 className="screen-title">Progress</h1>
      <section className="panel">
        <dl className="profile-stats">
          <div>
            <dt>Day streak</dt>
            <dd className="num">{currentStreak(p)}</dd>
          </div>
          <div>
            <dt>Total XP</dt>
            <dd className="num">{p.xp}</dd>
          </div>
          <div>
            <dt>Streak freezes</dt>
            <dd className="num">{freezesLeft(p)}</dd>
          </div>
        </dl>
        <div className="week" role="img" aria-label="XP earned over the last 7 days">
          {week.map((w) => (
            <div key={w.k} className="week-col" data-today={w.k === dayKey()}>
              <span className="week-val num">{w.xp || ''}</span>
              <span className="week-bar" data-met={w.xp >= p.dailyGoal}>
                <span style={{ height: `${(w.xp / maxXp) * 100}%` }} />
              </span>
              <span className="week-day">{w.label}</span>
            </div>
          ))}
          <span className="goal-line" style={{ bottom: `calc(1.5rem + ${(p.dailyGoal / maxXp) * 72}px)` }} />
        </div>
        <p className="fine">You get one streak freeze a week. It covers a single missed day automatically.</p>
      </section>

      <section className="panel">
        <h3 className="section-label">Daily goal</h3>
        <div className="goal-grid" role="radiogroup" aria-label="Daily goal">
          {GOALS.map((g) => (
            <button
              key={g.xp}
              type="button"
              role="radio"
              aria-checked={p.dailyGoal === g.xp}
              className="goal"
              data-selected={p.dailyGoal === g.xp}
              onClick={() => setDailyGoal(g.xp)}
            >
              <b>{g.label}</b>
              <span className="num">{g.xp} XP</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="section-label">Flagged questions</h3>
        {flagged.length === 0 ? (
          <p className="muted">
            Tap Flag after any answer that looks wrong. Copy the list here and paste it to Claude to get them fixed.
          </p>
        ) : (
          <>
            <ul className="flag-list">
              {flagged.map(([id, f]) => {
                const info = questionIndex.get(id);
                return (
                  <li key={id}>
                    <p>{info?.question.prompt ?? id}</p>
                    {f.note && <p className="muted">Note: {f.note}</p>}
                    <button type="button" className="link" onClick={() => toggleFlag(id)}>
                      Remove flag
                    </button>
                  </li>
                );
              })}
            </ul>
            <textarea id="flag-text" className="mono-box" readOnly value={flagText} rows={4} />
            <button
              type="button"
              className="btn wide"
              onClick={async (e) => {
                const ok = await copy(
                  flagText,
                  (e.currentTarget.previousElementSibling as HTMLTextAreaElement) ?? null,
                );
                setMsg(ok ? 'Flagged questions copied.' : 'Text selected. Use Copy from the menu.');
              }}
            >
              Copy flagged list
            </button>
          </>
        )}
      </section>

      <section className="panel">
        <h3 className="section-label">Backup</h3>
        <p className="muted">
          Progress is stored on this phone only. Copy a backup now and then, and keep it in Notes.
        </p>
        <button
          type="button"
          className="btn wide"
          onClick={async () => {
            const text = exportProgress();
            setBackupText(text);
            const ok = await copy(text, document.getElementById('backup-out') as HTMLTextAreaElement | null);
            setMsg(ok ? 'Backup copied. Paste it somewhere safe.' : 'Backup shown below. Select it and copy.');
          }}
        >
          Copy backup
        </button>
        {backupText && <textarea id="backup-out" className="mono-box" readOnly value={backupText} rows={3} />}
        <label className="field-label" htmlFor="backup-in">
          Restore from a backup
        </label>
        <textarea
          id="backup-in"
          className="mono-box"
          placeholder="Paste a backup here"
          value={importText}
          rows={3}
          onChange={(e) => setImportText(e.target.value)}
        />
        <button
          type="button"
          className="btn wide"
          disabled={!importText.trim()}
          onClick={() => {
            const err = importProgress(importText);
            setMsg(err ?? 'Progress restored.');
            if (!err) setImportText('');
          }}
        >
          Restore
        </button>
      </section>

      <section className="panel">
        <h3 className="section-label">Install on iPhone</h3>
        <ol className="steps">
          <li>Open this app’s web address in Safari.</li>
          <li>Tap the Share button, then Add to Home Screen.</li>
          <li>Open Fund Balance from the new home-screen icon. It works offline.</li>
        </ol>
      </section>

      <section className="panel danger">
        {confirmReset ? (
          <>
            <p>This erases your XP, streak, lesson history and review schedule on this phone.</p>
            <div className="sheet-actions">
              <button type="button" className="btn" onClick={() => setConfirmReset(false)}>
                Keep my progress
              </button>
              <button
                type="button"
                className="btn bad"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                  setMsg('Progress erased.');
                }}
              >
                Erase progress
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="link danger-link" onClick={() => setConfirmReset(true)}>
            Erase all progress…
          </button>
        )}
      </section>

      {msg && (
        <div className="toast" role="status" onAnimationEnd={() => setMsg(null)}>
          {msg}
        </div>
      )}
      <p className="fine center">
        Fund Balance · {conceptIndex.size} concepts · {questionIndex.size} questions
      </p>
    </div>
  );
}
