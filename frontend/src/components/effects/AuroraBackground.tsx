/**
 * AuroraBackground — Cinematic CSS-only animated aurora gradient.
 * Creates slowly drifting violet/cyan/indigo orbs behind all content.
 * Pure CSS animations — no Canvas/WebGL for performance.
 */
export function AuroraBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Primary violet orb — top left */}
      <div
        className="absolute animate-aurora"
        style={{
          top: '-15%',
          left: '-10%',
          width: '60vw',
          height: '60vw',
          maxWidth: '800px',
          maxHeight: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)',
          filter: 'blur(60px)',
          animationDuration: '25s',
        }}
      />

      {/* Cyan orb — bottom right */}
      <div
        className="absolute animate-aurora"
        style={{
          bottom: '-20%',
          right: '-15%',
          width: '55vw',
          height: '55vw',
          maxWidth: '700px',
          maxHeight: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, rgba(6,182,212,0.03) 40%, transparent 70%)',
          filter: 'blur(70px)',
          animationDuration: '30s',
          animationDirection: 'reverse',
        }}
      />

      {/* Indigo orb — center */}
      <div
        className="absolute animate-aurora"
        style={{
          top: '30%',
          left: '40%',
          width: '45vw',
          height: '45vw',
          maxWidth: '600px',
          maxHeight: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 40%, transparent 70%)',
          filter: 'blur(80px)',
          animationDuration: '35s',
          animationDelay: '-10s',
        }}
      />

      {/* Faint rose accent — top right corner */}
      <div
        className="absolute animate-aurora"
        style={{
          top: '-5%',
          right: '15%',
          width: '30vw',
          height: '30vw',
          maxWidth: '400px',
          maxHeight: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 60%)',
          filter: 'blur(60px)',
          animationDuration: '40s',
          animationDelay: '-15s',
          animationDirection: 'reverse',
        }}
      />
    </div>
  )
}
