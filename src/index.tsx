import { AbsoluteFill, Sequence, Img, Audio, useVideoConfig, useCurrentFrame, staticFile, registerRoot, Composition, interpolate, spring, Easing, random as seededRandom } from 'remotion';
import { noise2D } from '@remotion/noise';
import React, { createContext, useContext, useMemo } from 'react';
import masterJsonRaw from '../master_timeline.json';

import { LayoutRouter, SmartMedia } from './components/Layouts';
import { TypographyRouter } from './components/Typography';
import { MotionGraphicsRouter } from './components/MotionGraphics';
import { EffectsDirector } from './components/Effects';

export const CameraContext = createContext({ xPan: 0, yPan: 0, zScale: 1 });
export const useCamera = () => useContext(CameraContext);

const getParallaxMultiplier = (role: string, depth: number) => {
    if (role === 'background') return 0.2;
    if (role === 'hero') return 1.0;
    if (role === 'foreground') return 1.5;
    return Math.max(0.1, 1 - ((depth || 10) / 100));
};

const rawAny = masterJsonRaw as any;
const normalisedTimeline = (rawAny.timeline ?? []).map((s: any) => s).filter(Boolean);

const masterJson: any = {
  ...rawAny,
  timeline: normalisedTimeline,
};

// ==========================================
// THE EDITORIAL DIRECTOR
// ==========================================
const getEditorialVariants = (scene: any, sceneIndex: number) => {
      return {
        layout: scene.layout_variant || 1,
        captionEnabled: scene.captions?.enabled !== false,
        captionPreset: 'Documentary',
        lighting: scene.effects_theme || 'none',
        particles: scene.effects_theme || 'none',
        cameraSpeed: scene.camera_focus === 'hero' ? 'slow' : 'medium',
        colorGrade: scene.color_temp === 'warm' ? '#D4AF37' : '#FFFFFF',
        energy: scene.energy || 5,
      };
  };

// 1. Global Camera Engine (Replaces Virtual3DCamera inside scenes)
const GlobalCameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const timeSec = frame / fps;

    // Generate a continuous global path from scene data
    const globalPath = useMemo(() => {
        let pts: any[] = [];
        masterJson.timeline.forEach((scene: any, i: number) => {
            const sTime = (scene.timing?.start_ms || (i * 3000)) / 1000;
            // Generate deterministic but dynamic waypoints to interpolate through
            pts.push({ 
                t: sTime, 
                x: (Math.sin(i * 1.5) * 60), 
                y: (Math.cos(i * 1.2) * 40), 
                z: 1.0 + (i * 0.05) 
            });
        });
        // Add an end point
        pts.push({ t: 9999, x: 0, y: 0, z: 2.0 });
        return pts;
    }, []);

    let xPan = 0, yPan = 0, zScale = 1;
    if (globalPath.length > 0) {
        const currentIdx = Math.max(0, globalPath.findIndex(p => p.t > timeSec) - 1);
        const current = globalPath[currentIdx];
        const next = globalPath[currentIdx + 1] || current;
        
        if (next && current && next.t > current.t) {
            // Easing to make momentum feel natural and cinematic (MagnatesMedia style)
            const rawProgress = (timeSec - current.t) / (next.t - current.t);
            const progress = Easing.inOut(Easing.quad)(rawProgress);
            xPan = interpolate(progress, [0, 1], [current.x, next.x]);
            yPan = interpolate(progress, [0, 1], [current.y, next.y]);
            zScale = interpolate(progress, [0, 1], [current.z, next.z]);
        } else {
            xPan = current.x; yPan = current.y; zScale = current.z;
        }
    }

    const breathScale = 1.0 + Math.sin(frame * 0.05) * 0.015;
    const finalScale = zScale * breathScale;

    return (
        <CameraContext.Provider value={{ xPan, yPan, zScale: finalScale }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', backgroundColor: '#000' }}>
                {children}
            </div>
        </CameraContext.Provider>
    );
};

const getTreatmentCSS = (treatment: string) => {
  switch(treatment) {
    case 'black_and_white_halftone':
      return { filter: 'grayscale(100%) contrast(200%) brightness(80%)', mixBlendMode: 'multiply' as any };
    case 'neon_green_texture':
      return { filter: 'drop-shadow(0 0 15px #15FF00) hue-rotate(90deg) saturate(300%)' };
    case 'high_contrast_silhouette':
      return { filter: 'brightness(0) drop-shadow(0 10px 20px rgba(0,0,0,0.8))' };
    case 'duotone':
      return { filter: 'grayscale(100%) sepia(100%) hue-rotate(180deg) saturate(400%)' };
    default:
      return { filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))' };
  }
};

const DynamicElement = ({ src, duration, motion, continuousMotion, delay, treatment, depth, transformOrigin, composition, role, focus }: any) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const camera = useCamera(); 
  
  const isEntering = frame >= delay;
  const activeFrame = isEntering ? frame - delay : 0;
  
  const springProgress = spring({ frame: activeFrame, fps, config: { damping: 14, stiffness: 80, mass: 1.5 } });

  let enterX = 0, enterY = 0, enterScale = 1;
  if (motion?.enter === 'left') enterX = interpolate(springProgress, [0, 1], [-1920, 0]);
  if (motion?.enter === 'right') enterX = interpolate(springProgress, [0, 1], [1920, 0]);
  if (motion?.enter === 'bottom') enterY = interpolate(springProgress, [0, 1], [1080, 0]);
  if (motion?.enter === 'top') enterY = interpolate(springProgress, [0, 1], [-1080, 0]);
  if (motion?.enter === 'pop' || (!motion?.enter)) enterScale = interpolate(springProgress, [0, 1], [0, 1]);

  let driftX = continuousMotion?.type === 'drift_left' ? -activeFrame * (continuousMotion?.speed === 'slow' ? 0.5 : 2) : 0;
  let driftY = continuousMotion?.type === 'bob' ? Math.sin(activeFrame * 0.05) * 20 : 0;
  
  let rotation = continuousMotion?.type === 'bob' ? Math.cos(activeFrame * 0.02) * 2 : 0;
  if (role === 'document' || role === 'paper') rotation += Math.sin(activeFrame * 0.03) * 1.5;
  if (role === 'money') rotation += Math.cos(activeFrame * 0.08) * 5;

  const treatmentStyles = getTreatmentCSS(treatment);

  const coverage = composition?.screen_coverage || 0.4;
  const sizePct = Math.min(100, Math.sqrt(coverage) * 100);
  
  const posStyles: React.CSSProperties = { 
     justifyContent: 'center', 
     alignItems: 'center',
     padding: composition?.safe_margin ? `${composition.safe_margin}px` : '0px'
  };
  
  if (composition?.anchor === 'bottom_right') { posStyles.justifyContent = 'flex-end'; posStyles.alignItems = 'flex-end'; }
  else if (composition?.anchor === 'bottom_left') { posStyles.justifyContent = 'flex-start'; posStyles.alignItems = 'flex-end'; }
  else if (composition?.anchor === 'top_right') { posStyles.justifyContent = 'flex-end'; posStyles.alignItems = 'flex-start'; }
  else if (composition?.anchor === 'top_left') { posStyles.justifyContent = 'flex-start'; posStyles.alignItems = 'flex-start'; }
  else if (composition?.anchor === 'left') { posStyles.justifyContent = 'flex-start'; posStyles.alignItems = 'center'; }
  else if (composition?.anchor === 'right') { posStyles.justifyContent = 'flex-end'; posStyles.alignItems = 'center'; }

  const pMult = getParallaxMultiplier(role, depth || 10);
  const parallaxX = camera.xPan * pMult;
  const parallaxY = camera.yPan * pMult;
  const parallaxScale = 1.0 + ((camera.zScale - 1.0) * pMult); 

  let blurStr = 'none';
  if (focus === 'hero' && role !== 'hero' && depth < 500) {
      blurStr = 'blur(4px)';
  } else if (focus === 'background' && role !== 'background') {
      blurStr = 'blur(6px)';
  }

  return (
    <AbsoluteFill style={{ zIndex: depth || 10, pointerEvents: 'none', opacity: isEntering ? 1 : 0, ...posStyles }}>
      <SmartMedia 
        src={src} 
        style={{ 
          transformOrigin: transformOrigin || 'center',
          transform: `translate3d(${enterX + driftX + parallaxX}px, ${enterY + driftY + parallaxY}px, 0px) scale(${enterScale * parallaxScale}) rotate(${rotation}deg)`, 
          width: `${sizePct}%`, 
          height: `${sizePct}%`, 
          objectFit: composition?.fit || 'contain',
          filter: blurStr,
          ...treatmentStyles
        }} 
      />
    </AbsoluteFill>
  );
};

const CaptionDirector = ({ words, sceneIndex, variants, sceneStartMs }: any) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const camera = useCamera(); 
    
    if (!words || words.length === 0) return null;

    const timeMs = (frame / fps) * 1000 + (sceneStartMs || 0);

    // 1. Chunk words (1-4 words per chunk)
    const chunks = React.useMemo(() => {
        const result = [];
        let currentChunk: any[] = [];
        for (let i = 0; i < words.length; i++) {
            currentChunk.push(words[i]);
            
            // Break if chunk has 3+ words, or if it's the end of a sentence
            const lastWord = words[i].word;
            const isEndOfSentence = /[.!?]/.test(lastWord);
            
            if (currentChunk.length >= 3 || isEndOfSentence || i === words.length - 1) {
                result.push({
                    words: currentChunk,
                    start_ms: currentChunk[0].start_ms,
                    end_ms: currentChunk[currentChunk.length - 1].end_ms
                });
                currentChunk = [];
            }
        }
        return result;
    }, [words]);

    // 2. Find active chunk (with 100ms pre-roll)
    const preRollMs = 100;
    const activeChunkIdx = chunks.findIndex(c => timeMs >= (c.start_ms - preRollMs) && timeMs <= c.end_ms);
    
    if (activeChunkIdx === -1) return null;
    const activeChunk = chunks[activeChunkIdx];

    // 3. Fixed Documentary Positioning
    const positionStyle = { bottom: '8%', left: '50%', transform: 'translate(-50%, 0)', justifyContent: 'center' };

    // 4. Subtle Animation (Fade In)
    const chunkRelativeStartMs = activeChunk.start_ms - preRollMs - (sceneStartMs || 0);
    const cStartFrame = (chunkRelativeStartMs / 1000) * fps;
    const activeFrame = Math.max(0, frame - cStartFrame);
    
    // Soft fade in over 5 frames
    const opacity = interpolate(activeFrame, [0, 5], [0, 1], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
           <style>
               {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap');`}
           </style>
           <div style={{
               position: 'absolute', 
               ...positionStyle,
               display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
               width: '80%', gap: '15px',
               opacity: opacity
           }}>
               {activeChunk.words.map((w: any, i: number) => {
                  const isCurrent = timeMs >= w.start_ms && timeMs <= w.end_ms;
                  // Keep punctuation for natural reading flow in standard captions
                  const cleanW = w.word;

                  return (
                      <span key={w.start_ms + i} style={{
                          display: 'inline-block',
                          fontFamily: '"Inter", sans-serif',
                          fontSize: '48px',
                          fontWeight: 600,
                          color: isCurrent ? '#FFD700' : '#FFFFFF', // Highlight current word in gold
                          textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px 4px 15px rgba(0,0,0,0.8), 0px 0px 30px rgba(0,0,0,0.5)',
                          transition: 'color 0.1s ease-out',
                      }}>
                          {cleanW}
                      </span>
                  );
              })}
           </div>
        </AbsoluteFill>
    );
};


const CinematicOverlay = ({ src, durationInFrames }: { src: string, durationInFrames: number }) => {
    const frame = useCurrentFrame();
    
    // Smooth fade in over half a second
    const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
    
    // Slow cinematic zoom - gently scale slightly more
    const scale = interpolate(frame, [0, durationInFrames], [1.05, 1.18]);
    
    // 3D parallax tilt (drifting slowly across the scene)
    const rotateX = Math.sin(frame * 0.02) * 4; // -4 to 4 degrees
    const rotateY = Math.cos(frame * 0.02) * 5; // -5 to 5 degrees
    
    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', perspective: 1000, pointerEvents: 'none', zIndex: 50 }}>
            <Img 
                src={staticFile(src)} 
                style={{
                    maxWidth: '70%', 
                    maxHeight: '70%', 
                    objectFit: 'contain',
                    opacity: opacity,
                    transform: `scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                    boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                    borderRadius: '8px'
                }} 
            />
        </AbsoluteFill>
    );
};

const AutomatedDocumentary = () => {
  const { fps } = useVideoConfig();
  const msToFrames = (ms: number) => Math.round((ms / 1000) * fps);

  // Determine global frame positioning for absolute sequences
  const mappedScenes = masterJson.timeline.map((scene: any, i: number) => {
      // Exact absolute timing from Whisper
      const startMs = scene.timing?.start_ms || (i * 3000);
      const audioDurMs = scene.timing?.duration_ms || 3000;
      
      const startFrame = msToFrames(startMs);
      const audioDurFrames = msToFrames(audioDurMs);
      
      // Look ahead to the next scene to prevent 1-frame rounding gaps
      let visualDurFrames = audioDurFrames;
      if (i < masterJson.timeline.length - 1) {
          const nextStartMs = masterJson.timeline[i+1].timing?.start_ms || ((i+1) * 3000);
          const nextStartFrame = msToFrames(nextStartMs);
          visualDurFrames = nextStartFrame - startFrame;
      }
      
      // Cut Director Variables
      const cutStyle = scene.applied_cut_style || 'l_cut';
      const overlapFrames = 0; // Disabled forced drift to keep perfect absolute sync
      
      return {
          ...scene,
          startFrame,
          visualDurFrames,
          audioDurFrames,
          overlapFrames,
          cutStyle,
          isEven: i % 2 === 0,
          editorialVariants: getEditorialVariants(scene, i)
      };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <GlobalCameraProvider>
         
         {/* 6. Decoupled Audio & Visual Timeline */}
         {mappedScenes.map((scene: any, index: number) => {
            
            return (
               <React.Fragment key={scene.scene_id || index}>
                  
                  {/* VISUAL SEQUENCE */}
                  <Sequence from={scene.startFrame} durationInFrames={scene.visualDurFrames}>
                     <AbsoluteFill>
                        
                        {/* 4. Focus Pull (Cross-Focus Cut Dynamics) */}
                        <div style={{
                           position: 'absolute', inset: 0, 
                           animationName: scene.cutStyle === 'split_cut' ? 'none' : 'crossFocus',
                           animationDuration: `${scene.overlapFrames / fps}s`
                        }}>
                           <div style={{
                               position: 'absolute', inset: 0,
                               animationName: scene.overlay_image ? 'slowZoomBg' : 'none',
                               animationDuration: `${scene.visualDurFrames / fps}s`,
                               animationTimingFunction: 'linear',
                               animationFillMode: 'forwards'
                           }}>
                               <LayoutRouter scene={scene} duration={scene.visualDurFrames} isEven={scene.isEven} variants={scene.editorialVariants} />
                           </div>
                           
                             {/* Foreground cutouts */}
                             <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
                               {scene.visual_elements?.map((el: any, elIdx: number) => {
                                 const mPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
                                 const mediaPath = mPaths[elIdx];
                                 if (el.role && el.role !== 'background' && el.role !== 'video' && mediaPath && !mediaPath.endsWith('.mp4')) {
                                    const assetName = mediaPath.split(/[/\\]/).pop();
                                    const staggerDelay = Math.round((scene.stagger || 0) * fps * elIdx);
                                    return <DynamicElement key={`fg-${elIdx}`} src={staticFile(mediaPath)} duration={scene.visualDurFrames} motion={el.motion} continuousMotion={el.continuous_motion} delay={staggerDelay} treatment={el.treatment} depth={el.depth} transformOrigin={el.transform_origin} composition={el.composition} role={el.role} focus={scene.focus} />;
                                 }
                                 return null;
                               })}
                             </div>
                        </div>

                        {/* Effects & Post FX overrides managed by Editorial Director */}
                        <EffectsDirector variants={scene.editorialVariants} events={scene.events} />
                        <Sequence from={0} durationInFrames={Math.max(1, scene.audioDurFrames - scene.overlapFrames)}>
                            <MotionGraphicsRouter graphics={scene.graphics} sceneIndex={index} variants={scene.editorialVariants} />
                        </Sequence>
                        
                        {scene.overlay_image && (
                            <CinematicOverlay src={scene.overlay_image} durationInFrames={scene.visualDurFrames} />
                        )}
                        
                        {scene.words && scene.words.length > 0 && scene.editorialVariants?.captionEnabled !== false && (!scene.graphics || scene.graphics.graphics_type === 'none') && (
                            <CaptionDirector 
                                words={scene.words} 
                                sceneIndex={index} 
                                variants={scene.editorialVariants} 
                                sceneStartMs={scene.timing?.start_ms || (index * 3000)}
                            />
                        )}
                     </AbsoluteFill>
                  </Sequence>

                  {/* DECOUPLED AUDIO SEQUENCE (Allows exact J/L overlapping independently of visual duration) */}
                  <Sequence from={scene.startFrame} durationInFrames={scene.audioDurFrames}>
                      {/* Sub-scene audio triggers go here, master audio handles voiceover */}
                  </Sequence>
               </React.Fragment>
            );
         })}
      </GlobalCameraProvider>
      
      {/* Inline styles for cross-focus animation engine */}
      <style>{`
          @keyframes crossFocus {
             0% { filter: blur(20px); opacity: 0; }
             100% { filter: blur(0px); opacity: 1; }
          }
          @keyframes slowZoomBg {
             0% { transform: scale(1.0); filter: blur(0px); }
             15% { filter: blur(6px); }
             100% { transform: scale(1.15); filter: blur(8px); }
          }
      `}</style>
    </AbsoluteFill>
  );
};

const RemotionRoot = () => {
  const totalFrames = Math.max(1, Math.round(((masterJson.metadata?.total_duration_ms || 10000) / 1000) * 30)) + 60;
  return <Composition id="AutomatedDocumentary" component={AutomatedDocumentary} durationInFrames={totalFrames} fps={30} width={1920} height={1080} />;
};

registerRoot(RemotionRoot);
