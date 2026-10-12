// The app's mascot: a beaver bookkeeper in round glasses and a visor that takes the course colour.
// Moods change the arms, eyes and mouth; CSS in styles.css animates each mood.

export type Mood = 'happy' | 'cheer' | 'oops' | 'think' | 'wave';

function Pencil({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <rect x="-3" y="-20" width="6" height="30" rx="1" className="m-pencil" />
      <rect x="-3" y="-24" width="6" height="5" rx="1.5" className="m-eraser" />
      <path d="M-3 10 L0 17 L3 10 Z" className="m-wood" />
      <path d="M-1 14.5 L0 17 L1 14.5 Z" className="m-dark" />
    </g>
  );
}

export function Mascot({ mood = 'happy', size = 96, className }: { mood?: Mood; size?: number; className?: string }) {
  const happyEyes = mood === 'cheer' || mood === 'wave';
  const look = mood === 'think' ? -2.5 : 0;
  return (
    <svg
      className={`mascot ${className ?? ''}`}
      data-mood={mood}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <g className="m-figure">
        {/* tail, ruled like a ledger */}
        <g transform="rotate(-24 94 98)">
          <ellipse cx="94" cy="98" rx="22" ry="10" className="m-tail" />
          <path d="M76 98h36M80 93.5h28M80 102.5h28M90 89v18M100 89.5v17" className="m-tail-rule" />
        </g>
        {/* body */}
        <ellipse cx="60" cy="90" rx="27" ry="23" className="m-fur" />
        <ellipse cx="60" cy="94" rx="17" ry="15" className="m-belly" />
        <ellipse cx="47" cy="112" rx="9" ry="4.5" className="m-fur-dark" />
        <ellipse cx="73" cy="112" rx="9" ry="4.5" className="m-fur-dark" />

        {/* arms */}
        {mood === 'cheer' && (
          <g className="m-arms-up">
            <ellipse cx="30" cy="68" rx="6.5" ry="13" transform="rotate(-38 30 68)" className="m-fur" />
            <ellipse cx="90" cy="68" rx="6.5" ry="13" transform="rotate(38 90 68)" className="m-fur" />
          </g>
        )}
        {mood === 'wave' && (
          <>
            <ellipse cx="38" cy="90" rx="6.5" ry="12" transform="rotate(18 38 90)" className="m-fur" />
            <g className="m-wave-arm">
              <ellipse cx="90" cy="70" rx="6.5" ry="13" transform="rotate(32 90 70)" className="m-fur" />
            </g>
          </>
        )}
        {mood === 'oops' && (
          <>
            <ellipse cx="38" cy="90" rx="6.5" ry="12" transform="rotate(18 38 90)" className="m-fur" />
            <ellipse cx="86" cy="44" rx="6.5" ry="14" transform="rotate(48 86 44)" className="m-fur" />
          </>
        )}
        {(mood === 'happy' || mood === 'think') && (
          <>
            <ellipse cx="38" cy="90" rx="6.5" ry="12" transform="rotate(18 38 90)" className="m-fur" />
            {mood === 'happy' ? (
              <>
                <Pencil x={88} y={84} angle={28} />
                <ellipse cx="82" cy="90" rx="6.5" ry="11" transform="rotate(-24 82 90)" className="m-fur" />
              </>
            ) : (
              <>
                <Pencil x={74} y={70} angle={-20} />
                <ellipse cx="78" cy="80" rx="6.5" ry="11" transform="rotate(-50 78 80)" className="m-fur" />
              </>
            )}
          </>
        )}

        {/* head */}
        <circle cx="37" cy="26" r="8" className="m-fur" />
        <circle cx="83" cy="26" r="8" className="m-fur" />
        <circle cx="37" cy="26" r="4" className="m-fur-dark" />
        <circle cx="83" cy="26" r="4" className="m-fur-dark" />
        <circle cx="60" cy="50" r="30" className="m-fur" />
        <ellipse cx="60" cy="63" rx="15" ry="11" className="m-belly" />
        <circle cx="40" cy="60" r="4.5" className="m-cheek" />
        <circle cx="80" cy="60" r="4.5" className="m-cheek" />

        {/* visor in the course colour */}
        <path d="M31 36 Q60 18 89 36 L89 31 Q60 13 31 31 Z" className="m-visor" />
        <path d="M27 38 Q60 25 93 38 Q95 44 90 43 Q60 32 30 43 Q25 44 27 38 Z" className="m-visor-brim" />

        {/* eyes and glasses */}
        {happyEyes ? (
          <>
            <path d="M42 48 q5 -6 10 0" className="m-stroke" />
            <path d="M68 48 q5 -6 10 0" className="m-stroke" />
          </>
        ) : (
          <>
            <circle cx="47" cy="48" r="6.5" className="m-eye" />
            <circle cx="73" cy="48" r="6.5" className="m-eye" />
            <circle cx="47.5" cy={48 + look} r={mood === 'oops' ? 2.4 : 3.4} className="m-dark" />
            <circle cx="73.5" cy={48 + look} r={mood === 'oops' ? 2.4 : 3.4} className="m-dark" />
            <circle cx="48.8" cy={46.6 + look} r="1.1" className="m-shine" />
            <circle cx="74.8" cy={46.6 + look} r="1.1" className="m-shine" />
          </>
        )}
        <circle cx="47" cy="48" r="10" className="m-glasses" />
        <circle cx="73" cy="48" r="10" className="m-glasses" />
        <path d="M57 47 q3 -2 6 0" className="m-glasses" />

        {/* nose, mouth, teeth */}
        <ellipse cx="60" cy="58" rx="5.5" ry="3.8" className="m-dark" />
        {mood === 'oops' ? (
          <path d="M53 67 q3.5 -3 7 0 q3.5 3 7 0" className="m-stroke" />
        ) : mood === 'cheer' ? (
          <>
            <path d="M51 63 Q60 76 69 63 Z" className="m-mouth" />
            <rect x="55.5" y="63" width="9" height="5" rx="1" className="m-tooth" />
          </>
        ) : (
          <>
            <path d="M52 63 q8 5 16 0" className="m-stroke" />
            <rect x="55.5" y="64.5" width="9" height="7" rx="1.5" className="m-tooth" />
            <path d="M60 64.5v7" className="m-tooth-line" />
          </>
        )}
        {mood === 'oops' && <path d="M95 22 q4 6 0 9 q-4 -3 0 -9 Z" className="m-sweat" />}
        {mood === 'cheer' && (
          <g className="m-sparkles">
            <path d="M14 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
            <path d="M104 18l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
            <path d="M108 60l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" />
          </g>
        )}
      </g>
    </svg>
  );
}

// Alberta scenery strips used between units on the path and behind the course hero.
export type SceneKind = 'rockies' | 'prairie' | 'city' | 'aspen' | 'badlands';
export const SCENES: SceneKind[] = ['prairie', 'rockies', 'city', 'aspen', 'badlands'];

export function Scenery({ kind, className }: { kind: SceneKind; className?: string }) {
  return (
    <svg
      className={`scenery ${className ?? ''}`}
      data-scene={kind}
      viewBox="0 0 360 96"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {kind === 'rockies' && (
        <>
          <path d="M0 96 V62 L40 30 L70 52 L110 14 L150 50 L180 34 L220 70 L260 22 L300 56 L330 40 L360 58 V96 Z" className="sc-far" />
          <path d="M110 14 L98 26 L106 24 L112 30 L118 25 L124 27 Z M260 22 L249 33 L257 31 L263 36 L268 31 L273 33 Z M40 30 L32 37 L39 36 L44 40 L48 37 Z" className="sc-snow" />
          <path d="M0 96 V74 Q90 58 180 72 T360 68 V96 Z" className="sc-mid" />
          {[24, 52, 300, 326, 344].map((x, i) => (
            <path key={i} d={`M${x} 92 l-9 0 l9 -26 l9 26 z`} className="sc-near" />
          ))}
          <path d="M0 96 V88 Q180 80 360 88 V96 Z" className="sc-near" />
        </>
      )}
      {kind === 'prairie' && (
        <>
          <circle cx="300" cy="30" r="14" className="sc-sun" />
          <path d="M0 96 V66 Q90 50 180 64 T360 58 V96 Z" className="sc-far" />
          <path d="M70 70 V36 l10 -10 l10 10 V70 Z" className="sc-barn" />
          <path d="M66 36 l14 -14 l14 14 Z" className="sc-roof" />
          <rect x="76" y="44" width="8" height="6" className="sc-window" />
          <path d="M92 70 V52 h14 V70 Z" className="sc-barn" />
          <path d="M0 96 V78 Q120 64 240 78 T360 74 V96 Z" className="sc-mid" />
          <path d="M0 84 Q180 76 360 84 M0 90 Q180 82 360 90" className="sc-furrow" />
        </>
      )}
      {kind === 'city' && (
        <>
          <g className="sc-far">
            <rect x="40" y="40" width="22" height="56" />
            <rect x="66" y="24" width="18" height="72" />
            <rect x="88" y="46" width="26" height="50" />
            <rect x="200" y="30" width="20" height="66" />
            <rect x="224" y="14" width="16" height="82" />
            <path d="M232 14 v-10" className="sc-mast" />
            <rect x="244" y="38" width="24" height="58" />
            <rect x="272" y="50" width="20" height="46" />
            <path d="M130 96 V56 Q150 40 170 56 V96 Z" />
          </g>
          <g className="sc-windows">
            {[48, 54, 72, 78, 230, 234, 250, 258].map((x, i) =>
              [52, 62, 72].map((y) => <rect key={`${i}-${y}`} x={x} y={y - (i % 3) * 6} width="3" height="4" />),
            )}
          </g>
          <path d="M0 96 V80 Q180 70 360 80 V96 Z" className="sc-mid" />
          <path d="M0 90 Q90 84 180 90 T360 88" className="sc-river" />
          <path d="M120 84 Q180 58 240 84" className="sc-bridge" />
          <path d="M140 76 v8 M160 68 v16 M180 66 v18 M200 68 v16 M220 76 v8" className="sc-bridge thin" />
        </>
      )}
      {kind === 'aspen' && (
        <>
          <path d="M0 96 V60 Q100 44 200 58 T360 50 V96 Z" className="sc-far" />
          {[
            [40, 46],
            [70, 38],
            [96, 50],
            [250, 42],
            [280, 34],
            [312, 48],
          ].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 2} y={y + 10} width="4" height={86 - y - 10} className="sc-trunk" />
              <ellipse cx={x} cy={y + 4} rx="13" ry="17" className="sc-leaves" />
            </g>
          ))}
          <path d="M0 96 V82 Q180 72 360 82 V96 Z" className="sc-mid" />
        </>
      )}
      {kind === 'badlands' && (
        <>
          <path d="M0 96 V56 Q60 48 120 58 T240 50 T360 56 V96 Z" className="sc-far" />
          <path d="M0 70 Q60 64 120 72 T240 66 T360 70" className="sc-band" />
          {[
            [70, 44],
            [92, 52],
            [230, 40],
            [258, 50],
          ].map(([x, y], i) => (
            <g key={i}>
              <path d={`M${x - 5} 82 L${x - 3} ${y + 6} L${x + 3} ${y + 6} L${x + 5} 82 Z`} className="sc-hoodoo" />
              <ellipse cx={x} cy={y + 5} rx="8" ry="4" className="sc-cap" />
            </g>
          ))}
          <path d="M0 96 V80 Q180 72 360 82 V96 Z" className="sc-mid" />
        </>
      )}
    </svg>
  );
}
