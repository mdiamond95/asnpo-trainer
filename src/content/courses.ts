import type { CourseId } from './types';

export interface Course {
  id: CourseId;
  name: string;
  short: string;
  tagline: string;
}

// The three "languages". Colours live in styles.css under [data-course].
export const courses: Course[] = [
  {
    id: 'basics',
    name: 'NPO Basics',
    short: 'Basics',
    tagline: 'The statement set, net assets, funds and how contributions are recorded.',
  },
  {
    id: 'capital',
    name: 'Capital Accounting',
    short: 'Capital',
    tagline: 'Capital assets, componentization, construction projects, write-downs and disposals.',
  },
  {
    id: 'consolidation',
    name: 'Consolidation',
    short: 'Consolidation',
    tagline: 'Control and related entities, consolidate-or-disclose, eliminations and the equity method.',
  },
];

export const courseById = new Map(courses.map((c) => [c.id, c]));
