import { useMemo, useState } from 'react';
import type { Question } from '../content/types';
import { conceptIndex, questionIndex } from '../content';
import { emptyAnswer, grade, isComplete, type AnswerValue } from '../engine/grade';
import type { SessionPlan } from '../engine/session';
import {
  addXp,
  finishLesson,
  getProgress,
  Rating,
  recordAttempt,
  reviewConcept,
  setFlagNote,
  toggleFlag,
  useProgress,
} from '../engine/store';
import { CorrectAnswer, QuestionBody, typeLabel } from './Questions';

export interface SessionResult {
  plan: SessionPlan;
  firstTry: number;
  total: number;
  xp: number;
}

interface Props {
  plan: SessionPlan;
  onExit: () => void;
  onDone: (r: SessionResult) => void;
}

const PRAISE = ['Correct', 'Nicely done', 'That’s it', 'Right', 'Balanced'];

export function Player({ plan, onExit, onDone }: Props) {
  const progress = useProgress();
  // Queue of question ids; a missed question goes to the back once more.
  const [queue, setQueue] = useState<Question[]>(plan.questions);
  const [pos, setPos] = useState(0);
  const [answer, setAnswer] = useState<AnswerValue>(() => emptyAnswer(plan.questions[0]));
  const [result, setResult] = useState<boolean | null>(null);
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  const [xp, setXp] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const q = queue[pos];
  const total = plan.questions.length;
  const [solved, setSolved] = useState<Set<string>>(() => new Set());
  const isRetry = q && firstTry[q.id] !== undefined;
  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], [pos]);

  function check() {
    const ok = grade(q, answer);
    setResult(ok);
    if (ok) setSolved((s) => new Set(s).add(q.id));
    recordAttempt(q.id, q.concept, ok);
    if (!isRetry) setFirstTry((f) => ({ ...f, [q.id]: ok }));
    const gained = ok ? (isRetry ? 1 : 2) : 0;
    if (gained) {
      addXp(gained);
      setXp((x) => x + gained);
    }
    if (!ok && !isRetry) setQueue((qs) => [...qs, q]);
    // Review sessions reschedule each concept on its first appearance.
    if (plan.kind !== 'lesson' && !isRetry) reviewConcept(q.concept, ok ? Rating.Good : Rating.Again);
  }

  function next() {
    if (pos + 1 < queue.length) {
      setPos(pos + 1);
      setAnswer(emptyAnswer(queue[pos + 1]));
      setResult(null);
      return;
    }
    const first = { ...firstTry };
    const firstCount = Object.values(first).filter(Boolean).length;
    let bonus = 0;
    if (plan.kind === 'lesson' && plan.lessonId) {
      bonus = 5 + (firstCount === total ? 5 : 0);
      finishLesson(plan.lessonId, Math.round((firstCount / total) * 100));
      // New concepts enter the review queue; ones already scheduled keep their schedule.
      const byConcept = new Map<string, boolean>();
      for (const qq of plan.questions) byConcept.set(qq.concept, (byConcept.get(qq.concept) ?? true) && !!first[qq.id]);
      const cards = getProgress().cards;
      for (const [c, ok] of byConcept) if (!cards[c]) reviewConcept(c, ok ? Rating.Good : Rating.Hard);
    } else {
      bonus = 3;
    }
    addXp(bonus);
    onDone({ plan, firstTry: firstCount, total, xp: xp + bonus });
  }

  if (!q) return null;
  const info = questionIndex.get(q.id);
  const concept = conceptIndex.get(q.concept)?.concept;
  const flagged = !!progress.flags[q.id];
  const ready = isComplete(q, answer);

  return (
    <div className="player">
      <header className="player-top">
        <button type="button" className="icon-btn" aria-label="Quit session" onClick={() => setConfirmQuit(true)}>
          ×
        </button>
        <div
          className="bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={solved.size}
        >
          <span style={{ width: `${(solved.size / total) * 100}%` }} />
        </div>
        <span className="xp-pill num">+{xp} XP</span>
      </header>

      <main className="player-body" key={`${q.id}-${pos}`}>
        <p className="eyebrow">
          {isRetry ? 'Try again · ' : ''}
          {typeLabel[q.type]}
          {plan.kind !== 'lesson' && info ? ` · Unit ${info.unit.number}` : ''}
        </p>
        <h2 className="prompt">{q.prompt}</h2>
        <QuestionBody q={q} value={answer} onChange={setAnswer} locked={result !== null} />
      </main>

      {result === null ? (
        <footer className="action-bar">
          <button type="button" className="btn primary wide" disabled={!ready} onClick={check}>
            Check
          </button>
        </footer>
      ) : (
        <footer className="feedback" data-ok={result} role="status">
          <div className="feedback-head">
            <strong>{result ? praise : 'Not quite'}</strong>
            <button
              type="button"
              className="flag"
              aria-pressed={flagged}
              onClick={() => toggleFlag(q.id)}
              title="Flag this question if something looks wrong"
            >
              {flagged ? 'Flagged' : 'Flag'}
            </button>
          </div>
          {!result && (
            <div className="feedback-answer">
              <span className="eyebrow">Correct answer</span>
              <CorrectAnswer q={q} />
            </div>
          )}
          <p className="explain">{q.explain}</p>
          <p className="ref">
            {q.ref}
            {concept ? ` · ${concept.title}` : ''}
          </p>
          {flagged && (
            <input
              id={`flag-note-${q.id}`}
              className="flag-note"
              placeholder="What looks wrong? (optional)"
              defaultValue={progress.flags[q.id]?.note}
              onBlur={(e) => setFlagNote(q.id, e.target.value)}
            />
          )}
          <button type="button" className="btn wide" data-tone={result ? 'good' : 'bad'} onClick={next}>
            Continue
          </button>
        </footer>
      )}

      {confirmQuit && (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="quit-title">
          <div className="sheet">
            <h3 id="quit-title">Leave this session?</h3>
            <p>XP you’ve earned stays. Lesson progress for this session won’t be saved.</p>
            <div className="sheet-actions">
              <button type="button" className="btn primary" onClick={() => setConfirmQuit(false)}>
                Keep going
              </button>
              <button type="button" className="btn" onClick={onExit}>
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
