import type { Unit } from './types';

// Units on the roadmap that don't have lessons yet. They show on the path as "Coming".
const planned = (number: number, title: string, summary: string, refs: string[]): Unit => ({
  id: `u${number}`,
  number,
  title,
  summary,
  refs,
  status: 'planned',
  concepts: [],
  lessons: [],
});

export const plannedUnits: Unit[] = [
  planned(1, 'NPO reporting foundations', 'Statement set, fund accounting and net asset classes.', ['Section 4400', 'Section 1401']),
  planned(2, 'Contributions and the two methods', 'Restricted, endowment and unrestricted contributions under the deferral and restricted fund methods.', ['Section 4410', 'Section 4420']),
  planned(3, 'Capital contributions', 'Deferred capital contributions, amortizing them with the asset, land and unspent capital funds.', ['Section 4410']),
  planned(4, 'Tangible capital assets', 'Recognition, cost, contributed assets, componentization, amortization and the small-NPO exemption.', ['Section 4433', 'Section 3061']),
  planned(5, 'Capital projects', 'Construction in progress, directly attributable costs, betterments and multi-year capital grants.', ['Section 4433', 'Section 4410', 'Section 3061']),
  planned(6, 'Impairment, disposal and other assets', 'Write-downs, disposals, intangibles, collections and asset retirement obligations.', ['Section 4433', 'Section 4434', 'Section 4441', 'Section 3110']),
  planned(7, 'Control and related entities', 'Control, joint control, significant influence and economic interest; foundations and subsidiaries.', ['Section 4450', 'Section 4460']),
  planned(8, 'Consolidation mechanics', 'Consolidate or disclose, consolidation steps, eliminations and the equity method.', ['Section 4450', 'Section 1591', 'Section 3056']),
  planned(9, 'Putting it together', 'Full-cycle cases across capital, contributions and consolidation.', ['Section 4410', 'Section 4433', 'Section 4450', 'Section 4460', 'Section 4470']),
];
