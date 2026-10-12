import type { CourseId, Unit } from './types';

// Units on the roadmap that don't have lessons yet. They show on the path as "Coming".
const planned = (course: CourseId, number: number, title: string, summary: string, refs: string[]): Unit => ({
  id: `${course}-planned-${number}`,
  course,
  number,
  title,
  summary,
  refs,
  status: 'planned',
  concepts: [],
  lessons: [],
});

export const plannedUnits: Unit[] = [
  planned('basics', 3, 'Expenses, allocations and related parties', 'Function versus object reporting in depth, allocated expenses and related party disclosure.', ['Section 4470', 'Section 4460']),
  planned('capital', 3, 'Intangibles, collections and retirement obligations', 'Intangible assets, collections and asset retirement obligations for NPOs.', ['Section 4434', 'Section 4441', 'Section 3110']),
  planned('consolidation', 3, 'Putting it together', 'Full-cycle cases across capital, contributions and consolidation.', ['Section 4410', 'Section 4433', 'Section 4450', 'Section 4460']),
];
