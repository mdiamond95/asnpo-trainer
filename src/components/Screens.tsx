import { useMemo, useState } from 'react';
import type { CourseId, Lesson, Unit } from '../content/types';
import {
  conceptIndex,
  lessonConcepts,
  lessonSections,
  questionIndex,
  questionsBySection,
  sectionName,
  units,
  unitsFor,
} from '../content';
import { courseById, courses } from '../content/courses';
import { dayKey } from '../engine/dates';
import {
  mistakesSession,
  practiceSession,
  reviewSession,
  REVIEW_SIZE,
  SECTION_SIZE,
  sectionSession,
  type SessionPlan,
} from '../engine/session';
import {
  currentStreak,
  dueConcepts,
  exportProgress,
  freezesLeft,
  importProgress,
  mistakeQuestions,
  resetProgress,
  setCourse,
  setDailyGoal,
  toggleFlag,
  useProgress,
  type Progress,
} from '../engine/store';
import { Emblem, Icon } from './Art';
import { Confetti } from './Confetti';
import type { SessionResult } from './Player';

// ---------- shared bits ----------

export function SectionTags({ sections, small }: { sections: string[]; small?: boolean }) {
  if (!sections.length) return null;
  return (
    <span className={small ? 'sec-tags small' : 'sec-tags'}>
      {sections.map((s) => (
        <span key={s} className="sec-tag num" title={sectionName(s)}>
          §{s}
        </span>
      ))}
    </span>
  );
}

export function StatusStrip() {
  const p = useProgress();
  const today = p.xpByDay[dayKey()] ?? 0;
  const pct = Math.min(1, today / p.dailyGoal);
  const streak = currentStreak(p);
  return (
    <div className="status-strip">
      <span className="stat streak" data-lit={streak > 0} title="Day streak">
        {Icon.flame}
        <b className="num">{streak}</b>
        <span className="sr">day streak</span>
      </span>
      <span className="stat goal-stat" title={`${today} of ${p.dailyGoal} XP today`}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="ring">
          <circle cx="12" cy="12" r="9.5" className="ring-track" />
          <circle
            cx="12"
            cy="12"
            r="9.5"
            className="ring-fill"
            strokeDasharray={`${pct * 59.7} 59.7`}
            transform="rotate(-90 12 12)"
          />
        </svg>
        <b className="num">{today}</b>
        <span className="sr">of {p.dailyGoal} XP today</span>
      </span>
    </div>
  );
}

export function courseStats(p: Progress, course: CourseId) {
  const lessons = unitsFor(course).flatMap((u) => u.lessons);
  const done = lessons.filter((l) => p.lessons[l.id]).length;
  return { done, total: lessons.length };
}

export function CourseButton({ onOpen }: { onOpen: () => void }) {
  const p = useProgress();
  const c = courseById.get(p.course)!;
  return (
    <button type="button" className="course-btn" onClick={onOpen} aria-label={`Course: ${c.name}. Switch course`}>
      <Emblem course={c.id} size={30} />
      <span>{c.short}</span>
      {Icon.chevron}
    </button>
  );
}

export function CourseSheet({ onClose }: { onClose: () => void }) {
  const p = useProgress();
  return (
    <div className="sheet-backdrop top" role="dialog" aria-modal="true" aria-labelledby="course-title" onClick={onClose}>
      <div className="sheet course-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 id="course-title">Choose a course</h3>
        <ul className="course-list">
          {courses.map((c) => {
            const s = courseStats(p, c.id);
            const due = dueConcepts(p, c.id).length;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className="course-card"
                  data-course={c.id}
                  aria-current={p.course === c.id}
                  onClick={() => {
                    setCourse(c.id);
                    onClose();
                  }}
                >
                  <Emblem course={c.id} size={52} />
                  <span className="course-card-text">
                    <b>{c.name}</b>
                    <span>{c.tagline}</span>
                    <span className="course-card-bar" aria-hidden="true">
                      <span style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} />
                    </span>
                    <span className="course-card-meta num">
                      {s.done}/{s.total} lessons{due ? ` · ${due} due` : ''}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function nextLesson(p: Progress, course: CourseId): { lesson: Lesson; unit: Unit } | undefined {
  for (const unit of unitsFor(course)) for (const lesson of unit.lessons) if (!p.lessons[lesson.id]) return { lesson, unit };
  return undefined;
}

// Zigzag offsets for path nodes, in px.
const SWAY = [0, 46, 70, 46, 0, -46, -70, -46];

// ---------- Learn ----------

export function LearnScreen({
  onOpenLesson,
  onOpenGuide,
  onCheckpoint,
}: {
  onOpenLesson: (lessonId: string) => void;
  onOpenGuide: (unitId: string) => void;
  onCheckpoint: (unit: Unit) => void;
}) {
  const p = useProgress();
  const course = courseById.get(p.course)!;
  const list = unitsFor(p.course);
  const upNext = nextLesson(p, p.course);
  const s = courseStats(p, p.course);
  return (
    <div className="screen learn">
      <section className="course-hero">
        <Emblem course={course.id} size={64} />
        <div>
          <p className="eyebrow">Course</p>
          <h1>{course.name}</h1>
          <p className="course-hero-meta num">
            {s.done}/{s.total} lessons complete
          </p>
        </div>
      </section>
      {list.map((unit) => {
        const doneCount = unit.lessons.filter((l) => p.lessons[l.id]).length;
        const allDone = unit.lessons.length > 0 && doneCount === unit.lessons.length;
        const checkpoint = p.lessons[`${unit.id}-checkpoint`];
        if (unit.status !== 'ready')
          return (
            <section key={unit.id} className="unit-banner planned">
              <div className="unit-banner-text">
                <p className="eyebrow">Unit {unit.number} · Coming soon</p>
                <h2>{unit.title}</h2>
                <p>{unit.summary}</p>
              </div>
              <span className="lock-badge">{Icon.lock}</span>
            </section>
          );
        return (
          <section key={unit.id} className="unit-block">
            <header className="unit-banner">
              <div className="unit-banner-text">
                <p className="eyebrow">
                  Unit {unit.number} · {doneCount}/{unit.lessons.length} lessons
                </p>
                <h2>{unit.title}</h2>
                <p className="refs">
                  Sections {unit.refs.map((r) => r.replace(/^(Part (II|III), )?Section /, '')).join(' · ')}
                </p>
              </div>
              <button type="button" className="guide-btn" onClick={() => onOpenGuide(unit.id)}>
                {Icon.book}
                <span>Guidebook</span>
              </button>
            </header>
            <ol className="trail">
              {unit.lessons.map((l, i) => {
                const rec = p.lessons[l.id];
                const isNext = upNext?.lesson.id === l.id;
                const state = rec ? 'done' : isNext ? 'next' : 'open';
                return (
                  <li key={l.id} style={{ ['--sway' as string]: `${SWAY[i % SWAY.length]}px` }}>
                    {isNext && <span className="start-bubble">Start</span>}
                    <button
                      type="button"
                      className="node"
                      data-state={state}
                      onClick={() => onOpenLesson(l.id)}
                      aria-label={`Lesson ${i + 1}: ${l.title}${rec ? ', complete' : ''}`}
                    >
                      {rec ? Icon.check : isNext ? Icon.star : <span className="num node-num">{i + 1}</span>}
                    </button>
                    <span className="node-label">
                      {l.title}
                      <SectionTags sections={lessonSections(l)} small />
                      {rec && <span className="node-best num">{rec.bestPct}%</span>}
                    </span>
                  </li>
                );
              })}
              <li style={{ ['--sway' as string]: `${SWAY[unit.lessons.length % SWAY.length]}px` }}>
                <button
                  type="button"
                  className="node trophy"
                  data-state={checkpoint ? 'done' : allDone ? 'next' : 'locked'}
                  disabled={!allDone}
                  onClick={() => onCheckpoint(unit)}
                  aria-label={allDone ? 'Unit checkpoint' : 'Unit checkpoint, finish every lesson to unlock'}
                >
                  {allDone ? Icon.trophy : Icon.lock}
                </button>
                <span className="node-label">
                  Checkpoint
                  {checkpoint && <span className="node-best num">{checkpoint.bestPct}%</span>}
                </span>
              </li>
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function ConceptList({ items }: { items: { id: string; title: string; summary: string; ref: string }[] }) {
  return (
    <ul className="concepts">
      {items.map((c) => (
        <li key={c.id}>
          <b>{c.title}</b>
          <p>{c.summary}</p>
          <span className="ref">{c.ref}</span>
        </li>
      ))}
    </ul>
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
  const types = new Set(l.questions.map((q) => q.type));
  return (
    <div className="screen intro">
      <button type="button" className="back" onClick={onBack}>
        ‹ Back
      </button>
      <section className="intro-hero">
        <Emblem course={u.course} size={72} />
        <p className="eyebrow">
          Unit {u.number} · Lesson {u.lessons.indexOf(l) + 1} of {u.lessons.length}
        </p>
        <h1>{l.title}</h1>
        <p className="lede">{l.intro}</p>
        <SectionTags sections={lessonSections(l)} />
        <p className="intro-meta">
          {l.questions.length} questions{types.has('je') ? ' · includes journal entries' : ''}
        </p>
      </section>
      <h3 className="section-label">Key ideas</h3>
      <ConceptList items={lessonConcepts(l, u)} />
      <div className="sticky-cta">
        <button type="button" className="btn primary wide" onClick={onStart}>
          Start lesson
        </button>
      </div>
    </div>
  );
}

export function Guidebook({ unitId, onBack }: { unitId: string; onBack: () => void }) {
  const u = units.find((x) => x.id === unitId);
  if (!u) return null;
  return (
    <div className="screen intro">
      <button type="button" className="back" onClick={onBack}>
        ‹ Back
      </button>
      <section className="intro-hero">
        <Emblem course={u.course} size={72} />
        <p className="eyebrow">Unit {u.number} guidebook</p>
        <h1>{u.title}</h1>
        <p className="lede">{u.summary}</p>
      </section>
      <ConceptList items={u.concepts} />
    </div>
  );
}

const CHEERS = ['Balanced!', 'Nicely done!', 'In the books!', 'Well posted!'];

export function SummaryScreen({ result, onContinue }: { result: SessionResult; onContinue: () => void }) {
  const p = useProgress();
  const pct = Math.round((result.firstTry / Math.max(1, result.total)) * 100);
  const cheer = useMemo(() => CHEERS[Math.floor(Math.random() * CHEERS.length)], []);
  const heading =
    result.plan.kind === 'lesson'
      ? 'Lesson complete'
      : result.plan.kind === 'checkpoint'
        ? 'Checkpoint cleared'
        : result.plan.kind === 'review'
          ? 'Review done'
          : 'Session done';
  return (
    <div className="screen summary">
      <Confetti />
      <div className="summary-art" aria-hidden="true">
        <Emblem course={p.course} size={120} />
        <span className="summary-badge">{pct === 100 ? Icon.star : Icon.check}</span>
      </div>
      <p className="cheer">{pct === 100 ? 'Perfect run!' : cheer}</p>
      <h1>{heading}</h1>
      <p className="muted">{result.plan.title}</p>
      <dl className="tiles">
        <div className="tile gold">
          <dt>Total XP</dt>
          <dd>
            {Icon.bolt}
            <span className="num">{result.xp}</span>
          </dd>
        </div>
        <div className="tile good">
          <dt>{pct >= 90 ? 'Amazing' : pct >= 70 ? 'Good' : 'Accuracy'}</dt>
          <dd>
            {Icon.check}
            <span className="num">{pct}%</span>
          </dd>
        </div>
        <div className="tile flame">
          <dt>Streak</dt>
          <dd>
            {Icon.flame}
            <span className="num">{currentStreak(p)}</span>
          </dd>
        </div>
      </dl>
      {result.bestCombo >= 3 && <p className="combo-note">Best combo: {result.bestCombo} in a row</p>}
      <button type="button" className="btn primary wide" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}

// ---------- Review ----------

function SectionReview({ onStart }: { onStart: (plan: SessionPlan) => void }) {
  const p = useProgress();
  const [all, setAll] = useState(false);
  const rows = useMemo(
    () =>
      [...questionsBySection.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([section, qs]) => ({
          section,
          count: qs.length,
          courses: courses.filter((c) => qs.some((q) => questionIndex.get(q.id)?.unit.course === c.id)).map((c) => c.id),
        })),
    [],
  );
  const shown = all ? rows : rows.slice(0, 6);
  return (
    <section className="panel">
      <h3 className="section-label">By section</h3>
      <p className="muted">Drill one Handbook section with questions from every course.</p>
      <ul className="sections">
        {shown.map((r) => (
          <li key={r.section}>
            <button type="button" className="section-row" onClick={() => onStart(sectionSession(p, r.section))}>
              <span className="section-num num">{r.section}</span>
              <span className="section-text">
                <span className="section-name">{sectionName(r.section)}</span>
                <span className="section-meta">
                  {r.courses.map((c) => (
                    <span key={c} className="course-dot" data-course={c} title={courseById.get(c)!.name} />
                  ))}
                  <span className="num">
                    {Math.min(r.count, SECTION_SIZE)} of {r.count} questions
                  </span>
                </span>
              </span>
              <span className="chev" aria-hidden="true">
                {Icon.chevron}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {rows.length > 6 && (
        <button type="button" className="btn wide" onClick={() => setAll(!all)}>
          {all ? 'Show fewer' : `Show all ${rows.length} sections`}
        </button>
      )}
    </section>
  );
}

export function ReviewScreen({ onStart }: { onStart: (plan: SessionPlan) => void }) {
  const p = useProgress();
  const course = courseById.get(p.course)!;
  const due = dueConcepts(p, p.course);
  const mistakes = mistakeQuestions(p, p.course).length;
  const courseUnits = unitsFor(p.course).filter((u) => u.status === 'ready');
  const learned = courseUnits.flatMap((u) => u.concepts).filter((c) => p.cards[c.id]).length;
  const nextDue = useMemo(() => {
    const ids = new Set(courseUnits.flatMap((u) => u.concepts.map((c) => c.id)));
    const dues = Object.entries(p.cards)
      .filter(([id]) => ids.has(id))
      .map(([, c]) => c.due)
      .sort();
    return dues.find((d) => new Date(d) > new Date());
  }, [p.cards, courseUnits]);

  return (
    <div className="screen">
      <h1 className="screen-title">Review</h1>
      <p className="muted">{course.name}</p>
      <section className="review-hero" data-due={due.length > 0}>
        <div className="review-count">
          <span className="big num">{due.length}</span>
          <span>{due.length === 1 ? 'concept due' : 'concepts due'}</span>
        </div>
        {due.length > 0 ? (
          <button type="button" className="btn primary wide" onClick={() => onStart(reviewSession(p, p.course))}>
            Start review · {Math.min(due.length, REVIEW_SIZE)} questions
          </button>
        ) : learned > 0 ? (
          <>
            <p className="muted">
              You’re all caught up.
              {nextDue ? ` Next review ${formatWhen(nextDue)}`.replace(/\.?$/, '.') : ''}
            </p>
            <button type="button" className="btn wide" onClick={() => onStart(practiceSession(p, p.course))}>
              Practise anyway
            </button>
          </>
        ) : (
          <p className="muted">Finish a lesson in this course and its concepts join your review schedule.</p>
        )}
      </section>
      <section className="panel mistakes-panel">
        <div className="panel-row">
          <span className="panel-icon bad">{Icon.cross}</span>
          <div>
            <h3>Mistakes</h3>
            <p className="muted">
              {mistakes === 0
                ? 'No open mistakes. Questions you miss land here until you get them right.'
                : `${mistakes} question${mistakes === 1 ? '' : 's'} you last got wrong.`}
            </p>
          </div>
        </div>
        {mistakes > 0 && (
          <button type="button" className="btn wide" onClick={() => onStart(mistakesSession(p, p.course))}>
            Fix mistakes
          </button>
        )}
      </section>
      <SectionReview onStart={onStart} />
      <section className="panel">
        <h3 className="section-label">Mastery by unit</h3>
        <ul className="mastery">
          {courseUnits.map((u) => {
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
                    {strong}/{ids.length}
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
        <p className="fine">
          The darker bar shows concepts you’re expected to remember for at least three weeks.
        </p>
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
  const p = useProgress();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = q ? units : unitsFor(p.course);
  return (
    <div className="screen">
      <h1 className="screen-title">Library</h1>
      <input
        id="library-search"
        className="search"
        type="search"
        placeholder="Search all courses, e.g. endowment"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {list
        .filter((u) => u.status === 'ready')
        .map((u) => {
          const items = u.concepts.filter(
            (c) => !q || `${c.title} ${c.summary} ${c.ref}`.toLowerCase().includes(q),
          );
          if (!items.length) return null;
          return (
            <section key={u.id} className="library-unit" data-course={u.course}>
              <h3 className="library-head">
                <Emblem course={u.course} size={28} />
                <span>
                  {courseById.get(u.course)?.short} · Unit {u.number}: {u.title}
                </span>
              </h3>
              <ConceptList items={items} />
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
      return `${id} (${info ? courseById.get(info.unit.course)?.short : ''} unit ${info?.unit.number}, ${info?.lesson.title}): ${info?.question.prompt}${f.note ? `\n  Note: ${f.note}` : ''}`;
    })
    .join('\n\n');

  return (
    <div className="screen">
      <h1 className="screen-title">Progress</h1>
      <dl className="tiles">
        <div className="tile flame">
          <dt>Day streak</dt>
          <dd>
            {Icon.flame}
            <span className="num">{currentStreak(p)}</span>
          </dd>
        </div>
        <div className="tile gold">
          <dt>Total XP</dt>
          <dd>
            {Icon.bolt}
            <span className="num">{p.xp}</span>
          </dd>
        </div>
        <div className="tile ice">
          <dt>Freezes</dt>
          <dd>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="ic">
              <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
            </svg>
            <span className="num">{freezesLeft(p)}</span>
          </dd>
        </div>
      </dl>

      <section className="panel">
        <h3 className="section-label">This week</h3>
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
          <span className="goal-line" style={{ bottom: `calc(1.5rem + 4px + ${(p.dailyGoal / maxXp) * 72}px)` }} />
        </div>
        <p className="fine">The dashed line is your daily goal. One streak freeze a week covers a missed day.</p>
      </section>

      <section className="panel">
        <h3 className="section-label">Courses</h3>
        <ul className="course-progress">
          {courses.map((c) => {
            const s = courseStats(p, c.id);
            return (
              <li key={c.id} data-course={c.id}>
                <Emblem course={c.id} size={40} />
                <div>
                  <div className="mastery-row">
                    <b>{c.name}</b>
                    <span className="num muted">
                      {s.done}/{s.total}
                    </span>
                  </div>
                  <div className="course-card-bar" aria-hidden="true">
                    <span style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
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
              <span className="num">{g.xp} XP a day</span>
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
              onClick={async () => {
                const ok = await copy(flagText, document.getElementById('flag-text') as HTMLTextAreaElement | null);
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
        <p className="muted">Progress is stored on this phone only. Copy a backup now and then, and keep it in Notes.</p>
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
          <li>Open mdiamond95.github.io/asnpo-trainer in Safari.</li>
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
