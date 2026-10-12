import type { Concept, CourseId, Lesson, Question, Unit } from './types';
import { plannedUnits } from './planned';

const files = import.meta.glob<Unit>('../../content/*.yaml', { eager: true, import: 'default' });

const readyUnits = Object.values(files).map((u) => ({ ...u, status: 'ready' as const }));
const readyKeys = new Set(readyUnits.map((u) => `${u.course}-${u.number}`));

export const units: Unit[] = [...readyUnits, ...plannedUnits.filter((u) => !readyKeys.has(`${u.course}-${u.number}`))].sort(
  (a, b) => a.number - b.number,
);

export function unitsFor(course: CourseId): Unit[] {
  return units.filter((u) => u.course === course);
}

export interface QuestionInfo {
  question: Question;
  lesson: Lesson;
  unit: Unit;
}

export const questionIndex = new Map<string, QuestionInfo>();
export const conceptIndex = new Map<string, { concept: Concept; unit: Unit }>();
export const questionsByConcept = new Map<string, Question[]>();

for (const unit of units) {
  for (const concept of unit.concepts) conceptIndex.set(concept.id, { concept, unit });
  for (const lesson of unit.lessons) {
    for (const question of lesson.questions) {
      questionIndex.set(question.id, { question, lesson, unit });
      const list = questionsByConcept.get(question.concept) ?? [];
      list.push(question);
      questionsByConcept.set(question.concept, list);
    }
  }
}

export function courseOfConcept(conceptId: string): CourseId | undefined {
  return conceptIndex.get(conceptId)?.unit.course;
}

export function findLesson(id: string): { lesson: Lesson; unit: Unit } | undefined {
  for (const unit of units) {
    const lesson = unit.lessons.find((l) => l.id === id);
    if (lesson) return { lesson, unit };
  }
  return undefined;
}

export function lessonConcepts(lesson: Lesson, unit: Unit): Concept[] {
  const ids = new Set(lesson.questions.map((q) => q.concept));
  return unit.concepts.filter((c) => ids.has(c.id));
}

// Section tags. Every question cites "Part X, Section NNNN", so a lesson's sections come from its questions.
const SECTION_RE = /Section (\d{4})/g;

export function sectionsOf(ref: string): string[] {
  return [...ref.matchAll(SECTION_RE)].map((m) => m[1]);
}

export function lessonSections(lesson: Lesson): string[] {
  return [...new Set(lesson.questions.flatMap((q) => sectionsOf(q.ref)))].sort();
}

export const questionsBySection = new Map<string, Question[]>();
for (const { question } of questionIndex.values()) {
  for (const s of new Set(sectionsOf(question.ref))) {
    const list = questionsBySection.get(s) ?? [];
    list.push(question);
    questionsBySection.set(s, list);
  }
}

/** Handbook section names, used as labels in the "By section" review. */
export const sectionNames: Record<string, string> = {
  '1000': 'Financial statement concepts',
  '1001': 'Financial statement concepts for NPOs',
  '1100': 'Generally accepted accounting principles',
  '1101': 'Generally accepted accounting principles for NPOs',
  '1400': 'General standards of financial statement presentation',
  '1401': 'General standards of financial statement presentation for NPOs',
  '1500': 'First-time adoption',
  '1501': 'First-time adoption by NPOs',
  '1505': 'Disclosure of accounting policies',
  '1506': 'Accounting changes',
  '1540': 'Cash flow statement',
  '1591': 'Subsidiaries',
  '1601': 'Consolidated financial statements',
  '1602': 'Non-controlling interests',
  '1651': 'Foreign currency translation',
  '3031': 'Inventories',
  '3051': 'Investments',
  '3056': 'Interests in joint arrangements',
  '3061': 'Property, plant and equipment',
  '3063': 'Impairment of long-lived assets',
  '3064': 'Goodwill and intangible assets',
  '3065': 'Leases',
  '3110': 'Asset retirement obligations',
  '3251': 'Equity',
  '3280': 'Contractual obligations',
  '3290': 'Contingencies',
  '3400': 'Revenue',
  '3462': 'Employee future benefits',
  '3463': 'Employee future benefits for NPOs',
  '3475': 'Disposal of long-lived assets',
  '3800': 'Government assistance',
  '3820': 'Subsequent events',
  '3840': 'Related party transactions',
  '3856': 'Financial instruments',
  '4400': 'Financial statement presentation by NPOs',
  '4410': 'Contributions: revenue recognition',
  '4420': 'Contributions receivable',
  '4431': 'Tangible capital assets (former standard)',
  '4432': 'Intangible assets (former standard)',
  '4433': 'Tangible capital assets held by NPOs',
  '4434': 'Intangible assets held by NPOs',
  '4440': 'Collections held by NPOs (former standard)',
  '4441': 'Collections held by NPOs',
  '4449': 'Combinations by NPOs',
  '4450': 'Reporting controlled and related entities by NPOs',
  '4460': 'Disclosure of related party transactions by NPOs',
  '4470': 'Disclosure of allocated expenses by NPOs',
};

export function sectionName(s: string): string {
  return sectionNames[s] ?? `Section ${s}`;
}
