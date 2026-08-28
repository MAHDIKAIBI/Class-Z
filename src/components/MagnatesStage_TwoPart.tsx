import React from 'react';
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, spring, Img, staticFile, Sequence, Audio, Video
} from 'remotion';

const getAsset = (path: string) => path ? staticFile(path.replace(/^\/?public\//, '')) : '';
const msToFrames = (ms: number, fps: number) => Math.floor((ms / 1000) * fps);

const GRID_COLOR_MAP: Record<string, string> = {
  neon_green: '#00FF88',
  electric_blue: '#00AAFF',
  crimson: '#FF2233',
  gold: '#FFD700',
  purple: '#AA44FF',
  white: '#FFFFFF',
};

const EnvelopedSFX: React.FC<{
  src?: string;
  startFrame: number;
  fadeInFrames?: number;
  sustainFrames?: number;
  fadeOutFrames?: number;
  peakVolume?: number;
}> = ({ src, startFrame, fadeInFrames = 15, sustainFrames = 90, fadeOutFrames = 30, peakVolume = 1 }) => {
  const frame = useCurrentFrame();
  const rel = frame - startFrame;
  const endFrame = fadeInFrames + sustainFrames + fadeOutFrames;
  const volume = interpolate(
    rel,
    [0, fadeInFrames, fadeInFrames + sustainFrames, endFrame],
    [0, peakVolume, peakVolume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  if (!src || rel < 0 || rel > endFrame) return null;
  return (
    <Sequence from={startFrame}>
      <Audio src={getAsset(src)} volume={volume} onError={() => {}} />
    </Sequence>
  );
};

const RainParticle: React.FC<{
  src: string; seed: number; durationFrames: number; fps: number;
}> = ({ src, seed, fps }) => {
  const frame = useCurrentFrame();
  const rng = (offset: number) => ((Math.sin(seed * 127.1 + offset * 311.7) * 43758.5453) % 1 + 1) % 1;

  const layerRand = rng(0);
  let layer = 'mid';
  if (layerRand < 0.3) layer = 'back';
  else if (layerRand > 0.7) layer = 'front';

  const blur = layer === 'front' ? 24 : layer === 'back' ? 12 : 5;
  const scale = layer === 'front' ? interpolate(rng(1), [0, 1], [0.6, 0.9])
              : layer === 'back'  ? interpolate(rng(1), [0, 1], [0.1, 0.15])
              :                     interpolate(rng(1), [0, 1], [0.2, 0.35]);
  const speed = layer === 'front' ? interpolate(rng(3), [0, 1], [1.5, 2.5])
              : layer === 'back'  ? interpolate(rng(3), [0, 1], [0.2, 0.5])
              :                     interpolate(rng(3), [0, 1], [0.6, 1.0]);

  const startFrac = rng(2);
  const xPos = interpolate(rng(4), [0, 1], [-1200, 1200]);
  const yStart = -800;
  const yEnd = 1500;
  const cycle = ((frame / fps) * speed + startFrac) % 1;
  const yPos = yStart + cycle * (yEnd - yStart);
  const opacity = layer === 'front' ? 0.3 : layer === 'back' ? 0.6 : 0.8;
  const rotation = frame * interpolate(rng(5), [0, 1], [-1, 1]);

  if (!src) return null;
  return (
    <div style={{
      position: 'absolute',
      left: `calc(50% + ${xPos}px)`,
      top: yPos,
      transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
      filter: `blur(${blur}px) drop-shadow(0px 10px 20px rgba(0,0,0,0.8))`,
      opacity,
      zIndex: layer === 'front' ? 40 : layer === 'back' ? 5 : 15,
    }}>
      <Img src={getAsset(src)} style={{ width: 150, height: 150, objectFit: 'contain' }} />
    </div>
  );
};

const GridBackground: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const gridY = (frame * 4) % 100;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse at 50% 50%, ${color}11 0%, #050505 85%)`,
      overflow: 'hidden',
    }}>
      <svg width="100%" height="100%" style={{
        position: 'absolute', inset: 0, opacity: 0.7,
        transform: 'perspective(1000px) rotateX(60deg) scale(2)',
        transformOrigin: 'bottom'
      }}>
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"
            patternTransform={`translate(0,${gridY})`}>
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div style={{
        position: 'absolute', bottom: '25%', left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        boxShadow: `0 0 60px 20px ${color}55`,
      }} />
    </div>
  );
};

export const MagnatesStage_TwoPart: React.FC<{ payload: any; durationInFrames: number; }> = ({ payload, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const msTof = (ms: number) => msToFrames(ms, fps);

  const p1 = payload.part_1 || {};
  const p2 = payload.part_2 || {};
  const tr = payload.transition || {};

  const bgPath1   = p1.background?.local_path || null;
  const bgPath2   = p2.background?.local_path || bgPath1;
  const gridColor = GRID_COLOR_MAP[p2.background?.grid_color || 'gold'] || '#FFD700';

  const isVideo = (path: string) => path?.toLowerCase().endsWith('.mp4') || path?.toLowerCase().endsWith('.webm');

  const rain     = p1.raining_particles || {};
  const hero     = p1.hero || {};
  const orbits   = Array.isArray(p1.orbit_helpers) ? p1.orbit_helpers : (p1.orbit_helpers ? [p1.orbit_helpers] : []);
  const subject  = p2.subject || {};
  const typography = p2.typography || {};

  const heroFrame    = msTof(hero.trigger_start_ms || 1000);
  const whipFrame    = msTof(tr.trigger_start_ms || 4000);
  const subjectFrame = msTof(subject.trigger_start_ms || 4200);
  const typoFrame    = msTof(typography.trigger_start_ms || 4500);

  // Camera whip
  const whipRel  = Math.max(0, frame - whipFrame);
  const whipSprg = spring({ frame: whipRel, fps, config: { damping: 14, stiffness: 200 } });
  const whipX    = interpolate(whipSprg, [0, 1], [0, tr.direction === 'left' ? -3000 : 3000]);
  const whipBlur = interpolate(whipSprg, [0, 0.5, 1], [0, 80, 0]);
  const whipDone = frame >= whipFrame + 15;

  // Hero entrance + breathing
  const heroRel   = Math.max(0, frame - heroFrame);
  const heroSprg  = spring({ frame: heroRel, fps, config: { damping: 12, stiffness: 90 } });
  const heroY     = interpolate(heroSprg, [0, 1], [400, 0]);
  const heroScale = interpolate(heroSprg, [0, 1], [0.4, 1]);
  const heroRotZ  = interpolate(heroSprg, [0, 1], [-15, 0]);
  const heroAlpha = interpolate(heroRel, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  // Shared breathing motion
  const hoverX    = Math.sin(frame * 0.02) * 15;
  const hoverY    = Math.cos(frame * 0.03) * 10;
  const hoverRotX = Math.sin(frame * 0.015) * 5;
  const hoverRotY = Math.cos(frame * 0.025) * 8;

  // Subject entrance
  const subjRel   = Math.max(0, frame - subjectFrame);
  const subjSprg  = spring({ frame: subjRel, fps, config: { damping: 15, stiffness: 120 } });
  const subjEnter = interpolate(subjSprg, [0, 1], [subject.position === 'left' ? -800 : 800, 0]);
  const subjBlur  = interpolate(subjSprg, [0, 0.7, 1], [30, 10, 0]);
  const subjAlpha = interpolate(subjRel, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  // Typewriter
  const typoText      = typography.text || '';
  const typoRel       = Math.max(0, frame - typoFrame);
  const charsPerFrame = 1.2;
  const visibleChars  = Math.floor(typoRel * charsPerFrame);
  const displayText   = typoText.substring(0, visibleChars);
  const cursorVisible = typoRel < (typoText.length / charsPerFrame) + 20 && Math.floor(frame / 6) % 2 === 0;

  const subjIsLeft = subject.position === 'left';
  const subjX      = subjIsLeft ? '-65%' : '15%';
  const typoX      = subjIsLeft ? '15%' : '-65%';

  const orbitPos = [
    { x: -450, y: -200, z: -250, s: 0.6 },
    { x:  400, y: -150, z: -300, s: 0.55 },
    { x: -300, y:  250, z: -150, s: 0.7 },
    { x:  350, y:  220, z: -200, s: 0.65 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#020202', filter: 'contrast(1.15) saturate(1.1)' }}>

      {/* SFX Engine */}
      <EnvelopedSFX src={p1.background?.local_sfx_path} startFrame={0} peakVolume={0.4} />
      <EnvelopedSFX src={hero.local_sfx_path} startFrame={heroFrame} />
      <EnvelopedSFX src={tr.local_sfx_path} startFrame={whipFrame} peakVolume={0.8} />
      <EnvelopedSFX src={subject.local_sfx_path} startFrame={subjectFrame} />
      <EnvelopedSFX src={typography.local_sfx_path} startFrame={typoFrame} sustainFrames={typoText.length * 2} />

      {/* PART 1 */}
      {!whipDone && (
        <AbsoluteFill style={{ filter: `blur(${whipBlur}px)`, transform: `translateX(${whipX}px)`, perspective: '1200px' }}>

          {bgPath1 ? (
            isVideo(bgPath1) ? (
              <Video src={getAsset(bgPath1)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, filter: 'blur(15px)', transform: 'scale(1.1)' }} loop muted />
            ) : (
              <Img src={getAsset(bgPath1)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, filter: 'blur(15px)', transform: 'scale(1.1)' }} />
            )
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, #1a1a24 0%, #020202 100%)' }} />
          )}

          {rain.local_path && Array.from({ length: 60 }).map((_, i) => (
            <RainParticle key={i} src={rain.local_path} seed={i * 42 + 7} durationFrames={durationInFrames} fps={fps} />
          ))}

          {orbits.map((orb: any, idx: number) => {
            const orbStart = msTof(orb.trigger_start_ms || 2000 + idx * 200);
            if (frame < orbStart) return null;
            const oRel  = frame - orbStart;
            const oSprg = spring({ frame: oRel, fps, config: { damping: 10, stiffness: 140 } });
            const oScale = interpolate(oSprg, [0, 1], [0, (orbitPos[idx] || orbitPos[0]).s]);
            const oBlur  = interpolate(oSprg, [0, 0.5, 1], [40, 15, 0]);
            const pos    = orbitPos[idx] || orbitPos[0];
            return (
              <React.Fragment key={`orb-${idx}`}>
                <EnvelopedSFX src={orb.local_sfx_path} startFrame={orbStart} peakVolume={0.6} />
                <div style={{
                  position: 'absolute',
                  left: `calc(50% + ${pos.x}px)`,
                  top: `calc(50% + ${pos.y}px)`,
                  transform: `translate(-50%, -50%) translateZ(${pos.z}px) scale(${oScale})`,
                  filter: `blur(${oBlur}px) drop-shadow(0 20px 30px rgba(0,0,0,0.8))`,
                  zIndex: 10,
                }}>
                  <Img src={getAsset(orb.local_path || '')} style={{ width: 300, height: 300, objectFit: 'contain' }} />
                </div>
              </React.Fragment>
            );
          })}

          {hero.local_path && frame >= heroFrame && (
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: `
                translate(-50%, calc(-50% + ${heroY}px))
                scale(${heroScale})
                rotateZ(${heroRotZ}deg)
                rotateX(${hoverRotX}deg)
                rotateY(${hoverRotY}deg)
                translate3d(${hoverX}px, ${hoverY}px, 0)
              `,
              opacity: heroAlpha,
              zIndex: 30,
              filter: 'drop-shadow(0px 80px 100px rgba(0,0,0,0.95)) drop-shadow(0px 20px 40px rgba(0,0,0,0.6))',
              transformStyle: 'preserve-3d',
            }}>
              <Img src={getAsset(hero.local_path)} style={{ maxHeight: 800, maxWidth: 900, objectFit: 'contain' }} />
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* PART 2 */}
      {whipDone && (
        <AbsoluteFill style={{ perspective: '1500px' }}>

          {bgPath2 && (
            isVideo(bgPath2) ? (
              <Video src={getAsset(bgPath2)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, filter: 'blur(15px)', transform: 'scale(1.1)' }} loop muted />
            ) : (
              <Img src={getAsset(bgPath2)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, filter: 'blur(15px)', transform: 'scale(1.1)' }} />
            )
          )}
          <GridBackground color={gridColor} />

          {subject.local_path && frame >= subjectFrame && (
            <div style={{
              position: 'absolute', left: subjX, top: '50%',
              transform: `
                translate(-50%, -50%)
                translateX(${subjEnter}px)
                rotateX(${hoverRotX * 1.5}deg)
                rotateY(${hoverRotY * 1.5}deg)
                translate3d(${hoverX}px, ${hoverY}px, 0)
              `,
              opacity: subjAlpha,
              filter: `blur(${subjBlur}px) drop-shadow(0 60px 80px rgba(0,0,0,0.9)) drop-shadow(0 0 50px ${gridColor}44)`,
              zIndex: 20,
              transformStyle: 'preserve-3d',
            }}>
              <Img src={getAsset(subject.local_path)} style={{ maxHeight: 750, maxWidth: 750, objectFit: 'contain' }} />
            </div>
          )}

          {frame >= typoFrame && (
            <div style={{
              position: 'absolute', left: typoX, top: '50%', width: '45%',
              transform: 'translate(0, -50%)',
              textAlign: subjIsLeft ? 'left' : 'right',
              zIndex: 30,
            }}>
              <h1 style={{
                fontFamily: 'Impact, "Arial Black", sans-serif',
                fontSize: 160,
                fontWeight: 900,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                lineHeight: 0.9,
                margin: 0,
                letterSpacing: -3,
                textShadow: `0 0 40px ${gridColor}AA, 0 0 80px ${gridColor}55, 0 10px 40px rgba(0,0,0,0.9)`,
              }}>
                {displayText}
                {cursorVisible && <span style={{ opacity: 1, color: gridColor }}>|</span>}
              </h1>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* Global Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
        mixBlendMode: 'multiply',
        zIndex: 100,
      }} />
    </AbsoluteFill>
  );
};
