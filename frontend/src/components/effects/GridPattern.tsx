/**
 * GridPattern — Subtle dot grid overlay (Vercel-inspired).
 * SVG-based repeating pattern, fades at edges via CSS mask.
 */
export function GridPattern() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="neuro-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.8" fill="rgba(255,255,255,0.04)" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#neuro-grid)"
          style={{
            mask: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)',
            WebkitMask: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)',
          }}
        />
      </svg>
    </div>
  )
}
