import React, { useMemo } from 'react';
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, spring, Img, staticFile, Sequence, Audio, Easing, Video
} from 'remotion';
import { THEME_REGISTRY, ThemePreset } from './ThemeRegistry';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const getAsset = (path: string) =>
  path ? staticFile(path.replace(/^\/?public\//, '')) : '';

const msToFrames = (ms: number, fps: number) => Math.floor((ms / 1000) * fps);

const GRID_COLOR_MAP: Record<string, string> = {
  neon_green:    '#00FF88',
  electric_blue: '#00AAFF',
  crimson:       '#FF2233',
  gold:          '#FFD700',
  purple:        '#AA44FF',
  white:         '#FFFFFF',
};

// ─────────────────────────────────────────────────────────────
// Enveloped SFX — fade in → sustain → fade out
// ─────────────────────────────────────────────────────────────
const EnvelopedSFX: React.FC<{
  src: string;
  startFrame: number;
  fadeInFrames: number;
  sustainFrames: number;
  fadeOutFrames: number;
  peakVolume: number;
}> = ({ src, startFrame, fadeInFrames, sustainFrames, fadeOutFrames, peakVolume }) => {
  const frame = useCurrentFrame();
  const rel = frame - startFrame;
  const endFrame = fadeInFrames + sustainFrames + fadeOutFrames;
  const volume = interpolate(
    rel,
    [0, fadeInFrames, fadeInFrames + sustainFrames, endFrame],
    [0, peakVolume, peakVolume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  if (rel < 0) return null;
  return (
    <Sequence from={startFrame}>
      <Audio
        src={staticFile(src)}
        volume={volume}
        onError={() => {}}
      />
    </Sequence>
  );
};

// ─────────────────────────────────────────────────────────────
// Rain Particle — Procedural depth-layered blur (Foreground, Midground, Background)
// ─────────────────────────────────────────────────────────────
const RainParticle: React.FC<{
  src: string; seed: number; durationFrames: number; fps: number;
}> = ({ src, seed, durationFrames, fps }) => {
  const frame = useCurrentFrame();
  const rng = (offset: number) => ((Math.sin(seed * 127.1 + offset * 311.7) * 43758.5453) % 1 + 1) % 1;

  // 3 depth layers
  const layerRand = rng(0);
  let layer = 'mid'; // 50% chance
  if (layerRand < 0.25) layer = 'back';
  else if (layerRand > 0.75) layer = 'front';

  const blur = layer === 'front' ? 12 : layer === 'back' ? 5 : 0;
  const scale = layer === 'front' ? 0.35 : layer === 'back' ? 0.08 : 0.15;
  const speed = layer === 'front' ? interpolate(rng(3), [0, 1], [1.2, 1.8])
              : layer === 'back' ? interpolate(rng(3), [0, 1], [0.2, 0.4])
              : interpolate(rng(3), [0, 1], [0.5, 0.9]);
              
  const startFrac = rng(2);
  const xPos = interpolate(rng(1), [0, 1], [-900, 900]);
  
  const yStart = -600;
  const yEnd = 1200;
  // Loop properly based on fps/duration
  const cycle = ((frame / fps) * speed + startFrac) % 1;
  const yPos = yStart + cycle * (yEnd - yStart);

  const opacity = layer === 'front' ? 0.4 : layer === 'back' ? 0.7 : 0.9;
  const rotation = frame * interpolate(rng(5), [0, 1], [-0.5, 0.5]);

  if (!src) return null;
  return (
    <div style={{
      position: 'absolute',
      left: `calc(50% + ${xPos}px)`,
      top: yPos,
      transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
      filter: `blur(${blur}px)`,
      opacity,
      zIndex: layer === 'front' ? 30 : layer === 'back' ? 5 : 15,
    }}>
      <Img src={getAsset(src)} style={{ width: 100, height: 100, objectFit: 'contain' }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 3D Grid Background
// ─────────────────────────────────────────────────────────────
const GridBackground: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const perspective = 800;
  const gridY = (frame * 3) % 80;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse at 50% 40%, ${color}18 0%, #020202 70%)`,
      overflow: 'hidden',
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"
            patternTransform={`translate(0,${gridY})`}>
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke={color} strokeWidth="0.8" opacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Horizon glow */}
      <div style={{
        position: 'absolute', bottom: '30%', left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        boxShadow: `0 0 60px 20px ${color}55`,
      }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export const MagnatesStage_TwoPart: React.FC<{
  payload: any; durationInFrames: number;
}> = ({ payload, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const msTof = (ms: number) => msToFrames(ms, fps);

  const p1      = payload.part_1      || {};
  const p2      = payload.part_2      || {};
  const tr      = payload.transition  || {};

  const bgVibe      = p1.background?.vibe        || 'dark_smoke';
  const bgPath      = p1.background?.local_path  || null;
  const gridColor   = GRID_COLOR_MAP[p2.background?.grid_color || 'neon_green'] || '#00FF88';
  const rain        = p1.raining_particles        || {};
  const hero        = p1.hero                     || {};
  const orbit       = p1.orbit_helpers            || {};
  const subject     = p2.subject                  || {};
  const typography  = p2.typography               || {};

  const heroFrame   = msTof(hero.trigger_start_ms     || 0);
  const orbitFrame  = msTof(orbit.trigger_start_ms    || 800);
  const whipFrame   = msTof(tr.trigger_start_ms       || 2000);
  const subjectFrame= msTof(subject.trigger_start_ms  || whipFrame + 10);
  const typoFrame   = msTof(typography.trigger_start_ms || subjectFrame + 20);

  // ── Camera whip: extreme X blur at whipFrame ─────────────
  const whipRel   = Math.max(0, frame - whipFrame);
  const whipSprg  = spring({ frame: whipRel, fps, config: { damping: 12, stiffness: 180 } });
  const whipX     = interpolate(whipSprg, [0, 1], [0, tr.direction === 'left' ? -2400 : 2400]);
  const whipBlur  = interpolate(whipSprg, [0, 0.25, 0.6, 1], [0, 45, 20, 0]);
  const whipDone  = frame >= whipFrame + 18; // after whip spring settles

  // ── Hero spring ───────────────────────────────────────────
  const heroRel   = Math.max(0, frame - heroFrame);
  const heroSprg  = spring({ frame: heroRel, fps, config: { damping: 14, stiffness: 100 } });
  const heroY     = interpolate(heroSprg, [0, 1], [300, 0]);
  const heroScale = interpolate(heroSprg, [0, 1], [0.6, 1]);
  const heroAlpha = interpolate(heroRel, [0, 8], [0, 1], { extrapolateRight: 'clamp' });

  // ── Subject 3D breath ────────────────────────────────────
  const subjRel   = Math.max(0, frame - subjectFrame);
  const subjSprg  = spring({ frame: subjRel, fps, config: { damping: 12, stiffness: 80 } });
  const subjEnter = interpolate(subjSprg, [0, 1], [subject.position === 'left' ? -600 : 600, 0]);
  const subjAlpha = interpolate(subjRel, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const breathX   = Math.sin(frame * 0.025) * 18;
  const breathY   = Math.sin(frame * 0.018) * 10;
  const breathZ   = Math.sin(frame * 0.012) * 8;
  const breathRot = Math.sin(frame * 0.02) * 6;

  // ── Typewriter ────────────────────────────────────────────
  const typoText    = typography.text || '';
  const typoRel     = Math.max(0, frame - typoFrame);
  const charsPerFrame = 1.4;
  const visibleChars  = Math.floor(typoRel * charsPerFrame);
  const displayText   = typoText.substring(0, visibleChars);
  const cursorVisible = typoRel < typoText.length / charsPerFrame + 12 && Math.floor(frame / 8) % 2 === 0;

  // ── Part 2 subject X position ────────────────────────────
  const subjIsLeft  = subject.position === 'left';
  const subjX       = subjIsLeft ? '-68%' : '18%';
  const typoX       = subjIsLeft ? '18%'  : '-68%';
  const typoAlign   = subjIsLeft ? 'left' : 'right';

  // ── Orbit positions for 4 helpers ────────────────────────
  const orbitPositions = [
    { x: -380, y: -160, z: -180, scale: 0.62 },
    { x:  340, y: -120, z: -220, scale: 0.55 },
    { x: -200, y:  180, z: -150, scale: 0.58 },
    { x:  260, y:  200, z: -200, scale: 0.50 },
  ];

  // ── Color grade filter ────────────────────────────────────
  const colorGrade = 'contrast(1.22) saturate(1.08) brightness(0.88)';

  const RAIN_COUNT = 18;

  return (
    <AbsoluteFill style={{ backgroundColor: '#020202', overflow: 'hidden', filter: colorGrade }}>

      {/* ── PART 1: Environment (always visible until whip) ─── */}
      {!whipDone && (
        <AbsoluteFill style={{ filter: `blur(${whipBlur}px)`, transform: `translateX(${whipX}px)` }}>
          {/* Dynamic Video BG or Fallback Gradient */}
          {bgPath ? (
            <Video src={getAsset(bgPath)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} loop muted />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: bgVibe === 'sparks_fire'
                ? 'radial-gradient(ellipse at 50% 60%, #3a0800 0%, #080000 70%)'
                : bgVibe === 'cyber_matrix'
                ? 'radial-gradient(ellipse at 50% 50%, #001a00 0%, #000800 70%)'
                : 'radial-gradient(ellipse at 50% 60%, #0a0a0f 0%, #020202 80%)',
            }} />
          )}

          {/* Raining particles — procedural depth parallax */}
          {rain.local_path && Array.from({ length: 45 }).map((_, i) => (
            <RainParticle key={i} src={rain.local_path} seed={i * 37 + 11} durationFrames={durationInFrames} fps={fps} />
          ))}

          {/* Hero — triggered on trigger_word */}
          {hero.local_path && frame >= heroFrame && (
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: `translate3d(-50%, calc(-50% + ${heroY}px), 0) scale(${heroScale})`,
              opacity: heroAlpha,
              zIndex: 20,
              filter: 'drop-shadow(0 60px 100px rgba(0,0,0,0.95))',
            }}>
              <Img src={getAsset(hero.local_path)}
                style={{ maxHeight: 900, maxWidth: 1000, objectFit: 'contain' }} />
            </div>
          )}

          {/* Orbit helpers — triggered on trigger_word, staggered by index */}
          {orbit.local_path && orbitPositions.map((pos, idx) => {
            const orbitItemFrame = orbitFrame + Math.round(fps * 0.15 * idx);
            if (frame < orbitItemFrame) return null;
            const oRel   = Math.max(0, frame - orbitItemFrame);
            const oSprg  = spring({ frame: oRel, fps, config: { damping: 13, stiffness: 160 } });
            const oEnter = interpolate(oSprg, [0, 1], [0, 1]);
            const oBlur  = interpolate(oSprg, [0, 0.3, 1], [20, 8, 0]);
            return (
              <div key={idx} style={{
                position: 'absolute',
                left: `calc(50% + ${pos.x * oEnter}px)`,
                top: `calc(50% + ${pos.y}px)`,
                transform: `translate(-50%, -50%) translateZ(${pos.z}px) scale(${pos.scale * oEnter})`,
                filter: `blur(${oBlur}px)`,
                opacity: oEnter,
                zIndex: 15,
              }}>
                <Img src={getAsset(orbit.local_path)}
                  style={{ width: 260, height: 260, objectFit: 'contain' }} />
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* ── PART 2: Grid + Subject + Typewriter (post-whip) ── */}
      {whipDone && (
        <AbsoluteFill>
          {/* Part 2 bg video behind grid for cinematic depth */}
          {bgPath && (
            <Video
              src={getAsset(bgPath)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18 }}
              loop
              muted
            />
          )}
          <GridBackground color={gridColor} />

          {/* Vignette */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.85) 100%)',
          }} />

          {/* Subject — 3D breathing motion */}
          {subject.local_path && frame >= subjectFrame && (
            <div style={{
              position: 'absolute',
              left: subjX,
              top: '50%',
              transform: `
                translate(-50%, -50%)
                translateX(calc(${subjEnter}px))
                rotateY(${breathRot}deg)
                rotateX(${breathZ * 0.4}deg)
                translate3d(${breathX}px, ${breathY}px, 0)
              `,
              opacity: subjAlpha,
              perspective: 1200,
              zIndex: 20,
              filter: `drop-shadow(0 40px 80px rgba(0,0,0,0.9)) drop-shadow(0 0 40px ${gridColor}55)`,
            }}>
              <Img src={getAsset(subject.local_path)}
                style={{ maxHeight: 720, maxWidth: 720, objectFit: 'contain' }} />
            </div>
          )}

          {/* Typewriter typography */}
          {frame >= typoFrame && (
            <div style={{
              position: 'absolute',
              left: typoX,
              top: '50%',
              width: '44%',
              transform: 'translate(0, -50%)',
              textAlign: typoAlign as any,
              zIndex: 30,
            }}>
              <h1 style={{
                fontFamily: 'Impact, "Arial Black", sans-serif',
                fontSize: 148,
                fontWeight: 900,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                lineHeight: 0.9,
                margin: 0,
                letterSpacing: -2,
                textShadow: `
                  0 0 60px ${gridColor}CC,
                  0 0 120px ${gridColor}66,
                  0 4px 30px rgba(0,0,0,0.9)
                `,
              }}>
                {displayText}
                {cursorVisible && (
                  <span style={{ opacity: 1, color: gridColor }}>|</span>
                )}
              </h1>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* ── Global cinematic vignette ─────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, transparent 25%, rgba(0,0,0,0.75) 100%)',
        mixBlendMode: 'multiply',
      }} />
    </AbsoluteFill>
  );
};
