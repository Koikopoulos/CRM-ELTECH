/** Órbitas inspiradas no átomo do logotipo Eltech. Puramente decorativo. */
export function Orbitas({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden="true" fill="none">
      <g stroke="currentColor" strokeWidth="1.25">
        <ellipse cx="300" cy="300" rx="270" ry="96" />
        <ellipse cx="300" cy="300" rx="270" ry="96" transform="rotate(60 300 300)" />
        <ellipse cx="300" cy="300" rx="270" ry="96" transform="rotate(120 300 300)" />
      </g>
      <circle cx="570" cy="300" r="7" fill="currentColor" />
      <circle cx="165" cy="66" r="7" fill="currentColor" />
      <circle cx="165" cy="534" r="7" fill="currentColor" />
    </svg>
  );
}
