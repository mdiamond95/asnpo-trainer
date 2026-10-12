// Validates every content/unit-*.yaml file. Run with `npm run check:content`; CI runs it before deploying.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { Question, Unit } from '../src/content/types';

const dir = join(import.meta.dirname, '..', 'content');
const problems: string[] = [];
const seen = new Set<string>();
let count = 0;

function check(u: Unit, q: Question, where: string) {
  const fail = (msg: string) => problems.push(`${where} ${q.id}: ${msg}`);
  if (seen.has(q.id)) fail('duplicate question id');
  seen.add(q.id);
  for (const k of ['prompt', 'explain', 'ref', 'concept'] as const) if (!q[k]) fail(`missing ${k}`);
  if (!u.concepts.some((c) => c.id === q.concept)) fail(`unknown concept ${q.concept}`);
  if (/\b\d{4}\.\d{2}\b/.test(q.ref)) fail('cite the section, not a paragraph number');
  switch (q.type) {
    case 'mc':
      if (q.options?.length !== 4) fail('needs exactly 4 options');
      if (!(q.answer >= 0 && q.answer < (q.options?.length ?? 0))) fail('answer index out of range');
      break;
    case 'tf':
      if (typeof q.answer !== 'boolean') fail('answer must be true or false');
      if (q.reasons && !(q.reason! >= 0 && q.reason! < q.reasons.length)) fail('reason index out of range');
      break;
    case 'classify':
      if (!q.buckets?.length || !q.items?.length) fail('needs buckets and items');
      q.items?.forEach((it, i) => {
        if (!(it.bucket >= 0 && it.bucket < q.buckets.length)) fail(`item ${i} bucket out of range`);
      });
      break;
    case 'je': {
      const dr = q.lines.filter((l) => l.side === 'dr').reduce((s, l) => s + l.amount, 0);
      const cr = q.lines.filter((l) => l.side === 'cr').reduce((s, l) => s + l.amount, 0);
      if (Math.abs(dr - cr) > 0.001) fail(`entry doesn't balance (Dr ${dr}, Cr ${cr})`);
      for (const l of q.lines) if (!q.accounts.includes(l.account)) fail(`account "${l.account}" not in choices`);
      if (q.lines.some((l) => l.side !== 'dr' && l.side !== 'cr')) fail('side must be dr or cr');
      break;
    }
    case 'calc':
      if (typeof q.answer !== 'number') fail('answer must be a number');
      break;
    case 'match':
      if (!(q.pairs?.length >= 3)) fail('needs at least 3 pairs');
      break;
    default:
      fail(`unknown type ${(q as Question).type}`);
  }
}

for (const file of readdirSync(dir).filter((f) => /^unit-\d+\.yaml$/.test(f)).sort()) {
  const u = parse(readFileSync(join(dir, file), 'utf8')) as Unit;
  for (const l of u.lessons) for (const q of l.questions) {
    check(u, q, `${file} ${l.id}`);
    count++;
  }
  const used = new Set(u.lessons.flatMap((l) => l.questions.map((q) => q.concept)));
  for (const c of u.concepts) if (!used.has(c.id)) problems.push(`${file}: concept ${c.id} has no questions`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Content OK: ${count} questions.`);
