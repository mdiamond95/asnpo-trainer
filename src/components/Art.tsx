import type { CourseId } from '../content/types';

// Course emblems: flat two-tone illustrations drawn with the course's colour tokens.
export function Emblem({ course, size = 56 }: { course: CourseId; size?: number }) {
  return (
    <svg className="emblem" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="32" className="em-bg" />
      {course === 'basics' && (
        <g>
          {/* open ledger */}
          <path d="M12 20c6-3 13-3 20 1v27c-7-4-14-4-20-1z" className="em-light" />
          <path d="M52 20c-6-3-13-3-20 1v27c7-4 14-4 20-1z" className="em-paper" />
          <path d="M36 27h12M36 32h12M36 37h9" className="em-line" />
          <path d="M16 27h12M16 32h12M16 37h8" className="em-line" />
          <path d="M32 21v27" className="em-spine" />
          <circle cx="46" cy="45" r="7" className="em-accent" />
          <path d="M43 45l2 2 4-4" className="em-tick" />
        </g>
      )}
      {course === 'revenue' && (
        <g>
          {/* open hand receiving a gift */}
          <path d="M10 44h8l10 4h12c3 0 4-4 1-5l-9-2" className="em-spine" />
          <path d="M18 40h6l12 3" className="em-spine" />
          <path d="M10 52h10l14 2 18-8c2-1 1-4-2-4l-14 4" className="em-spine" />
          <rect x="24" y="16" width="20" height="16" rx="3" className="em-paper" />
          <path d="M34 16v16M24 22h20" className="em-line" />
          <circle cx="44" cy="15" r="6" className="em-accent" />
          <path d="M41.5 15h5M44 12.5v5" className="em-tick" />
        </g>
      )}
      {course === 'capital' && (
        <g>
          {/* building going up under a crane */}
          <path d="M14 14h30M18 14v34M18 18l8-4M38 14v6" className="em-crane" />
          <path d="M36 20v5" className="em-spine" />
          <rect x="31" y="25" width="10" height="5" rx="1" className="em-accent" />
          <rect x="26" y="32" width="24" height="18" rx="2" className="em-paper" />
          <path d="M31 37h4M41 37h4M31 43h4M41 43h4" className="em-line" />
          <path d="M10 50h44" className="em-spine" />
        </g>
      )}
      {course === 'consolidation' && (
        <g>
          {/* parent with two linked entities */}
          <path d="M32 26v6M20 38v-6h24v6" className="em-spine" />
          <rect x="22" y="12" width="20" height="14" rx="4" className="em-paper" />
          <rect x="10" y="38" width="20" height="14" rx="4" className="em-light" />
          <rect x="34" y="38" width="20" height="14" rx="4" className="em-light" />
          <path d="M27 19h10" className="em-line" />
          <circle cx="44" cy="44" r="0" />
          <circle cx="32" cy="45" r="6" className="em-accent" />
          <path d="M29 45h6M32 42v6" className="em-tick" />
        </g>
      )}
      {course === 'part2' && (
        <g>
          {/* standards binder with a rising chart */}
          <rect x="14" y="14" width="26" height="34" rx="3" className="em-light" />
          <rect x="20" y="18" width="28" height="34" rx="3" className="em-paper" />
          <path d="M25 26h18M25 31h12" className="em-line" />
          <path d="M25 46l6-6 5 3 7-8" className="em-line" />
          <circle cx="46" cy="44" r="7" className="em-accent" />
          <path d="M43 44h6M46 41v6" className="em-tick" />
        </g>
      )}
    </svg>
  );
}

export const Icon = {
  check: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ic">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  cross: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ic">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ic fill">
      <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ic">
      <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4v3h-4z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ic">
      <path d="M4 5c3-1.5 5.5-1.5 8 .5v14c-2.5-2-5-2-8-.5zM20 5c-3-1.5-5.5-1.5-8 .5v14c2.5-2 5-2 8-.5z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ic">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ic fill">
      <path d="M12 2c1 3.5 6 6 6 11.5a6 6 0 0 1-12 0c0-2.6 1.2-4.4 2.6-5.7.3 1.8 1.2 3 2.4 3.4C10.3 7.6 11 4.6 12 2z" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ic fill">
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ic">
      <path d="M7 10l5 5 5-5" />
    </svg>
  ),
};
