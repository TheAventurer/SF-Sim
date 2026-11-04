import type { FlagSpec } from '../engine';

/** Renders a faction flag from its spec. Decorative: pair it with the faction name. */
export function Flag({ flag, width = 30 }: { flag: FlagSpec; width?: number }) {
  const { style, c1, c2, c3, e } = flag;
  return (
    <svg width={width} height={Math.round((width * 2) / 3)} viewBox="0 0 36 24" aria-hidden="true" className="flag">
      {style === 'bands' && (
        <>
          <rect width="36" height="8" fill={c1} />
          <rect y="8" width="36" height="8" fill={c2} />
          <rect y="16" width="36" height="8" fill={c3} />
          <circle cx="18" cy="12" r="3.4" fill={e} />
        </>
      )}
      {style === 'hoist' && (
        <>
          <rect width="36" height="24" fill={c1} />
          <rect width="12" height="24" fill={c2} />
          <rect x="12" y="10" width="24" height="4" fill={c3} />
          <polygon points="6,6.5 7.4,10.4 11.5,10.5 8.3,13 9.4,17 6,14.6 2.6,17 3.7,13 0.5,10.5 4.6,10.4" fill={e} />
        </>
      )}
      {style === 'diag' && (
        <>
          <rect width="36" height="24" fill={c1} />
          <polygon points="0,24 0,18 27,0 36,0 36,6 9,24" fill={c2} />
          <circle cx="29" cy="18" r="3" fill={e} />
        </>
      )}
      {style === 'cross' && (
        <>
          <rect width="36" height="24" fill={c1} />
          <rect x="10" width="5" height="24" fill={c2} />
          <rect y="9.5" width="36" height="5" fill={c2} />
          <circle cx="12.5" cy="12" r="2" fill={e} />
        </>
      )}
      {style === 'chevron' && (
        <>
          <rect width="36" height="12" fill={c1} />
          <rect y="12" width="36" height="12" fill={c3} />
          <polygon points="0,0 15,12 0,24" fill={c2} />
          <circle cx="5" cy="12" r="2.6" fill={e} />
        </>
      )}
      {style === 'ring' && (
        <>
          <rect width="36" height="24" fill={c1} />
          <circle cx="18" cy="12" r="6.5" fill="none" stroke={e} strokeWidth="2" />
          <line x1="18" y1="5.5" x2="18" y2="18.5" stroke={e} strokeWidth="1.4" />
        </>
      )}
    </svg>
  );
}
