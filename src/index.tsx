import { AbsoluteFill, Sequence, Img, Audio, useVideoConfig, useCurrentFrame, staticFile as remotionStaticFile, registerRoot, Composition, interpolate, spring, Easing, random as seededRandom } from 'remotion';
const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const staticFile = (path: string) => {
    if (!path || typeof path !== 'string') return TRANSPARENT_PIXEL;
    const cleanPath = path.startsWith('public/') ? path.slice(7) : path;
    if (cleanPath.trim() === '' || cleanPath.endsWith('/')) return TRANSPARENT_PIXEL;
    return remotionStaticFile(cleanPath);
};
import { noise2D } from '@remotion/noise';
import React, { createContext, useContext, useMemo } from 'react';
import masterJsonRaw from '../master_timeline.json';

import { LayoutRouter, SmartMedia } from './components/Layouts';
import { TypographyRouter } from './components/Typography';
import { MotionGraphicsRouter } from './components/MotionGraphics';
import { EffectsDirector } from './components/Effects';
import { CaptionDirector } from './components/CaptionDirector';
import { DynamicLiquidGrid } from './components/DynamicLiquidGrid';
import { DioramaCanvas } from './components/Diorama';
import { GlobalFinisher } from './components/GlobalFinisher';

export const useCamera = () => ({ xPan: 0, yPan: 0, zScale: 1.0 });

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
        captionPreset: scene.caption_preset || scene.visual?.caption_preset || 'GlassPill',
        lighting: scene.effects_theme || 'none',
        particles: scene.effects_theme || 'none',
        cameraSpeed: scene.camera_focus === 'hero' ? 'slow' : 'medium',
        colorGrade: scene.color_temp === 'warm' ? '#D4AF37' : '#FFFFFF',
        energy: scene.energy || 5,
      };
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
  const parallaxX = 0;
  const parallaxY = 0;
  const parallaxScale = 1.0; 

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


const CinematicOverlay = ({ src, durationInFrames }: { src: string, durationInFrames: number }) => {
    if (!src) return null;
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
    <GlobalFinisher>
      <AbsoluteFill style={{ backgroundColor: '#000' }}>
         
         {/* 6. Decoupled Audio & Visual Timeline */}
         {mappedScenes.map((scene: any, index: number) => {
            
            return (
               <React.Fragment key={scene.scene_id || index}>
                  
                  {/* VISUAL SEQUENCE */}
                  <Sequence from={scene.startFrame} durationInFrames={scene.visualDurFrames}>
                     <AbsoluteFill>
                        
                        {/* VISUAL ROUTING ENGINE */}
                        {(scene.scene_type === 'topic_reveal') ? (
                            /* TOPIC REVEAL DIORAMA (Liquid Glass Parallax Engine) */
                            <DioramaCanvas
                                payload={{
                                    ...(scene.diorama_payload || {}),
                                    bgVideoSrc: scene.media_paths?.[0] ? staticFile(scene.media_paths[0]) : '',
                                }}
                            />
                        ) : (scene.scene_type === 'dynamic_grid' || scene.visual?.scene_type === 'dynamic_grid') ? (
                            /* DYNAMIC LIQUID GRID (for specific/comparison scenes) */
                            <DynamicLiquidGrid
                                bgVideoUrl={scene.media_paths?.[0] || scene.media_path || ''}
                                assets={(scene.visual?.assets || scene.assets || []).filter((a: any) => a.layer !== 'background' && a.type !== 'video').map((a: any, idx: number) => ({
                                    // overlay_downloader.py writes to a.local_path
                                    // a.trigger_start_ms is set by The_Brain word alignment (precise WhisperX ms)
                                    // a.trigger_frame is the AI's estimated fallback
                                    url: a.local_path || a.downloaded_path || '',
                                    title: a.title || '',
                                    subtitle: a.subtitle || '',
                                    trigger_frame: a.trigger_start_ms
                                        ? Math.round(((a.trigger_start_ms - (scene.timing?.start_ms || 0)) / 1000) * fps)
                                        : (a.trigger_frame ?? (idx === 0 ? 0 : 9999))
                                }))}
                            />
                        ) : (
                            /* STANDARD LAYOUT (for vibe/data scenes) */
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
                                        const staggerDelay = Math.round((scene.stagger || 0) * fps * elIdx);
                                        return <DynamicElement key={`fg-${elIdx}`} src={staticFile(mediaPath)} duration={scene.visualDurFrames} motion={el.motion} continuousMotion={el.continuous_motion} delay={staggerDelay} treatment={el.treatment} depth={el.depth} transformOrigin={el.transform_origin} composition={el.composition} role={el.role} focus={scene.focus} />;
                                     }
                                     return null;
                                   })}
                                 </div>
                            </div>
                        )}

                        {/* Effects & Post FX overrides managed by Editorial Director */}
                        <EffectsDirector variants={scene.editorialVariants} events={scene.events} />
                        <Sequence from={0} durationInFrames={Math.max(1, scene.audioDurFrames - scene.overlapFrames)}>
                            <MotionGraphicsRouter graphics={scene.graphics} sceneIndex={index} variants={scene.editorialVariants} />
                        </Sequence>
                        
                        {scene.overlay_image && (() => {
                              // If Gemini aligned the overlay to a specific trigger word, we delay the animation
                              const overlayStartMs = scene.overlay_start_ms || scene.timing.start_ms;
                              const delayMs = Math.max(0, overlayStartMs - scene.timing.start_ms);
                              const delayFrames = Math.floor((delayMs / 1000) * fps);
                              const actualDur = Math.max(1, scene.visualDurFrames - delayFrames);
                              
                              return (
                                  <Sequence from={delayFrames} durationInFrames={actualDur}>
                                      <CinematicOverlay src={scene.overlay_image} durationInFrames={actualDur} />
                                  </Sequence>
                              );
                          })()}
                        
                        {scene.words && scene.words.length > 0 && scene.editorialVariants?.captionEnabled !== false && (scene.caption_preset || scene.visual?.caption_preset) !== 'none' && (!scene.graphics || scene.graphics.graphics_type === 'none') && (
                            <CaptionDirector scene={scene} />
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
      </AbsoluteFill>
      
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
    </GlobalFinisher>
  );
};

const RemotionRoot = () => {
  const totalDurationMs = masterJson.meta?.total_duration_ms || masterJson.metadata?.total_duration_ms || 10000;
  const totalFrames = Math.max(1, Math.round((totalDurationMs / 1000) * 30)) + 60;
  return <Composition id="AutomatedDocumentary" component={AutomatedDocumentary} durationInFrames={totalFrames} fps={30} width={1920} height={1080} />;
};

registerRoot(RemotionRoot);
