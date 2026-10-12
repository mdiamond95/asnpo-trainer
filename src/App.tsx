import { useEffect, useState } from 'react';
import { findLesson } from './content';
import type { Unit } from './content/types';
import { checkpointSession, type SessionPlan } from './engine/session';
import { Player, type SessionResult } from './components/Player';
import {
  CourseButton,
  CourseSheet,
  Guidebook,
  LearnScreen,
  LessonIntro,
  LibraryScreen,
  ProfileScreen,
  ReviewScreen,
  StatusStrip,
  SummaryScreen,
} from './components/Screens';
import { dueConcepts, getProgress, useProgress } from './engine/store';

type Tab = 'learn' | 'review' | 'library' | 'profile';
type Overlay =
  | { kind: 'intro'; lessonId: string }
  | { kind: 'guide'; unitId: string }
  | { kind: 'session'; plan: SessionPlan }
  | { kind: 'summary'; result: SessionResult }
  | null;

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'learn', label: 'Learn', icon: 'M4 18V9l8-5 8 5v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z' },
  { id: 'review', label: 'Review', icon: 'M12 4a8 8 0 1 0 8 8h-2.5A5.5 5.5 0 1 1 12 6.5V10l5-4.5L12 1z' },
  { id: 'library', label: 'Library', icon: 'M4 5c3-1.5 5.5-1.5 8 .5v14c-2.5-2-5-2-8-.5zM20 5c-3-1.5-5.5-1.5-8 .5v14c2.5-2 5-2 8-.5z' },
  { id: 'profile', label: 'Progress', icon: 'M5 20V12M10 20V7M15 20v-9M20 20V4' },
];

function readTab(): Tab {
  const h = location.hash.replace('#', '');
  return (['learn', 'review', 'library', 'profile'] as Tab[]).includes(h as Tab) ? (h as Tab) : 'learn';
}

export function App() {
  const [tab, setTab] = useState<Tab>(readTab);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [courseSheet, setCourseSheet] = useState(false);
  const p = useProgress();
  const due = dueConcepts(p, p.course).length;

  useEffect(() => {
    document.documentElement.dataset.course = p.course;
  }, [p.course]);

  useEffect(() => {
    try {
      history.replaceState(null, '', `#${tab}`);
    } catch {
      /* sandboxed */
    }
  }, [tab]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [overlay?.kind, tab, p.course]);

  if (overlay?.kind === 'session') {
    return (
      <Player
        key={overlay.plan.title + overlay.plan.questions.length}
        plan={overlay.plan}
        onExit={() => setOverlay(null)}
        onDone={(result) => setOverlay({ kind: 'summary', result })}
      />
    );
  }
  if (overlay?.kind === 'summary') {
    return <SummaryScreen result={overlay.result} onContinue={() => setOverlay(null)} />;
  }
  if (overlay?.kind === 'guide') {
    return <Guidebook unitId={overlay.unitId} onBack={() => setOverlay(null)} />;
  }
  if (overlay?.kind === 'intro') {
    return (
      <LessonIntro
        lessonId={overlay.lessonId}
        onBack={() => setOverlay(null)}
        onStart={() => {
          const found = findLesson(overlay.lessonId);
          if (found)
            setOverlay({
              kind: 'session',
              plan: { kind: 'lesson', title: found.lesson.title, lessonId: found.lesson.id, questions: found.lesson.questions },
            });
        }}
      />
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <CourseButton onOpen={() => setCourseSheet(true)} />
        <StatusStrip />
      </header>
      <main>
        {tab === 'learn' && (
          <LearnScreen
            onOpenLesson={(id) => setOverlay({ kind: 'intro', lessonId: id })}
            onOpenGuide={(id) => setOverlay({ kind: 'guide', unitId: id })}
            onCheckpoint={(unit: Unit) => setOverlay({ kind: 'session', plan: checkpointSession(getProgress(), unit) })}
          />
        )}
        {tab === 'review' && <ReviewScreen onStart={(plan) => plan.questions.length && setOverlay({ kind: 'session', plan })} />}
        {tab === 'library' && <LibraryScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </main>
      <nav className="tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="tab"
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={t.icon} />
            </svg>
            <span>{t.label}</span>
            {t.id === 'review' && due > 0 && <span className="badge num">{due}</span>}
          </button>
        ))}
      </nav>
      {courseSheet && <CourseSheet onClose={() => setCourseSheet(false)} />}
    </div>
  );
}
