import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile as remotionStaticFile, Sequence } from 'remotion';
import { ProceduralBackground } from './ProceduralBackground';
import { CinematicParticles } from './CinematicParticles';
import { THEME_REGISTRY, ThemePreset } from './ThemeRegistry';
import { SmartAudio } from './SmartAudio';

const staticFile = (path: string) => {
  if (!path) return '';
  const clean = path.replace(/^\/?public\//, '');
  return remotionStaticFile(clean);
};

// ── Procedural Tape ──────────────────────────────────────────────────────────
const Tape = ({ style, color }: { style: React.CSSProperties; color?: string }) => (
  <div style={{
    position: 'absolute',
    width: '120px',
    height: '40px',
    backgroundColor: color || '#00FF41',
    opacity: 0.85,
    boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
    filter: 'url(#rough-edge)',
    zIndex: 10,
    ...style
  }} />
);

// ── Classified Stamp ─────────────────────────────────────────────────────────
const RedStamp = ({ style }: { style: React.CSSProperties }) => (
  <div style={{
    position: 'absolute',
    color: '#ff003c',
    fontSize: '48px',
    fontWeight: 900,
    fontFamily: '"Courier New", monospace',
    textTransform: 'uppercase',
    border: '6px solid #ff003c',
    padding: '10px 20px',
    opacity: 0.9,
    transform: 'rotate(-15deg)',
    filter: 'url(#rough-edge)',
    zIndex: 10,
    ...style
  }}>
    CLASSIFIED
  </div>
);

const Paperclip = ({ style }: { style: React.CSSProperties }) => (
  <div style={{
    position: 'absolute',
    width: '30px',
    height: '100px',
    border: '6px solid silver',
    borderRadius: '15px',
    boxShadow: '2px 5px 10px rgba(0,0,0,0.5)',
    zIndex: 10,
    ...style
  }} />
);

const RenderOverlay = ({ type, style }: { type: string, style?: React.CSSProperties }) => {
  if (type === 'green_masking_tape') return <Tape style={style || {}} />;
  if (type === 'classified_red_stamp') return <RedStamp style={style || {}} />;
  if (type === 'paperclip') return <Paperclip style={style || {}} />;
  return null;
};

export interface MagnatesStageProps {
  payload: any;
  durationInFrames: number;
}

export const MagnatesStage: React.FC<MagnatesStageProps> = ({ payload, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stageMode = payload.stage_mode || 'full_2.5d';
  const themePreset: ThemePreset = payload.theme || 'financial_noir';
  const theme = THEME_REGISTRY[themePreset] || THEME_REGISTRY.financial_noir;

  // ═══════════════════════════════════════════════════════════════════════════
  // CINEMATIC CAMERA RIG
  // ═══════════════════════════════════════════════════════════════════════════
  
  // 1. Slow cinematic dolly push-in (camera physically moves into the scene)
  const dollyZ = interpolate(frame, [0, durationInFrames], [0, 350], { extrapolateRight: 'clamp' });
  
  // 2. Handheld jitter (subtle, organic — NOT aggressive shake)
  const jitterX = Math.sin(frame * 0.35) * 4 + Math.cos(frame * 0.18) * 3;
  const jitterY = Math.cos(frame * 0.28) * 3 + Math.sin(frame * 0.12) * 2;
  const jitterRot = Math.sin(frame * 0.15) * 0.8;
  
  // 3. Slow panoramic drift (camera pans across the scene)
  const panX = interpolate(frame, [0, durationInFrames], [-15, 15], { extrapolateRight: 'clamp' });
  const panY = interpolate(frame, [0, durationInFrames], [5, -5], { extrapolateRight: 'clamp' });

  // ═══════════════════════════════════════════════════════════════════════════
  // SEQUENTIAL STAGING SPRINGS (objects pop in one after another)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Dynamic scaling for extremely short scenes (prevents animations from breaking)
  const isShort = durationInFrames < 60; // Less than 2 seconds
  const timeScale = isShort ? Math.max(0, durationInFrames / 60) : 1.0;
  const tSpotlight = Math.floor(5 * timeScale);
  const tHero = Math.floor(8 * timeScale);
  const tTypo = Math.floor(12 * timeScale);
  const springStiffnessMultiplier = isShort ? 1.5 : 1.0; // Faster pop-ins if short

  // Background is always there
  // Spotlight flashes on
  const spotlightSpring = spring({ frame: Math.max(0, frame - tSpotlight), fps, config: { damping: 15, stiffness: 80 * springStiffnessMultiplier } });
  // Hero slides up from bottom
  const heroSpring = spring({ frame: Math.max(0, frame - tHero), fps, config: { damping: 12, stiffness: 120 * springStiffnessMultiplier, mass: 0.9 } });
  const heroY = interpolate(heroSpring, [0, 1], [400, 0]);
  const heroScale = interpolate(heroSpring, [0, 1], [0.6, 1.0]);
  const heroOpacity = interpolate(heroSpring, [0, 1], [0, 1]);
  // Typography slams
  const typoSpring = spring({ frame: Math.max(0, frame - tTypo), fps, config: { damping: 8, stiffness: 200 * springStiffnessMultiplier, mass: 0.7 } });
  const typoScale = interpolate(typoSpring, [0, 1], [2.5, 1.0]);
  const typoOpacity = interpolate(typoSpring, [0, 1], [0, 1]);

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER EXTRACTION
  // ═══════════════════════════════════════════════════════════════════════════
  const heroLayer = payload.layers?.find((l: any) => l.plane === 'hero_cutout');
  const typoLayer = payload.layers?.find((l: any) => l.plane === 'typography');
  const propsLayer = payload.layers?.find((l: any) => l.plane === 'secondary_props');
  const particleLayer = payload.layers?.find((l: any) => l.plane === 'foreground_particles');
  const depthPropsLayer = payload.layers?.find((l: any) => l.plane === 'foreground_depth_props');
  const bgLayer = payload.layers?.find((l: any) => l.plane === 'background');
  
  const msToFrames = (ms: number) => Math.floor((ms / 1000) * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SVG FILTERS                                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          {/* Newspaper Halftone Paper Edge Filter */}
          <filter id="dossier-paper" x="-50%" y="-50%" width="200%" height="200%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="16" result="dilatedAlpha" />
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="edgeNoise" />
            <feDisplacementMap in="dilatedAlpha" in2="edgeNoise" scale="25" xChannelSelector="R" yChannelSelector="G" result="roughAlpha" />
            <feFlood floodColor="#f4f4f0" result="paperColor" />
            <feComposite in="paperColor" in2="roughAlpha" operator="in" result="paperBorder" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="
              0.33 0.33 0.33 0 0
              0.33 0.33 0.33 0 0
              0.33 0.33 0.33 0 0
              0 0 0 1 0" result="bwImage" />
            <feComponentTransfer in="bwImage" result="contrastImage">
              <feFuncR type="linear" slope="2.5" intercept="-0.5" />
              <feFuncG type="linear" slope="2.5" intercept="-0.5" />
              <feFuncB type="linear" slope="2.5" intercept="-0.5" />
            </feComponentTransfer>
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" result="halftoneNoise" />
            <feColorMatrix in="halftoneNoise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2 -0.5" result="dots" />
            <feBlend mode="multiply" in="contrastImage" in2="dots" result="texturedImage" />
            <feComposite in="texturedImage" in2="SourceAlpha" operator="in" result="finalImage" />
            <feMerge>
              <feMergeNode in="paperBorder" />
              <feMergeNode in="finalImage" />
            </feMerge>
          </filter>
          <filter id="rough-edge">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 3D PERSPECTIVE VIEWPORT                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <AbsoluteFill style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
        <div style={{
          position: 'absolute',
          inset: '-30%',
          transformStyle: 'preserve-3d',
          transform: `translate3d(${panX + jitterX}px, ${panY + jitterY}px, ${dollyZ}px) rotateZ(${jitterRot}deg)`,
        }}>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Z-PLANE 1: BACKGROUND ENVIRONMENT (Z: -800px)                 */}
          {/* Deep background — large image or procedural grid              */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div style={{
            position: 'absolute',
            inset: 0,
            transform: 'translateZ(-800px) scale(2.8)',
            transformStyle: 'preserve-3d',
          }}>
            {bgLayer?.local_path ? (
              <Img src={staticFile(bgLayer.local_path)} style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.3) saturate(0.4) contrast(1.3)',
              }} />
            ) : (
              <ProceduralBackground themePreset={themePreset} durationFrames={durationInFrames} />
            )}
            {/* Grid paper overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }} />
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Z-PLANE 2: VOLUMETRIC SPOTLIGHT (Z: -500px)                   */}
          {/* A dramatic cone of light behind the subject                   */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div style={{
            position: 'absolute',
            inset: 0,
            transform: 'translateZ(-500px) scale(2.0)',
            opacity: spotlightSpring * theme.spotlightIntensity,
          }}>
            {/* Primary spotlight cone */}
            <div style={{
              position: 'absolute',
              left: '30%',
              top: '-20%',
              width: '40%',
              height: '140%',
              background: `linear-gradient(180deg, ${theme.spotlightColor} 0%, transparent 80%)`,
              clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
              filter: 'blur(30px)',
            }} />
            {/* Rim light accent */}
            <div style={{
              position: 'absolute',
              left: '35%',
              top: '15%',
              width: '30%',
              height: '70%',
              background: `radial-gradient(ellipse, ${theme.accentColor}15 0%, transparent 70%)`,
              filter: 'blur(40px)',
            }} />
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Z-PLANE 3: TYPOGRAPHY (Z: -350px)                             */}
          {/* Big cinematic text floating in 3D space behind the hero       */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {typoLayer && (
            <Sequence from={msToFrames(typoLayer.entrance_ms || 0)} style={{ position: 'absolute', inset: 0 }}>
              <div style={{
                position: 'absolute',
                top: '12%',
                left: '5%',
                right: '5%',
                transform: `translateZ(-350px) scale(${1.45 * typoScale})`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                pointerEvents: 'none',
                opacity: typoOpacity,
              }}>
                <Tape style={{ top: '-15px', transform: 'rotate(-5deg)' }} color={theme.tapeColor} />
                <h2 style={{
                  fontSize: '130px',
                  fontFamily: theme.fontFamily,
                  color: '#f4f4f0',
                  letterSpacing: '8px',
                  textTransform: 'uppercase',
                  margin: 0,
                  padding: '20px 40px',
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  boxShadow: `0 20px 60px ${theme.shadowColor}`,
                }}>
                  {typoLayer.headline || ''}
                </h2>
                <div style={{
                  fontSize: '48px',
                  fontFamily: '"Courier New", monospace',
                  fontWeight: 900,
                  color: theme.accentColor,
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  padding: '10px 20px',
                  marginTop: '15px',
                }}>
                  {typoLayer.sub_headline || ''}
                </div>
              </div>
              {typoLayer.local_sfx_path && <SmartAudio src={typoLayer.local_sfx_path} durationFrames={durationInFrames - msToFrames(typoLayer.entrance_ms || 200)} baseVolume={0.25} playbackRate={1.1} />}
            </Sequence>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Z-PLANE 4: SECONDARY PROPS (Z: -50px)                         */}
          {/* Flanking documents, objects, props with paper filter           */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {stageMode === 'full_2.5d' && propsLayer?.items && (
            <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(-50px)', transformStyle: 'preserve-3d' }}>
              {propsLayer.items.map((item: any, idx: number) => {
                if (!item.local_path) return null;
                
                const pos = item.position || { x: 0, y: 0, z: -50, rotation: 0, scale: 1.0 };
                const base_e_frame = msToFrames(item.entrance_ms || (idx * 300 + 400));
                const e_frame = Math.floor(base_e_frame * timeScale);
                const itemSpring = spring({ frame: Math.max(0, frame - e_frame), fps, config: { damping: 10, stiffness: 150 * springStiffnessMultiplier } });
                const itemScale = interpolate(itemSpring, [0, 1], [0.3, pos.scale || 1.0]);
                const itemOpacity = interpolate(itemSpring, [0, 1], [0, 1]);

                return (
                  <Sequence key={idx} from={e_frame} style={{ position: 'absolute', inset: 0 }}>
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate3d(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px), ${pos.z}px) scale(${itemScale}) rotate(${pos.rotation || 0}deg)`,
                      filter: `drop-shadow(0 20px 40px rgba(0,0,0,0.9))`,
                      opacity: itemOpacity,
                    }}>
                      <RenderOverlay type={item.tactile_overlay} style={{ top: '-20px', left: '20%' }} />
                      <Img src={staticFile(item.local_path)} style={{ maxWidth: '400px', maxHeight: '400px', objectFit: 'contain', filter: 'url(#dossier-paper)' }} />
                    </div>
                    {item.local_sfx_path && <SmartAudio src={item.local_sfx_path} durationFrames={durationInFrames - e_frame} baseVolume={0.15} playbackRate={1.05} />}
                  </Sequence>
                );
              })}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Z-PLANE 5: HERO CUTOUT (Z: +120px)                            */}
          {/* The primary subject — slides up from bottom with spring       */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {heroLayer?.local_cutout_path && (
            <Sequence from={msToFrames(heroLayer.entrance_ms || 0)} style={{ position: 'absolute', inset: 0 }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate3d(calc(-50% + ${heroLayer.position?.x || 0}px), calc(-50% + ${heroY + (heroLayer.position?.y || 20)}px), ${heroLayer.position?.z || 120}px) scale(${heroScale * (heroLayer.position?.scale || 1.15)}) rotate(${heroLayer.position?.rotation || 0}deg)`,
                transformStyle: 'preserve-3d',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: heroOpacity,
              }}>
                {/* Massive hero shadow on the ground plane */}
                <div style={{
                  position: 'absolute',
                  bottom: '-80px',
                  left: '10%',
                  right: '10%',
                  height: '60px',
                  background: `radial-gradient(ellipse, ${theme.shadowColor} 0%, transparent 70%)`,
                  filter: 'blur(25px)',
                  opacity: theme.shadowIntensity,
                }} />
                <div style={{ position: 'relative' }}>
                  <Tape style={{ top: '20px', left: '-30px', transform: 'rotate(-25deg)' }} color={theme.tapeColor} />
                  <Tape style={{ bottom: '40px', right: '-20px', transform: 'rotate(15deg)' }} color={theme.tapeColor} />
                  <Img
                    src={staticFile(heroLayer.local_cutout_path)}
                    style={{
                      maxHeight: '750px',
                      maxWidth: '900px',
                      objectFit: 'contain',
                      filter: 'url(#dossier-paper) drop-shadow(0 40px 80px rgba(0,0,0,0.95))',
                    }}
                  />
                </div>
              </div>
              {heroLayer.local_sfx_path && <SmartAudio src={heroLayer.local_sfx_path} durationFrames={durationInFrames - msToFrames(heroLayer.entrance_ms || 0)} baseVolume={0.3} playbackRate={0.95} />}
            </Sequence>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Z-PLANE 6: FALLING PARTICLES (Z: +380px)                      */}
          {/* Small themed objects drifting through the scene                */}
          {/* ─────────────────────────────────────────────────────────────── */}
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
                    filter: 'blur(3px)',
                  }}>
                    {particleLayer?.local_path ? (
                      <Img src={staticFile(particleLayer.local_path)} style={{ width: '120px', filter: 'url(#dossier-paper)' }} />
                    ) : (
                      <div style={{
                        width: '100px',
                        height: '45px',
                        backgroundColor: '#1b5e20',
                        border: `2px solid ${theme.accentColor}`,
                        boxShadow: theme.particleGlow,
                        filter: 'url(#rough-edge)',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Z-PLANE 7: FOREGROUND DEPTH PROPS (Z: +600px)                 */}
          {/* MASSIVELY BLURRED close-up objects drifting past the lens     */}
          {/* Creates extreme parallax depth — the "After Effects" look     */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {stageMode === 'full_2.5d' && depthPropsLayer?.items && (
            <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(600px)', pointerEvents: 'none', transformStyle: 'preserve-3d' }}>
              {depthPropsLayer.items.map((item: any, idx: number) => {
                if (!item.local_path) return null;
                
                const seed = idx * 271.3 + 99;
                // Slow horizontal drift — one goes left, one goes right
                const driftDirection = idx % 2 === 0 ? 1 : -1;
                const driftX = interpolate(
                  frame,
                  [0, durationInFrames],
                  [driftDirection * -600, driftDirection * 600],
                  { extrapolateRight: 'clamp' }
                );
                // Slight vertical bob
                const bobY = Math.sin(frame * 0.03 + seed) * 30;
                // Position: left items on the left edge, right items on the right edge
                const baseX = idx % 2 === 0 ? -300 : 300;
                const baseY = ((seed * 3.7) % 400) - 200;

                return (
                  <div key={idx} style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translate3d(${baseX + driftX}px, ${baseY + bobY}px, 0) rotate(${(seed % 30) - 15}deg) scale(3.0)`,
                    filter: 'blur(12px)',
                    opacity: 0.5,
                  }}>
                    <Img src={staticFile(item.local_path)} style={{
                      width: '300px',
                      height: '300px',
                      objectFit: 'contain',
                    }} />
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </AbsoluteFill>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VOLUMETRIC ATMOSPHERIC PARTICLES (on top of everything)           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <CinematicParticles
        count={25}
        glowColor={theme.accentColor + '40'}
        baseSize={3}
        drift="up"
      />

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DARK VIGNETTE CRUSH                                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        inset: 0,
        boxShadow: theme.vignetteStyle,
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};
