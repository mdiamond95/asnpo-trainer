import type { CourseId } from './types';

export interface Course {
  id: CourseId;
  name: string;
  short: string;
  tagline: string;
}

// The course "languages". Colours live in styles.css under [data-course].
export const courses: Course[] = [
  {
    id: 'basics',
    name: 'NPO Basics',
    short: 'Basics',
    tagline: 'The statement set, net assets, funds, presentation, allocated expenses and related parties.',
  },
  {
    id: 'revenue',
    name: 'Contributions & Revenue',
    short: 'Revenue',
    tagline: 'Both contribution methods in depth, pledges, in-kind gifts, endowments, investment income and exchange revenue.',
  },
  {
    id: 'capital',
    name: 'Capital Accounting',
    short: 'Capital',
    tagline: 'Capital assets, construction projects, write-downs, intangibles, collections, leases and retirement obligations.',
  },
  {
    id: 'consolidation',
    name: 'Consolidation',
    short: 'Consolidation',
    tagline: 'Control and related entities, consolidation mechanics, the equity method and combinations of NPOs.',
  },
  {
    id: 'part2',
    name: 'Part II for NPOs',
    short: 'Part II',
    tagline: 'The ASPE standards NPOs also follow: financial instruments, pensions, accounting changes, contingencies and first-time adoption.',
  },
];

export const courseById = new Map(courses.map((c) => [c.id, c]));
