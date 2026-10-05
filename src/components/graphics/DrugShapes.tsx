import type { CSSProperties } from 'react';

type ShapeProps = { size?: number; c1?: string; c2?: string; style?: CSSProperties; className?: string };

export function Capsule({ size = 60, c1 = '#60a5fa', c2 = '#f8fafc', style, className }: ShapeProps) {
  const id = `cap${c1.replace('#', '')}${c2.replace('#', '')}`;
  return (
    <svg width={size} height={size * 0.42} viewBox="0 0 100 42" style={style} className={className}>
      <defs>
        <clipPath id={id}><rect x="2" y="2" width="96" height="38" rx="19" /></clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x="0" y="0" width="50" height="42" fill={c1} />
        <rect x="50" y="0" width="50" height="42" fill={c2} />
        <rect x="0" y="4" width="100" height="9" fill="white" opacity="0.28" />
      </g>
      <rect x="2" y="2" width="96" height="38" rx="19" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
    </svg>
  );
}

export function Tablet({ size = 40, c1 = '#a78bfa', style, className }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" style={style} className={className}>
      <circle cx="25" cy="25" r="22" fill={c1} />
      <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <path d="M8 25h34" stroke="rgba(0,0,0,0.25)" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="18" cy="14" rx="9" ry="4" fill="white" opacity="0.3" transform="rotate(-25 18 14)" />
    </svg>
  );
}

export function Molecule({ size = 56, c1 = '#38bdf8', style, className }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={style} className={className} fill="none">
      <g stroke={c1} strokeWidth="2" opacity="0.9">
        <line x1="30" y1="30" x2="12" y2="14" /><line x1="30" y1="30" x2="50" y2="18" />
        <line x1="30" y1="30" x2="44" y2="50" /><line x1="30" y1="30" x2="10" y2="46" />
      </g>
      <circle cx="30" cy="30" r="7" fill={c1} />
      <circle cx="12" cy="14" r="4.5" fill={c1} opacity="0.8" /><circle cx="50" cy="18" r="4" fill={c1} opacity="0.8" />
      <circle cx="44" cy="50" r="5" fill={c1} opacity="0.8" /><circle cx="10" cy="46" r="3.5" fill={c1} opacity="0.8" />
    </svg>
  );
}

export function Cross({ size = 30, c1 = '#34d399', style, className }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" style={style} className={className}>
      <path d="M11 3h8v8h8v8h-8v8h-8v-8H3v-8h8z" fill={c1} opacity="0.9" />
    </svg>
  );
}
