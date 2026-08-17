import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile as remotionStaticFile } from 'remotion';
import { ProceduralBackground } from './ProceduralBackground';
import { ThemePreset } from './ThemeRegistry';

const staticFile = (path: string) => {
  if (!path) return '';
  const clean = path.replace(/^\/?public\//, '');
  return remotionStaticFile(clean);
};

// Procedural tape component
const Tape = ({ style }: { style: React.CSSProperties }) => (
  <div style={{
    position: 'absolute',
    width: '120px',
    height: '40px',
    backgroundColor: '#00FF41',
    opacity: 0.85,
    boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
    filter: 'url(#rough-edge)',
    zIndex: 10,
    ...style
  }} />
);

export interface MagnatesStageProps {
  payload: any;
  durationInFrames: number;
}

export const MagnatesStage: React.FC<MagnatesStageProps> = ({ payload, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stageMode = payload.stage_mode || 'full_2.5d';
  const themePreset: ThemePreset = payload.theme || 'financial_noir';

  // 1. HANDHELD JITTER CAMERA
  // We use rapid sine waves to simulate a shaky handheld camera
  const cameraZ = interpolate(frame, [0, durationInFrames], [0, 250], { extrapolateRight: 'clamp' });
  const jitterX = Math.sin(frame * 0.45) * 6 + Math.cos(frame * 0.25) * 4;
  const jitterY = Math.cos(frame * 0.38) * 5 + Math.sin(frame * 0.15) * 3;
  const jitterRot = Math.sin(frame * 0.2) * 1.5;
  const cameraPanX = interpolate(frame, [0, durationInFrames], [-20, 20], { extrapolateRight: 'clamp' }) + jitterX;

  // 2. AGGRESSIVE POP-IN SPRINGS (Stop-motion feel)
  const heroSpring = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 9, stiffness: 200, mass: 0.8 } });
  const heroScale = interpolate(heroSpring, [0, 1], [0.1, 1.0]);
  const heroRot = interpolate(heroSpring, [0, 1], [15, 0]);

  const propSpring = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 10, stiffness: 180 } });

  // Layers extraction
  const heroLayer = payload.layers?.find((l: any) => l.plane === 'hero_cutout');
  const typoLayer = payload.layers?.find((l: any) => l.plane === 'typography');
  const propsLayer = payload.layers?.find((l: any) => l.plane === 'secondary_props');
  const particleLayer = payload.layers?.find((l: any) => l.plane === 'foreground_particles');

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a1a', overflow: 'hidden' }}>
      
      {/* ============================================================ */}
      {/* SVG FILTERS DEFINITION                                       */}
      {/* ============================================================ */}
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          {/* Newspaper Halftone/B&W + White Paper Edge Filter */}
          <filter id="dossier-paper" x="-20%" y="-20%" width="140%" height="140%">
            {/* Create a thick white border based on the alpha channel */}
            <feMorphology in="SourceAlpha" operator="dilate" radius="15" result="dilatedAlpha" />
            <feFlood floodColor="#f4f4f0" result="whiteColor" />
            <feComposite in="whiteColor" in2="dilatedAlpha" operator="in" result="whiteBorder" />
            
            {/* Crush the image into high-contrast B&W */}
            <feColorMatrix in="SourceGraphic" type="matrix" values="
              0.33 0.33 0.33 0 0
              0.33 0.33 0.33 0 0
              0.33 0.33 0.33 0 0
              0 0 0 1 0" result="bwImage" />
            <feComponentTransfer in="bwImage" result="contrastImage">
              <feFuncR type="linear" slope="1.5" intercept="-0.2" />
              <feFuncG type="linear" slope="1.5" intercept="-0.2" />
              <feFuncB type="linear" slope="1.5" intercept="-0.2" />
            </feComponentTransfer>

            {/* Merge the B&W image on top of the white border */}
            <feMerge>
              <feMergeNode in="whiteBorder" />
              <feMergeNode in="contrastImage" />
            </feMerge>
          </filter>

          {/* Rough edge for the green tape */}
          <filter id="rough-edge">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* ============================================================ */}
      {/* 3D PERSPECTIVE VIEWPORT                                      */}
      {/* ============================================================ */}
      <AbsoluteFill style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
        <div style={{
          position: 'absolute',
          inset: '-30%',
          transformStyle: 'preserve-3d',
          transform: `translate3d(${cameraPanX}px, ${jitterY}px, ${cameraZ}px) rotateZ(${jitterRot}deg)`,
        }}>

          {/* ------------------------------------------------------------ */}
          {/* PLANE 1: THE GRID PAPER CANVAS (Z: -800px)                  */}
          {/* ------------------------------------------------------------ */}
          <div style={{
            position: 'absolute',
            inset: 0,
            transform: 'translateZ(-800px) scale(1.6)',
            backgroundColor: '#1c201e',
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            boxShadow: 'inset 0 0 500px rgba(0,0,0,0.9)'
          }} />

          {/* ------------------------------------------------------------ */}
          {/* PLANE 2: TYPOGRAPHY & GREEN TAPE (Z: -350px)                 */}
          {/* ------------------------------------------------------------ */}
          {typoLayer && (
            <div style={{
              position: 'absolute',
              top: '15%',
              left: '8%',
              right: '8%',
              transform: 'translateZ(-350px) scale(1.45)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <Tape style={{ top: '-15px', transform: 'rotate(-5deg)' }} />
              <h2 style={{
                fontSize: '130px',
                fontFamily: '"Impact", sans-serif',
                color: '#f4f4f0',
                letterSpacing: '8px',
                textTransform: 'uppercase',
                margin: 0,
                padding: '20px 40px',
                backgroundColor: 'rgba(0,0,0,0.85)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
              }}>
                {typoLayer.headline || ''}
              </h2>
              <div style={{
                fontSize: '48px',
                fontFamily: '"Courier New", monospace',
                fontWeight: 900,
                color: '#00FF41',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: '10px 20px',
                marginTop: '15px'
              }}>
                {typoLayer.sub_headline || ''}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* PLANE 3: DOSSIER PROPS (Z: -50px)                           */}
          {/* ------------------------------------------------------------ */}
          {stageMode === 'full_2.5d' && propsLayer?.items && (
            <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(-50px)', transformStyle: 'preserve-3d' }}>
              {propsLayer.items.map((item: any, idx: number) => {
                if (!item.local_path) return null;
                const offsetX = idx === 0 ? -400 : 400;
                const offsetY = idx === 0 ? 100 : -50;
                const rot = idx === 0 ? -12 : 8;

                return (
                  <div key={idx} style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), 0px) scale(${propSpring}) rotate(${rot}deg)`,
                    filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.8))'
                  }}>
                    <Tape style={{ top: '-10px', left: '40%', transform: `rotate(${rot * -2}deg)` }} />
                    <Img src={staticFile(item.local_path)} style={{ maxWidth: '350px', maxHeight: '350px', objectFit: 'contain', filter: 'url(#dossier-paper)' }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* PLANE 4: PRIMARY HERO PAPER CUTOUT (Z: +120px)              */}
          {/* ------------------------------------------------------------ */}
          {heroLayer?.local_cutout_path && (
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '55%',
              transform: `translate3d(-50%, -50%, 120px) scale(${heroScale}) rotate(${heroRot}deg)`,
              transformStyle: 'preserve-3d',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ position: 'relative' }}>
                <Tape style={{ top: '20px', left: '-30px', transform: 'rotate(-25deg)' }} />
                <Tape style={{ bottom: '40px', right: '-20px', transform: 'rotate(15deg)' }} />
                <Img
                  src={staticFile(heroLayer.local_cutout_path)}
                  style={{
                    maxHeight: '650px',
                    maxWidth: '800px',
                    objectFit: 'contain',
                    filter: 'url(#dossier-paper) drop-shadow(0 40px 60px rgba(0,0,0,0.95))'
                  }}
                />
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* PLANE 5: FALLING DOLLARS / PARTICLES (Z: +380px)            */}
          {/* ------------------------------------------------------------ */}
          {stageMode === 'full_2.5d' && (
            <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(380px)', pointerEvents: 'none' }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const seed = i * 149.2;
                const startX = (seed % 1800) - 900;
                const speedY = 2.5 + (i % 3);
                const curY = ((frame * speedY * 7) + (seed * 8)) % 1500 - 750;
                const rot = (frame * (i % 2 === 0 ? 1 : -1) * 2.5) + (i * 50);

                return (
                  <div key={i} style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translate3d(${startX}px, ${curY}px, 0) rotate(${rot}deg) scale(1.2)`,
                    opacity: 0.85,
                    filter: 'blur(3px)'
                  }}>
                    {particleLayer?.local_path ? (
                      <Img src={staticFile(particleLayer.local_path)} style={{ width: '120px', filter: 'url(#dossier-paper)' }} />
                    ) : (
                      // Fallback: A green paper bill
                      <div style={{
                        width: '100px',
                        height: '45px',
                        backgroundColor: '#1b5e20',
                        border: '2px solid #00FF41',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                        filter: 'url(#rough-edge)'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </AbsoluteFill>

      {/* Dark Vignette to crush edges */}
      <div style={{
        position: 'absolute',
        inset: 0,
        boxShadow: 'inset 0 0 300px rgba(0,0,0,0.98)',
        pointerEvents: 'none'
      }} />
    </AbsoluteFill>
  );
};
