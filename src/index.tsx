import { AbsoluteFill, Sequence, Img, Audio, useVideoConfig, useCurrentFrame, staticFile as remotionStaticFile, registerRoot, Composition, interpolate, spring, Easing, random as seededRandom, Freeze } from 'remotion';
const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const staticFile = (path: string) => {
    if (!path || typeof path !== 'string') return TRANSPARENT_PIXEL;
    let cleanPath = path.replace(/^\/?public\//, '');
    if (cleanPath.trim() === '' || cleanPath.endsWith('/')) return TRANSPARENT_PIXEL;
    try { cleanPath = decodeURIComponent(cleanPath); } catch(e) {}
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
import { MonolithEngine } from './components/MonolithEngine';
import { DioramaCanvas } from './components/Diorama';
import { GlobalFinisher } from './components/GlobalFinisher';
import { CinematicChapterReveal } from './components/CinematicChapterReveal';
import { ZAxisCrashTransition } from './components/transition1';
import { SpatialWhipTransition } from './components/transition2';
import { ThermalFlareTransition } from './components/transition3';
import { RackToBlackTransition } from './components/transition4';


export const useCamera = () => ({ xPan: 0, yPan: 0, zScale: 1.0 });

const getParallaxMultiplier = (role: string, depth: number) => {
    if (role === 'background') return 0.2;
    if (role === 'hero') return 1.0;
    if (role === 'foreground') return 1.5;
    return Math.max(0.1, 1 - ((depth || 10) / 100));
};

const rawAny = masterJsonRaw as any;
const normalisedTimeline = (rawAny.timeline ?? []).map((s: any) => s).filter(Boolean);


// ==========================================
// TRANSITION ROTATION ENGINE
// ==========================================
const transitionPool = ['ZAxisCrash', 'SpatialWhip', 'ThermalFlare', 'RackToBlack'];
let activePool = [...transitionPool];

const shuffle = (array, seedStr) => {
    let currentIndex = array.length, randomIndex;
    let seedOffset = 0;
    while (currentIndex != 0) {
        randomIndex = Math.floor(seededRandom(seedStr + seedOffset) * currentIndex);
        seedOffset++;
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

const videoSeed = masterJsonRaw?.channel || 'default_video';
activePool = shuffle([...transitionPool], videoSeed);
let transitionIndex = 0;

normalisedTimeline.forEach((scene, i) => {
    const words = scene.words || [];
    const lastWord = words.length > 0 ? words[words.length - 1].word : '';
    const isEndOfPara = lastWord.endsWith('.') || lastWord.endsWith('?') || lastWord.endsWith('!');
    
    if (isEndOfPara) {
        scene.outgoingTransition = activePool[transitionIndex];
        transitionIndex++;
        if (transitionIndex >= activePool.length) {
            activePool = shuffle([...transitionPool], videoSeed + "_cycle_" + i);
            transitionIndex = 0;
        }
    } else {
        scene.outgoingTransition = 'none';
    }
});

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
          ...treatmentStyles,
          filter: blurStr,
        }} 
      />
    </AbsoluteFill>
  );
};


const CinematicOverlay = ({ src, durationInFrames }: { src: string, durationInFrames: number }) => {
    if (!src) return null;
    const frame = useCurrentFrame();
    const safeDuration = Number(durationInFrames) || 150;
    
    // Smooth fade in over half a second
    const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
    
    // Slow cinematic zoom - gently scale slightly more
    const scale = interpolate(frame, [0, safeDuration], [1.05, 1.18]);
    
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


const SceneContent = ({ scene, index }: any) => {
    const { fps } = useVideoConfig();
    return (
        <AbsoluteFill>
            {/* VISUAL ROUTING ENGINE */}
            {(scene.scene_type === 'monolith') ? (
                <MonolithEngine payload={{...(scene.monolith_payload || {}), bgVideoSrc: scene.media_paths?.[0] ? staticFile(scene.media_paths[0]) : '', assetSrc: scene.monolith_payload?.assetSrc ? staticFile(scene.monolith_payload.assetSrc) : ''}} />
            ) : (scene.scene_type === 'topic_reveal') ? (
                <DioramaCanvas payload={{
                    ...(scene.diorama_payload || {}),
                    actualDurationFrames: scene.visualDurFrames,
                    bgVideoSrc: scene.media_paths?.[0] ? staticFile(scene.media_paths[0]) : '',
                    subjects: (scene.diorama_payload?.subjects || []).map((sub: any, i: number) => {
                        // visual.assets holds the downloaded subject images (index-matched to subjects)
                        const asset = (scene.visual?.assets || [])[i];
                        const resolvedImg = asset?.local_path || sub.imageUrl || '';
                        return {
                            ...sub,
                            imageUrl: resolvedImg,
                            // carry trigger timing so cards reveal on spoken word
                            trigger_frame: asset?.trigger_frame ?? (i * 10),
                            trigger_start_ms: asset?.trigger_start_ms,
                        };
                    }),
                    text: scene.diorama_payload?.text || [],
                }} />
            ) : (scene.scene_type === 'chapter_reveal') ? (
                <CinematicChapterReveal chapterNumber={scene.chapter_payload?.chapterNumber || 1} subtitle={scene.chapter_payload?.subtitle || ""} bgImgUrl={scene.visual?.assets?.find((a:any) => a.role === 'bg_chapter')?.local_path || ""} leftAssetUrl={scene.visual?.assets?.find((a:any) => a.role === 'left_chapter')?.local_path || ""} rightAssetUrl={scene.visual?.assets?.find((a:any) => a.role === 'right_chapter')?.local_path || ""} />
            ) : (scene.scene_type === 'dynamic_grid' || scene.visual?.scene_type === 'dynamic_grid') ? (
                <DynamicLiquidGrid bgVideoUrl={scene.media_paths?.[0] || scene.media_path || ''} assets={(scene.visual?.assets || scene.assets || []).filter((a: any) => a.layer !== 'background' && a.type !== 'video').map((a: any, idx: number) => ({url: a.local_path || a.downloaded_path || '', title: a.title || '', subtitle: a.subtitle || '', trigger_frame: a.trigger_start_ms ? Math.round(((a.trigger_start_ms - (scene.timing?.start_ms || 0)) / 1000) * fps) : (a.trigger_frame ?? (idx === 0 ? 0 : 9999))}))} />
            ) : (
                <div style={{ position: 'absolute', inset: 0, animationName: scene.cutStyle === 'split_cut' ? 'none' : 'crossFocus', animationDuration: `${scene.overlapFrames / fps}s` }}>
                    <div style={{ position: 'absolute', inset: 0, animationName: scene.overlay_image ? 'slowZoomBg' : 'none', animationDuration: `${scene.visualDurFrames / fps}s`, animationTimingFunction: 'linear', animationFillMode: 'forwards' }}>
                        <LayoutRouter scene={scene} duration={scene.visualDurFrames} isEven={scene.isEven} variants={scene.editorialVariants} />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
                        {scene.visual_elements?.map((el: any, elIdx: number) => {
                            const mediaPath = (scene.media_paths || (scene.media_path ? [scene.media_path] : []))[elIdx];
                            if (el.role && el.role !== 'background' && el.role !== 'video' && mediaPath && !mediaPath.endsWith('.mp4')) {
                                return <DynamicElement key={`fg-${elIdx}`} src={staticFile(mediaPath)} duration={scene.visualDurFrames} motion={el.motion} continuousMotion={el.continuous_motion} delay={Math.round((scene.stagger || 0) * fps * elIdx)} treatment={el.treatment} depth={el.depth} transformOrigin={el.transform_origin} composition={el.composition} role={el.role} focus={scene.focus} />;
                            }
                            return null;
                        })}
                    </div>
                </div>
            )}
            <EffectsDirector variants={scene.editorialVariants} events={scene.events} />
            <Sequence from={0} durationInFrames={Math.max(1, scene.audioDurFrames - scene.overlapFrames)}>
                {scene.graphics && scene.graphics.graphics_type && scene.graphics.graphics_type !== 'none' ? <MotionGraphicsRouter graphics={{...scene.graphics, trigger_frame: scene.graphics.trigger_start_ms ? Math.round(((scene.graphics.trigger_start_ms - scene.timing.start_ms) / 1000) * fps) : scene.graphics.trigger_frame}} sceneIndex={index} variants={scene.editorialVariants} durationInFrames={Math.max(1, scene.audioDurFrames - scene.overlapFrames)} /> : null}
            </Sequence>
            {scene.overlay_image && (
                <Sequence from={Math.floor((Math.max(0, (scene.overlay_start_ms || scene.timing.start_ms) - scene.timing.start_ms) / 1000) * fps)} durationInFrames={Math.max(1, scene.visualDurFrames - Math.floor((Math.max(0, (scene.overlay_start_ms || scene.timing.start_ms) - scene.timing.start_ms) / 1000) * fps))}>
                    <CinematicOverlay src={scene.overlay_image} durationInFrames={Math.max(1, scene.visualDurFrames - Math.floor((Math.max(0, (scene.overlay_start_ms || scene.timing.start_ms) - scene.timing.start_ms) / 1000) * fps))} />
                </Sequence>
            )}
            {scene.words && scene.words.length > 0 && scene.editorialVariants?.captionEnabled !== false && scene.scene_type !== 'topic_reveal' && scene.scene_type !== 'monolith' && (!scene.diorama_payload || Object.keys(scene.diorama_payload).length === 0) && (!scene.monolith_payload || Object.keys(scene.monolith_payload).length === 0) && (scene.caption_preset || scene.visual?.caption_preset) !== 'none' && (
                <CaptionDirector scene={scene} />
            )}
        </AbsoluteFill>
    );
};

const TransitionSceneA = ({ scene, index }: any) => {
    return (
        <Sequence from={15 - scene.visualDurFrames} layout="none">
            <SceneContent scene={scene} index={index} />
        </Sequence>
    );
};

const TransitionSceneB = ({ scene, index }: any) => {
    return (
        <AbsoluteFill>
            <Sequence durationInFrames={15} layout="none">
                <Freeze frame={0}>
                    <SceneContent scene={scene} index={index} />
                </Freeze>
            </Sequence>
            <Sequence from={15} layout="none">
                <SceneContent scene={scene} index={index} />
            </Sequence>
        </AbsoluteFill>
    );
};

const AutomatedDocumentary = () => {
  const { fps } = useVideoConfig();
  const msToFrames = (ms: number) => Math.round((ms / 1000) * fps);

  // Determine global frame positioning for absolute sequences
  let activeGraphicUntil = 0;
    const mappedScenes = masterJson.timeline.map((scene: any, i: number) => {
      // Exact absolute timing from Whisper
      const startMs = scene.timing?.start_ms || (i * 3000);
      const audioDurMs = scene.timing?.duration_ms || 3000;
      
      const startFrame = Math.max(0, msToFrames(startMs));
      const audioDurFrames = Math.max(1, msToFrames(audioDurMs));
      
      // Look ahead to the next scene to prevent 1-frame rounding gaps
      let visualDurFrames = audioDurFrames;
      if (i < masterJson.timeline.length - 1) {
          const nextStartMs = masterJson.timeline[i+1].timing?.start_ms || ((i+1) * 3000);
          const nextStartFrame = Math.max(0, msToFrames(nextStartMs));
          visualDurFrames = Math.max(1, nextStartFrame - startFrame);
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
                      <SceneContent scene={scene} index={index} />
                  </Sequence>

                  {/* CUSTOM TRANSITION ROUTER */}
                  {scene.outgoingTransition && scene.outgoingTransition !== 'none' && mappedScenes[index + 1] && (
                      <Sequence 
                          from={scene.startFrame + scene.visualDurFrames - 15} 
                          durationInFrames={30}
                          style={{ zIndex: 9999 }}
                      >
                          {scene.outgoingTransition === 'ZAxisCrash' && (
                              <ZAxisCrashTransition SceneA={<TransitionSceneA scene={scene} index={index} />} SceneB={<TransitionSceneB scene={mappedScenes[index + 1]} index={index + 1} />} durationInFrames={30} />
                          )}
                          {scene.outgoingTransition === 'SpatialWhip' && (
                              <SpatialWhipTransition SceneA={<TransitionSceneA scene={scene} index={index} />} SceneB={<TransitionSceneB scene={mappedScenes[index + 1]} index={index + 1} />} durationInFrames={30} />
                          )}
                          {scene.outgoingTransition === 'ThermalFlare' && (
                              <ThermalFlareTransition SceneA={<TransitionSceneA scene={scene} index={index} />} SceneB={<TransitionSceneB scene={mappedScenes[index + 1]} index={index + 1} />} durationInFrames={30} />
                          )}
                          {scene.outgoingTransition === 'RackToBlack' && (
                              <RackToBlackTransition SceneA={<TransitionSceneA scene={scene} index={index} />} SceneB={<TransitionSceneB scene={mappedScenes[index + 1]} index={index + 1} />} durationInFrames={30} />
                          )}
                      </Sequence>
                  )}

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
  // meta.total_duration_ms can be stale when chapter reveals add 5000ms each but the
  // merged master_timeline.json carries the pre-chapter-reveal value from the PREP phase.
  // Always derive from the actual last scene end so the composition is never truncated.
  const metaDurationMs = masterJson.meta?.total_duration_ms || masterJson.metadata?.total_duration_ms || 0;
  const lastSceneEndMs = masterJson.timeline?.length
    ? Math.max(...masterJson.timeline.map((s: any) =>
        (s.timing?.start_ms || 0) + (s.timing?.duration_ms || 0)
      ))
    : 0;
  const totalDurationMs = Math.max(metaDurationMs, lastSceneEndMs, 10000);
  const totalFrames = Math.max(1, Math.round((totalDurationMs / 1000) * 30)) + 60;
  return <Composition id="AutomatedDocumentary" component={AutomatedDocumentary} durationInFrames={totalFrames} fps={30} width={1920} height={1080} />;
};

registerRoot(RemotionRoot);
