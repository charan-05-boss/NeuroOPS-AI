import { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * GlassPanel — Reusable glassmorphism container with tier support,
 * optional gradient border, and ambient glow.
 */
interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  tier?: 'subtle' | 'medium' | 'heavy' | 'ultra';
  glow?: boolean;
  gradientBorder?: boolean;
}

const tierStyles = {
  subtle: {
    bg: 'rgba(10, 10, 32, 0.35)',
    blur: '12px',
    border: 'rgba(255, 255, 255, 0.04)',
  },
  medium: {
    bg: 'rgba(10, 10, 32, 0.50)',
    blur: '20px',
    border: 'rgba(255, 255, 255, 0.06)',
  },
  heavy: {
    bg: 'rgba(10, 10, 32, 0.68)',
    blur: '32px',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  ultra: {
    bg: 'rgba(10, 10, 32, 0.82)',
    blur: '40px',
    border: 'rgba(255, 255, 255, 0.10)',
  },
};

export const GlassPanel: FC<GlassPanelProps> = ({
  children,
  className = '',
  tier = 'heavy',
  glow = false,
  gradientBorder = false,
}) => {
  const t = tierStyles[tier];

  return (
    <motion.div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: t.bg,
        backdropFilter: `blur(${t.blur})`,
        WebkitBackdropFilter: `blur(${t.blur})`,
        border: gradientBorder ? '1px solid transparent' : `1px solid ${t.border}`,
        boxShadow: glow
          ? '0 8px 32px rgba(0,0,0,0.4), 0 0 60px -15px rgba(139,92,246,0.1)'
          : '0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Gradient border overlay */}
      {gradientBorder && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            padding: '1px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.15), rgba(99,102,241,0.3))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
