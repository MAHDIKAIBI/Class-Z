import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile, Sequence, Easing, random } from 'remotion';
import { ProceduralBackground } from './ProceduralBackground';
import { CinematicParticles } from './CinematicParticles';
import { THEME_REGISTRY, ThemePreset } from './ThemeRegistry';
import { SmartAudio } from './SmartAudio';

const getAsset = (path: string) => path ? staticFile(path.replace(/^\/?public\//, '')) : '';

export const MagnatesStage: React.FC<{ payload: any; durationInFrames: number }> = ({ payload, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visualData = payload || {};
  const themePreset: ThemePreset = visualData.theme || 'financial_noir';
  const theme = THEME_REGISTRY[themePreset] || THEME_REGISTRY.financial_noir;
  const events = visualData.events || [];
  const environments = visualData.environments || [{ id: 'env_A', query: 'dark cinematic void' }];

  const msToFrames = (ms: number) => Math.floor((ms / 1000) * fps);

  // ═══════════════════════════════════════════════════════════════════════════
  // THE CAMERA STATE MACHINE
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Base Dolly: Always creeping forward
  let cameraZ = interpolate(frame, [0, durationInFrames], [0, 400], { easing: Easing.linear });
  let cameraPanX = 0;
  let blurAmount = 0;
  let activeEnvIndex = 0;

  events.forEach((evt: any) => {
    const triggerFrame = msToFrames(evt.time_ms || 0);
    const relativeFrame = Math.max(0, frame - triggerFrame);

    // Camera Whip (Rapid X-axis movement + motion blur)
    if (evt.type === 'camera_whip') {
      const whipSpring = spring({ frame: relativeFrame, fps, config: { damping: 14, stiffness: 150 } });
      cameraPanX += interpolate(whipSpring, [0, 1], [0, evt.direction === 'left' ? 800 : -800]);
      blurAmount += interpolate(whipSpring, [0, 0.5, 1], [0, 15, 0]);
    }

    // Z-Warp (Violent Z-axis acceleration + Environment Swap)
    if (evt.type === 'z_warp') {
      // Bézier curve for aggressive acceleration and hard brake
      const warpProgress = interpolate(relativeFrame, [0, 20], [0, 1], { 
        easing: Easing.bezier(0.8, 0, 0.2, 1), 
        extrapolateRight: 'clamp' 
      });
      
      cameraZ += interpolate(warpProgress, [0, 1], [0, 2500]);
      blurAmount += interpolate(warpProgress, [0, 0.5, 1], [0, 40, 0]); // Extreme depth blur during warp
      
      if (relativeFrame > 10) {
        activeEnvIndex = environments.findIndex((e: any) => e.id === evt.target_env);
        if (activeEnvIndex === -1) activeEnvIndex = 0; // fallback
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DENSITY CALCULATOR
  // ═══════════════════════════════════════════════════════════════════════════
  const getDensityCount = (density: string) => {
    switch(density) {
      case 'LOW': return 3;
      case 'MEDIUM': return 7;
      case 'HIGH': return 15;
      case 'EXTREME': return 30;
      default: return 5;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#020202', overflow: 'hidden' }}>
      <AbsoluteFill style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
        
        {/* CAMERA RIG */}
        <div style={{
          position: 'absolute', inset: '-50%', transformStyle: 'preserve-3d',
          transform: `translate3d(${cameraPanX}px, 0px, ${cameraZ}px)`,
          filter: `blur(${blurAmount}px)`, // Applies motion blur to the entire rig during whips/warps
        }}>

          {/* ENVIRONMENT STACK (Crossfading based on active state) */}
          {environments.map((env: any, idx: number) => {
            const isVisible = idx === activeEnvIndex;
            // When warping, the old environment scales up and fades out, the new one appears
            const envOpacity = spring({ frame: isVisible ? frame : 0, fps, config: { damping: 20 } });
            
            return (
              <div key={`env-${idx}`} style={{
                position: 'absolute', inset: 0,
                transform: 'translateZ(-2000px) scale(5.0)',
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.4s ease-in-out',
                filter: 'brightness(1.0) contrast(1.2)'
              }}>
                {isVisible && <ProceduralBackground durationFrames={durationInFrames} themePreset={themePreset}/>}
              </div>
            );
          })}

          {/* EVENT LOOP */}
          {events.map((evt: any, idx: number) => {
            const startFrame = msToFrames(evt.time_ms || 0);
            const relativeFrame = Math.max(0, frame - startFrame);

            // TYPOGRAPHY
            if (evt.type === 'typography') {
              const typoSpring = spring({ frame: relativeFrame, fps, config: { damping: 16, stiffness: 200 } });
              const scale = interpolate(typoSpring, [0, 1], [3, 1]);
              return (
                <Sequence key={`typo-${idx}`} from={startFrame} style={{ position: 'absolute', inset: 0 }}>
                  <div style={{
                    position: 'absolute', top: '25%', width: '100%', textAlign: 'center',
                    transform: `translateZ(-500px) scale(${scale})`,
                    zIndex: 10
                  }}>
                    <h1 style={{
                      fontFamily: theme.fontFamily, fontSize: '180px', color: '#FFF',
                      textTransform: 'uppercase', letterSpacing: '12px', margin: 0,
                      textShadow: `0 20px 60px rgba(0,0,0,0.9)`
                    }}>
                      {evt.text}
                    </h1>
                  </div>
                </Sequence>
              );
            }

            // HERO
            if (evt.type === 'hero_reveal' && evt.local_path) {
              const heroSpring = spring({ frame: relativeFrame, fps, config: { damping: 14, stiffness: 90 } });
              const yPos = interpolate(heroSpring, [0, 1], [200, 0]);
              return (
                <Sequence key={`hero-${idx}`} from={startFrame} style={{ position: 'absolute', inset: 0 }}>
                  <div style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: `translate3d(-50%, calc(-50% + ${yPos}px), -300px)`,
                    zIndex: 20
                  }}>
                    <Img src={getAsset(evt.local_path)} style={{ maxHeight: '1100px', objectFit: 'contain', filter: 'drop-shadow(0 50px 80px rgba(0,0,0,0.9))' }} />
                  </div>
                </Sequence>
              );
            }

            // SWARM TRAJECTORY (Objects flying past the lens)
            if (evt.type === 'swarm_trajectory' && evt.local_path) {
              const count = getDensityCount(evt.density);
              
              return Array.from({ length: count }).map((_, swarmIdx) => {
                const seed = idx * 100 + swarmIdx;
                
                // Deterministic spread
                const startX = interpolate(random(`x-${seed}`), [0, 1], [-1200, 1200]);
                const startY = interpolate(random(`y-${seed}`), [0, 1], [-800, 800]);
                
                // Trajectory: Starts deep in the background, flies to extreme foreground (+1500)
                const startZ = interpolate(random(`z-${seed}`), [0, 1], [-1500, -800]);
                const endZ = startZ + 2500; 
                
                const flightProgress = interpolate(relativeFrame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp' });
                const currentZ = interpolate(flightProgress, [0, 1], [startZ, endZ]);
                
                const rRot = interpolate(flightProgress, [0, 1], [0, interpolate(random(`rot-${seed}`), [0, 1], [-180, 180])]);
                
                // Depth Blur Math (Blurs when far away AND when too close to lens)
                const depthBlur = currentZ < -800 ? 10 : currentZ > 800 ? 25 : 0;

                return (
                  <Sequence key={`swarm-${idx}-${swarmIdx}`} from={startFrame} style={{ position: 'absolute', inset: 0 }}>
                    <div style={{
                      position: 'absolute', left: '50%', top: '50%',
                      transform: `translate3d(${startX}px, ${startY}px, ${currentZ}px) rotate(${rRot}deg)`,
                      zIndex: Math.floor(currentZ),
                      filter: `blur(${depthBlur}px)`
                    }}>
                      <div style={{
                        backgroundColor: '#fff', padding: '10px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                      }}>
                        <Img src={getAsset(evt.local_path)} style={{ maxHeight: '350px', objectFit: 'cover' }} />
                      </div>
                    </div>
                  </Sequence>
                );
              });
            }

            return null;
          })}

        </div>
      </AbsoluteFill>
      
      {/* GLOBAL IMPACT LAYER */}
      <CinematicParticles baseSize={4} count={20} drift="up" glowColor={theme.accentColor} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.9) 100%)', mixBlendMode: 'multiply' }} />
    </AbsoluteFill>
  );
};
