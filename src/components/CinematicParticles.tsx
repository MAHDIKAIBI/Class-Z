import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface ParticleConfig {
  count: number;
  glowColor: string;
  baseSize: number;
  drift: 'up' | 'down';
}

/**
 * Procedural volumetric dust / spark particles that drift through the spotlight.
 * These are abstract glowing orbs — they work for ANY niche without needing PNGs.
 */
export const CinematicParticles: React.FC<ParticleConfig> = ({
  count = 25,
  glowColor = 'rgba(255, 255, 255, 0.3)',
  baseSize = 4,
  drift = 'up',
}) => {
  const frame = useCurrentFrame();

  const particles = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const seed = i * 173.7 + 42;
      return {
        x: ((seed * 7.3) % 100),
        startY: ((seed * 13.1) % 120) - 10,
        size: baseSize + ((seed * 3.7) % baseSize),
        speed: 0.3 + ((seed * 0.17) % 0.7),
        wobbleFreq: 0.02 + ((seed * 0.003) % 0.04),
        wobbleAmp: 5 + ((seed * 1.3) % 15),
        opacity: 0.15 + ((seed * 0.07) % 0.45),
        delay: (seed * 2.3) % 60,
      };
    });
  }, [count, baseSize]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p, i) => {
        const activeFrame = Math.max(0, frame - p.delay);
        const direction = drift === 'up' ? -1 : 1;
        const yOffset = (activeFrame * p.speed * direction) % 130;
        const wobble = Math.sin(activeFrame * p.wobbleFreq) * p.wobbleAmp;
        
        // Fade in over 30 frames after delay
        const fadeIn = interpolate(activeFrame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.startY + yOffset}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              backgroundColor: glowColor,
              boxShadow: `0 0 ${p.size * 3}px ${glowColor}, 0 0 ${p.size * 6}px ${glowColor}`,
              opacity: p.opacity * fadeIn,
              transform: `translateX(${wobble}px)`,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
    </div>
  );
};
