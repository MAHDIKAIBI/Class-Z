import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile, Sequence, Easing, random, OffthreadVideo } from 'remotion';


import { Audio } from 'remotion';

const EnvelopedSFX: React.FC<{src?: string; startFrame: number; peakVolume?: number; sustainFrames?: number}> = ({src, startFrame, peakVolume=1, sustainFrames=30}) => {
  const frame = useCurrentFrame();
  if (!src) return null;
  const rel = frame - startFrame;
  const vol = interpolate(rel, [0, 5, sustainFrames, sustainFrames+15], [0, peakVolume, peakVolume, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Audio handles start internally if wrapped in Sequence, but since we are AbsoluteFill, we need to manually adjust or just rely on the mixer.
  // Actually, standard Audio plays from frame 0 unless Sequence is used. 
  // Let's use Sequence to properly start it.
  return (
    <Sequence from={startFrame}>
      <Audio src={getAsset(src)} volume={vol} />
    </Sequence>
  );
};

const getAsset = (path: string) => path ? staticFile(path.replace(/^\/?public\//, '')) : '';
const msToFrames = (ms: number, fps: number) => Math.floor((ms / 1000) * fps);

const GRID_COLOR_MAP: Record<string, string> = {
  neon_green: '#D4AF37', // Old Money Gold
  electric_blue: '#E2B714',
  crimson: '#D4AF37',
  gold: '#D4AF37',
  purple: '#D4AF37',
  white: '#FFFFFF',
};

const GridBackground: React.FC<{ color: string }> = ({ color }) => {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse at 50% 40%, ${color}15 0%, #05070A 80%, #000000 100%)`,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
        background: `linear-gradient(to top, ${color}15, transparent)`,
        borderTop: `1px solid ${color}44`,
        transform: 'perspective(1000px) rotateX(80deg)',
        transformOrigin: 'bottom',
        boxShadow: `0 -50px 150px ${color}44`,
        mixBlendMode: 'screen'
      }} />
      <div style={{
        position: 'absolute', top: '20%', bottom: '50%', left: 0, right: 0,
        background: 'linear-gradient(to top, transparent, #000000)'
      }} />
    </div>
  );
};

const RainParticle: React.FC<{ src: string; seed: number; durationFrames: number; fps: number }> = ({ src, seed, fps }) => {
  const frame = useCurrentFrame();
  const startDelay = Math.floor(random(seed) * fps * 2);
  const fallDuration = fps * 15 + Math.floor(random(seed + 1) * fps * 5);
  const relFrame = (frame + startDelay) % fallDuration;
  
  const x = random(seed + 2) * 100;
  const y = interpolate(relFrame, [0, fallDuration], [120, -20]); // float up like embers/dust
  const s = interpolate(random(seed + 3), [0, 1], [0.3, 1.2]);
  
  const zDepth = random(seed + 4);
  const blur = zDepth > 0.8 ? 15 : (zDepth < 0.2 ? 2 : 6);
  const opacity = interpolate(relFrame, [0, 15, fallDuration - 15, fallDuration], [0, 0.6, 0.6, 0]);

  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: `scale(${s}) translateZ(${interpolate(zDepth, [0, 1], [-500, 200])}px)`,
      opacity,
      filter: `blur(${blur}px)`,
      zIndex: zDepth > 0.5 ? 5 : 40,
    }}>
      <Img src={getAsset(src)} style={{ width: 80, height: 80, objectFit: 'contain' }} />
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
  const orbitsRaw = Array.isArray(p1.orbit_helpers) ? p1.orbit_helpers : (p1.orbit_helpers ? [p1.orbit_helpers] : []);
  // Clone to requested count if only one is provided
  const orbitsCount = (p1.orbit_helpers && !Array.isArray(p1.orbit_helpers)) ? (p1.orbit_helpers.count || 4) : orbitsRaw.length;
  const orbits = orbitsRaw.length === 1 && orbitsCount > 1 
    ? Array.from({ length: orbitsCount }).map((_, i) => ({ ...orbitsRaw[0], trigger_start_ms: (orbitsRaw[0].trigger_start_ms || 0) + i * 150 })) 
    : orbitsRaw;

  const subject    = p2.subject || {};
  const typography = p2.typography || {};

  const heroFrame    = msTof(hero.trigger_start_ms || 1000);
  const whipFrame    = msTof(tr.trigger_start_ms || 4000);
  const subjectFrame = msTof(subject.trigger_start_ms || 4200);
  const typoFrame    = msTof(typography.trigger_start_ms || 4500);

  // Cinematic Slower Whip Transition
  const whipRel  = Math.max(0, frame - whipFrame);
  const whipSprg = spring({ frame: whipRel, fps, config: { damping: 200, stiffness: 40 } });
  
  const shiftAmount = tr.direction === 'right' ? -3500 : 3500;
  const whipX1 = interpolate(whipSprg, [0, 1], [0, shiftAmount]);
  const whipX2 = interpolate(whipSprg, [0, 1], [-shiftAmount, 0]);
  
  // High motion blur during the crossover
  const whipBlur = interpolate(whipSprg, [0, 0.4, 0.6, 1], [0, 90, 90, 0]);
  const crossfadeP1 = interpolate(whipSprg, [0, 0.5, 1], [1, 0.5, 0]);
  const crossfadeP2 = interpolate(whipSprg, [0, 0.5, 1], [0, 0.5, 1]);

  const hoverRotX = Math.sin(frame * 0.02) * 5;
  const hoverRotY = Math.cos(frame * 0.025) * 8;

  const heroRel   = Math.max(0, frame - heroFrame);
  const heroSprg  = spring({ frame: heroRel, fps, config: { damping: 150, stiffness: 30 } });
  const heroY = 0;
  const heroScale = interpolate(heroRel, [0, 300], [0.95, 1.05]); // Continuous slow scale
  const heroRotZ = 0;
  const heroAlpha = interpolate(heroRel, [0, 60], [0, 1], { extrapolateRight: 'clamp' });


  const hoverX    = Math.sin(frame * 0.02) * 15;
  const hoverY    = Math.cos(frame * 0.025) * 15;

  const p2Rel    = Math.max(0, frame - whipFrame);
  const camTiltY = interpolate(p2Rel, [0, 400], [15, -15]);
  const camTiltX = interpolate(p2Rel, [0, 400], [5, -5]);
  const camZoom  = interpolate(p2Rel, [0, 400], [0, 250]);


  const subjRel   = Math.max(0, frame - subjectFrame);
  const subjSprg  = spring({ frame: subjRel, fps, config: { damping: 150, stiffness: 30 } });
  const subjEnter = 0;
  const subjBlur = interpolate(subjRel, [0, 60], [20, 0], { extrapolateRight: 'clamp' });
  const subjAlpha = interpolate(subjRel, [0, 60], [0, 1], { extrapolateRight: 'clamp' });

  const typoText      = typography.text || '';
  const typoRel       = Math.max(0, frame - typoFrame);
  const displayText   = typoText;
  const cursorVisible = false;
  const typoBlur      = interpolate(typoRel, [0, 60], [20, 0], { extrapolateRight: 'clamp' });
  const typoOpacity   = interpolate(typoRel, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const typoTracking  = interpolate(typoRel, [0, 150], [0, 30]);

  const subjIsLeft = subject.position === 'left';
  const subjX      = subjIsLeft ? '25%' : '75%';
  const typoX      = subjIsLeft ? '55%' : '5%';

  // Widely spread coordinates to prevent stacking
  const orbitPos = [
    { x: -550, y: -250, z: -350, s: 0.65 },
    { x:  550, y: -200, z: -400, s: 0.55 },
    { x: -500, y:  300, z: -250, s: 0.75 },
    { x:  500, y:  280, z: -300, s: 0.60 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#020202', filter: 'contrast(1.15) saturate(1.1)' }}>
      <EnvelopedSFX src={p1.background?.local_sfx_path} startFrame={0} peakVolume={0.4} />
      <EnvelopedSFX src={hero.local_sfx_path} startFrame={heroFrame} />
      <EnvelopedSFX src={tr.local_sfx_path} startFrame={whipFrame} peakVolume={0.8} />
      <EnvelopedSFX src={subject.local_sfx_path} startFrame={subjectFrame} />
      <EnvelopedSFX src={typography.local_sfx_path} startFrame={typoFrame} sustainFrames={typoText.length * 2} />

      {/* PART 1 */}
      {frame < whipFrame + 60 && (
        <AbsoluteFill style={{ 
            transform: `translateZ(${interpolate(frame, [0, durationInFrames], [0, 400])}px)`, 
            opacity: crossfadeP1,
            filter: `blur(${whipBlur}px)`, 
            transform: `translateX(${whipX1}px)`, 
            perspective: '1200px',
            willChange: 'transform, filter, opacity'
        }}>
          {bgPath1 ? (
            isVideo(bgPath1) ? (
              <OffthreadVideo src={getAsset(bgPath1)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, filter: 'blur(10px)', transform: 'scale(1.1)' }} loop muted />
            ) : (
              <Img src={getAsset(bgPath1)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, filter: 'blur(10px)', transform: 'scale(1.1)' }} />
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
              
              const oSprg = spring({ frame: oRel, fps, config: { damping: 150, stiffness: 30 } });
              const pos   = orbitPos[idx % orbitPos.length] || orbitPos[0];
              const oScale = interpolate(oSprg, [0, 1], [0, pos.s]);
              
              // Permanent 6px DoF blur for elements behind the hero
              const oBlur  = interpolate(oSprg, [0, 0.7, 1], [50, 15, 6]);
              
              // Significantly slower movement for professional anti-gravity drift
              const floatY = Math.sin((frame + idx * 45) * 0.005) * 20;
              const floatX = Math.sin((frame + idx * 30) * 0.003) * 15;
              const floatRot = Math.cos((frame + idx * 60) * 0.004) * 6;

              return (
                <React.Fragment key={`orb-${idx}`}>
                  <EnvelopedSFX src={orb.local_sfx_path} startFrame={orbStart} peakVolume={0.5} />
                  <div style={{
                    position: 'absolute',
                    left: `calc(50% + ${pos.x}px)`,
                    top: `calc(50% + ${pos.y}px)`,
                    transform: `
                      translate(-50%, -50%) 
                      translateZ(${pos.z}px) 
                      scale(${oScale}) 
                      translate3d(${floatX}px, ${floatY}px, 0) 
                      rotate(${floatRot}deg)
                    `,
                    filter: `
                      blur(${oBlur}px)
                      brightness(1.15)
                      contrast(1.2)
                      drop-shadow(0px 40px 50px rgba(0,0,0,0.8))
                      drop-shadow(0px 10px 20px rgba(0,0,0,0.5))
                    `,
                    zIndex: 10,
                    transformStyle: 'preserve-3d',
                  }}>
                    {orb.local_path && <Img src={getAsset(orb.local_path)} style={{ width: 350, height: 350, objectFit: 'contain' }} />}
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
      {frame >= whipFrame - 5 && (
        <AbsoluteFill style={{ 
            opacity: crossfadeP2,
            filter: `blur(${whipBlur}px)`, 
            transform: `translateX(${whipX2}px)`, 
            perspective: '1500px',
            willChange: 'transform, filter, opacity'
        }}>
          {/* 3D Camera Rig */}
          <AbsoluteFill style={{
              transform: `rotateY(${camTiltY}deg) rotateX(${camTiltX}deg) translateZ(${camZoom}px)`,
              transformStyle: 'preserve-3d',
              transformOrigin: 'center'
          }}>
            {bgPath2 && (
              isVideo(bgPath2) ? (
                <OffthreadVideo src={getAsset(bgPath2)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, filter: 'blur(8px)', transform: 'scale(1.5) translateZ(-500px)' }} loop muted />
              ) : (
                <Img src={getAsset(bgPath2)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, filter: 'blur(8px)', transform: 'scale(1.5) translateZ(-500px)' }} />
              )
            )}
            
            <div style={{transform: 'translateZ(-200px)', width: '100%', height: '100%', position: 'absolute', inset: 0}}>
              <GridBackground color={gridColor} />
            </div>

            {subject.local_path && frame >= subjectFrame && (
              <div style={{
                position: 'absolute', left: subjX, top: '50%',
                transform: `
                  translate(-50%, -50%)
                  translateX(${subjEnter}px)
                  rotateX(${hoverRotX * 1.5}deg)
                  rotateY(${hoverRotY * 1.5}deg)
                  translate3d(${hoverX}px, ${hoverY}px, 50px)
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
                position: 'absolute', left: typoX, top: '50%', width: '40%',
                transform: 'translate(0, -50%) translateZ(150px)',
                textAlign: subjIsLeft ? 'left' : 'right',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: subjIsLeft ? 'flex-start' : 'flex-end',
                zIndex: 30,
                transformStyle: 'preserve-3d',
              }}>
                <h1 style={{
                  fontFamily: '"Playfair Display", "Cinzel", serif',
                  fontSize: 140,
                  fontWeight: 700,
                  color: '#D4AF37',
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  margin: 0,
                  letterSpacing: `${typoTracking}px`,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  opacity: typoOpacity,
                  filter: `blur(${typoBlur}px)`,
                  textShadow: `0 10px 40px rgba(0,0,0,1), 0 0 20px rgba(212,175,55,0.3)`,
                }}>
                  {displayText}
                </h1>
              </div>
            )}
          </AbsoluteFill>
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
