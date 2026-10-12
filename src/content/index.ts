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
