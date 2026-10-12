import { useEffect, useState } from 'react';
import { findLesson } from './content';
import type { SessionPlan } from './engine/session';
import { Player, type SessionResult } from './components/Player';
import {
  LearnScreen,
  LessonIntro,
  LibraryScreen,
  ProfileScreen,
  ReviewScreen,
  StatusStrip,
  SummaryScreen,
} from './components/Screens';
import { dueConcepts, useProgress } from './engine/store';

type Tab = 'learn' | 'review' | 'library' | 'profile';
type Overlay =
  | { kind: 'intro'; lessonId: string }
  | { kind: 'session'; plan: SessionPlan }
  | { kind: 'summary'; result: SessionResult }
  | null;

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'learn', label: 'Learn', icon: 'M3 17V7l7-4 7 4v10M7 17v-5h6v5' },
  { id: 'review', label: 'Review', icon: 'M10 3a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5v3l4-4-4-4z' },
  { id: 'library', label: 'Library', icon: 'M4 3h4v14H4zM10 3h4v14h-4zM15 4l3 .8-3 12.6-3-.8' },
  { id: 'profile', label: 'Progress', icon: 'M3 17h14M5 17V10M9 17V6M13 17v-8M17 17V4' },
];

function readTab(): Tab {
  const h = location.hash.replace('#', '');
  return (['learn', 'review', 'library', 'profile'] as Tab[]).includes(h as Tab) ? (h as Tab) : 'learn';
}

export function App() {
  const [tab, setTab] = useState<Tab>(readTab);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const p = useProgress();
  const due = dueConcepts(p).length;

  useEffect(() => {
    try {
      history.replaceState(null, '', `#${tab}`);
    } catch {
      /* sandboxed */
    }
  }, [tab]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [overlay?.kind, tab]);

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
        <span className="wordmark">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="mark">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M12 4v16M3 10h18" />
          </svg>
          Fund Balance
        </span>
        <StatusStrip />
      </header>
      <main>
        {tab === 'learn' && <LearnScreen onOpenLesson={(id) => setOverlay({ kind: 'intro', lessonId: id })} />}
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
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d={t.icon} />
            </svg>
            <span>{t.label}</span>
            {t.id === 'review' && due > 0 && <span className="badge num">{due}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}
