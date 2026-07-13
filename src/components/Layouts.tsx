import { AbsoluteFill, useCurrentFrame, staticFile, Img as RemotionImg, OffthreadVideo, interpolate, spring, useVideoConfig, Audio, Sequence } from 'remotion';
import React from 'react';
import { useCamera } from '../index';
import { VolumetricDust, FilmGrain, HeavySmoke, LensFlare, WindowLight, EdgeGlow, LightRays, GlassReflection, DustBurst } from './Effects';


export const SmartMedia: React.FC<{ src: string, style?: any, className?: string, [key: string]: any }> = ({ src, style, className, ...props }) => {
  if (!src || src.trim() === '') return null;
  const lower = src.toLowerCase();
  const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
  return isVideo 
    ? <OffthreadVideo src={src} style={style} className={className} muted delayRenderTimeoutInMilliseconds={120000} {...props} /> 
    : <RemotionImg src={src} style={style} className={className} {...props} />;
};

export const KenBurnsMedia: React.FC<{ src: string, type: 'video' | 'image', duration: number, isEven: boolean, style?: any, startFromFrame?: number }> = ({ src, type, duration, isEven, style = {}, startFromFrame = 0 }) => {
  if (!src || src.endsWith('assets/') || src.trim() === '') return null;
  
  const frame = useCurrentFrame();
  const progress = frame / duration;
  const camera = useCamera();
  
  // Use heavy overscan (1.3+) to guarantee safety during extreme 3D camera panning
  const baseScale = isEven ? 1.30 + Math.max(0, progress) * 0.05 : 1.35 - Math.max(0, progress) * 0.05;
  const drift = Math.sin(Math.max(0, progress) * Math.PI) * 10;
  
  // System 1: Real Parallax multiplier for Backgrounds (0.2)
  const bgScale = baseScale + ((camera.zScale - 1.0) * 0.2);
  const bgX = (camera.xPan * 0.2) + drift;
  const bgY = (camera.yPan * 0.2);

  const finalStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translate3d(${bgX}px, ${bgY}px, 0px) scale(${bgScale})`, ...style };
  
  return type === 'video' 
    ? <OffthreadVideo src={src} style={finalStyle} startFrom={startFromFrame} muted delayRenderTimeoutInMilliseconds={120000} />
    : <SmartMedia src={src} style={finalStyle} />;
};


/**
 * DualClipBackground
 * Renders one or two background video clips for a scene.
 * When two clips are provided, clip1 plays from frame 0 â†’ cutFrame,
 * clip2 plays from cutFrame â†’ end, with a 2-frame hard cut (no crossfade needed â€”
 * the cut lands on a natural breath/silence point detected in Python).
 */
export const DualClipBackground: React.FC<{
  scene: any;
  duration: number;
  isEven: boolean;
  style?: React.CSSProperties;
}> = ({ scene, duration, isEven, style = {} }) => {
  const { fps } = useVideoConfig();
  const mediaPaths: string[] = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  const mediaTrims: any[] = scene.media_trims || [];

  if (mediaPaths.length === 0) return null;

  // New Pro Pipeline: Array of mathematically precise clips!
  if (mediaTrims.length > 0 && mediaTrims.length === mediaPaths.length) {
    let accumulatedFrames = 0;
    
    return (
      <>
        {mediaPaths.map((path, idx) => {
          const trim = mediaTrims[idx];
          const startFrameOffset = Math.max(0, Math.round((trim.start_ms / 1000) * fps));
          
          // Last clip fills exactly the remaining duration to prevent math jitter
          const isLast = idx === mediaPaths.length - 1;
          const playDurationFrames = isLast 
            ? Math.max(1, duration - accumulatedFrames) 
            : Math.max(1, Math.round((trim.play_duration_ms / 1000) * fps));
            
          const currentStart = accumulatedFrames;
          accumulatedFrames += playDurationFrames;
          
          return (
            <Sequence key={idx} from={currentStart} durationInFrames={playDurationFrames}>
              <KenBurnsMedia src={staticFile(path)} type={path.endsWith('.mp4') ? 'video' : 'image'} duration={playDurationFrames} isEven={idx % 2 === 0 ? isEven : !isEven} style={style} startFromFrame={startFrameOffset} />
            </Sequence>
          );
        })}
      </>
    );
  }

  // Legacy fallback (before non-destructive update)
  const clip_cut_ms: number  = scene.clip_cut_ms || 0;
  const path1 = mediaPaths[0] ? staticFile(mediaPaths[0]) : '';
  const path2 = mediaPaths[1] ? staticFile(mediaPaths[1]) : '';

  if (!path2 || clip_cut_ms <= 0) {
    return path1 ? <KenBurnsMedia src={path1} type="video" duration={duration} isEven={isEven} style={style} /> : null;
  }

  const cutFrame = Math.round((clip_cut_ms / 1000) * fps);

  return (
    <>
      <Sequence from={0} durationInFrames={cutFrame}>
        <KenBurnsMedia src={path1} type="video" duration={cutFrame} isEven={isEven} style={style} />
      </Sequence>
      <Sequence from={cutFrame} durationInFrames={Math.max(1, duration - cutFrame)}>
        <KenBurnsMedia src={path2} type="video" duration={Math.max(1, duration - cutFrame)} isEven={!isEven} style={style} />
      </Sequence>
    </>
  );
};

export const MapScene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  
  const mapPath = mediaPaths[0] ? staticFile(mediaPaths[0]) : '';
  const heroPath = mediaPaths[1] ? staticFile(mediaPaths[1]) : '';
  
  // 1. Variant Engine
  const variant = (scene.scene_index || 0) % 3; // 0, 1, 2
  
  // Dynamic coordinates based on variant
  const coords = [
    { o: [300, 700], d: [1500, 400], ctrl: [900, 200] },
    { o: [1600, 800], d: [400, 300], ctrl: [1000, 900] },
    { o: [960, 900], d: [960, 200], ctrl: [1300, 550] }
  ][variant];
  
  // Color Palettes
  const palettes = [
    { map: 'sepia(80%) hue-rotate(150deg) saturate(200%) brightness(50%)', line: '#00FF66', glow: 'rgba(0, 255, 102, 0.5)' }, // Radar Green
    { map: 'grayscale(100%) brightness(40%) contrast(120%)', line: '#FF0055', glow: 'rgba(255, 0, 85, 0.5)' }, // Tactical Red
    { map: 'sepia(100%) hue-rotate(5deg) saturate(300%) brightness(40%)', line: '#D4AF37', glow: 'rgba(212, 175, 55, 0.5)' } // Luxury Gold
  ][variant];

  // 2. Physics-based Route Animation
  // Delay route start by 15 frames
  const routeStartFrame = 15;
  const routeDuration = fps * 1.5;
  const routeProgress = interpolate(
    frame, 
    [routeStartFrame, routeStartFrame + routeDuration], 
    [0, 1], 
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Bezier interpolation for the moving dot
  const getBezierPoint = (t: number, p0: number[], p1: number[], p2: number[]) => {
    const x = Math.pow(1 - t, 2) * p0[0] + 2 * (1 - t) * t * p1[0] + Math.pow(t, 2) * p2[0];
    const y = Math.pow(1 - t, 2) * p0[1] + 2 * (1 - t) * t * p1[1] + Math.pow(t, 2) * p2[1];
    return [x, y];
  };
  const [dotX, dotY] = getBezierPoint(routeProgress, coords.o, coords.ctrl, coords.d);
  
  // Path length estimation for dash offset
  const pathLength = 1500; 
  const dashOffset = interpolate(routeProgress, [0, 1], [pathLength, 0]);

  // 3. Physics-based Hero Entry
  // Hero pops in when route completes
  const heroPopProgress = spring({
    frame: frame - (routeStartFrame + routeDuration),
    fps,
    config: { damping: 12, stiffness: 90, mass: 1.2 }
  });
  
  // Secondary motion (Breathing)
  const driftY = Math.sin(frame * 0.05) * 15;
  const pulseR = 30 + Math.sin(frame * 0.1) * 5;

  // 4. Camera Choreography (Local Override)
  // Start focused on origin, follow the dot slightly, then push in heavily on destination.
  const camX = interpolate(routeProgress, [0, 1], [(960 - coords.o[0]) * 0.2, (960 - coords.d[0]) * 0.4]);
  const camY = interpolate(routeProgress, [0, 1], [(540 - coords.o[1]) * 0.2, (540 - coords.d[1]) * 0.4]);
  const camScale = interpolate(
    frame, 
    [0, routeStartFrame + routeDuration, routeStartFrame + routeDuration + fps], 
    [1.0, 1.05, 1.3], 
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#051014', overflow: 'hidden' }}>
      
      <AbsoluteFill style={{ 
        transform: `translate3d(${camX}px, ${camY}px, 0) scale(${camScale})`, 
        transformOrigin: 'center',
        transition: 'none' // Pure frame interpolation
      }}>
        
        {/* Map Background */}
        {mapPath && (
          <AbsoluteFill style={{ opacity: 0.7, filter: palettes.map }}>
            <KenBurnsMedia src={mapPath} type={mapPath.endsWith('.mp4') ? 'video' : 'image'} duration={duration} isEven={isEven} />
          </AbsoluteFill>
        )}

        <VolumetricDust />

        {/* Animated Map Route */}
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute' }}>
            <path 
              d={`M ${coords.o[0]} ${coords.o[1]} Q ${coords.ctrl[0]} ${coords.ctrl[1]} ${coords.d[0]} ${coords.d[1]}`} 
              fill="transparent" 
              stroke={palettes.line}
              strokeWidth="6" 
              strokeDasharray={pathLength} 
              strokeDashoffset={dashOffset} 
              style={{ filter: `drop-shadow(0 0 15px ${palettes.line})` }} 
            />
            
            {/* Origin Pin */}
            <circle cx={coords.o[0]} cy={coords.o[1]} r={routeProgress > 0 ? 12 : 0} fill="#FFFFFF" />
            <circle cx={coords.o[0]} cy={coords.o[1]} r={routeProgress > 0 ? pulseR : 0} fill="none" stroke={palettes.line} strokeWidth="3" />
            
            {/* Moving Dot */}
            {routeProgress > 0 && routeProgress < 1 && (
              <circle cx={dotX} cy={dotY} r="8" fill="#FFFFFF" style={{ filter: `drop-shadow(0 0 10px ${palettes.line})` }} />
            )}

            {/* Destination Pin */}
            <circle cx={coords.d[0]} cy={coords.d[1]} r={routeProgress >= 1 ? 15 : 0} fill="#FFFFFF" />
            <circle cx={coords.d[0]} cy={coords.d[1]} r={routeProgress >= 1 ? pulseR * 1.5 : 0} fill="none" stroke={palettes.line} strokeWidth="5" style={{ filter: `drop-shadow(0 0 20px ${palettes.glow})` }} />
          </svg>
        </AbsoluteFill>

        {/* Dynamic Adaptive Hero */}
        {heroPath && (
          <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute',
              left: `${coords.d[0]}px`,
              top: `${coords.d[1]}px`,
              transform: `translate3d(-50%, calc(-50% - 100px + ${driftY}px), 0) scale(${heroPopProgress})`,
              width: variant === 2 ? '400px' : '500px', // Adaptive sizing based on variant
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end'
            }}>
              <SmartMedia 
                src={heroPath} 
                style={{ 
                  width: '100%', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 40px 50px rgba(0,0,0,0.9))'
                }} 
              />
            </div>
          </AbsoluteFill>
        )}

      </AbsoluteFill>
      
      <FilmGrain />
      <AbsoluteFill style={{ background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.85) 100%)' }} />

      {/* Frame-Accurate Sound Sync */}
      <Sequence from={routeStartFrame}>
        
        
      </Sequence>
      
      <Sequence from={Math.floor(routeStartFrame + routeDuration)}>
        
      </Sequence>

    </AbsoluteFill>
  );
};

const seededRandom = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

export const FullscreenScene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  const src = mediaPaths[0] ? staticFile(mediaPaths[0]) : '';
  const isVideo = src.endsWith('.mp4');

  const seed = scene.scene_index || 0;
  const choice = (arr: any[]) => arr[Math.floor(seededRandom(seed + arr.length) * arr.length)];
  
  // 1. Camera Variants
  const cameraPaths = ['push_in', 'push_out', 'pan_left_push', 'pan_right_push', 'tilt_up', 'tilt_down', 'orbit'];
  const cameraMove = choice(cameraPaths);
  
  // 2. Color LUTs
  const luts = [
    { name: 'Dark Documentary', css: 'grayscale(60%) contrast(150%) brightness(70%)' },
    { name: 'Cold Corporate', css: 'sepia(30%) hue-rotate(180deg) saturate(80%) contrast(120%)' },
    { name: 'Luxury Gold', css: 'sepia(60%) hue-rotate(350deg) saturate(150%) contrast(110%)' },
    { name: 'Neutral Cinema', css: 'contrast(110%) saturate(110%)' }
  ];
  const lut = choice(luts);
  
  // 3. Lighting
  const lightings = ['Light Sweep', 'Soft Lens Flare', 'Window Light', 'Edge Glow', 'None'];
  const lighting = choice(lightings);
  
  // 4. Atmosphere (Choose 2)
  const atmospheres = ['Smoke', 'Dust', 'Film Grain', 'Floating Particles', 'Light Rays'];
  const atmo1 = atmospheres[Math.floor(seededRandom(seed + 10) * atmospheres.length)];
  let atmo2 = atmospheres[Math.floor(seededRandom(seed + 11) * atmospheres.length)];
  if (atmo1 === atmo2) atmo2 = atmospheres[(Math.floor(seededRandom(seed + 11) * atmospheres.length) + 1) % atmospheres.length];
  
  const progress = frame / duration;
  let scale = 1.0;
  let x = 0;
  let y = 0;
  let rotate = 0;

  // Base overscan for image parallax
  const overscan = isVideo ? 1.05 : 1.20;

  if (cameraMove === 'push_in') scale = interpolate(progress, [0, 1], [overscan, overscan + 0.1]);
  if (cameraMove === 'push_out') scale = interpolate(progress, [0, 1], [overscan + 0.1, overscan]);
  if (cameraMove === 'pan_left_push') { scale = interpolate(progress, [0, 1], [overscan, overscan + 0.1]); x = interpolate(progress, [0, 1], [50, -50]); }
  if (cameraMove === 'pan_right_push') { scale = interpolate(progress, [0, 1], [overscan, overscan + 0.1]); x = interpolate(progress, [0, 1], [-50, 50]); }
  if (cameraMove === 'tilt_up') { scale = overscan; y = interpolate(progress, [0, 1], [30, -30]); }
  if (cameraMove === 'tilt_down') { scale = overscan; y = interpolate(progress, [0, 1], [-30, 30]); }
  if (cameraMove === 'orbit') { 
    scale = overscan + 0.05; 
    x = Math.sin(progress * Math.PI) * 20; 
    y = Math.cos(progress * Math.PI) * 20; 
    rotate = interpolate(progress, [0, 1], [-1, 1]); 
  }

  // Micro-breathing
  const breath = Math.sin(frame * 0.03) * 0.01;
  scale += breath;

  const transition = scene.transition || 'fade';
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      
      {/* Media Layer */}
      {src && (
        <AbsoluteFill style={{
          transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`,
          transformOrigin: 'center',
          filter: lut.css + (isVideo ? '' : ' blur(1px)')
        }}>
          {isVideo ? (
            <OffthreadVideo src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted delayRenderTimeoutInMilliseconds={120000} />
          ) : (
            <SmartMedia src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </AbsoluteFill>
      )}

      {/* Lighting Effects */}
      {lighting === 'Soft Lens Flare' && <LensFlare />}
      {lighting === 'Window Light' && <WindowLight />}
      {lighting === 'Edge Glow' && <EdgeGlow />}
      {lighting === 'Light Sweep' && (
        <AbsoluteFill style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', transform: `translateX(${interpolate(progress, [0, 1], [-1920, 1920])}px)` }} />
      )}

      {/* Atmosphere Effects */}
      {[atmo1, atmo2].includes('Smoke') && <HeavySmoke />}
      {[atmo1, atmo2].includes('Dust') && <VolumetricDust />}
      {[atmo1, atmo2].includes('Film Grain') && <FilmGrain />}
      {[atmo1, atmo2].includes('Light Rays') && <LightRays />}
      {[atmo1, atmo2].includes('Floating Particles') && <VolumetricDust />}

      <AbsoluteFill style={{ background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />

      {/* Frame-Accurate Sound Sync */}
      <Sequence from={0}>
        
        
        
        
      </Sequence>
      
      {transition !== 'fade' && (
        <Sequence from={Math.max(0, duration - 15)}>
          
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

export const HeroPNGScene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  
  const bgPath = mediaPaths[0] ? staticFile(mediaPaths[0]) : '';
  const heroPath = mediaPaths[1] ? staticFile(mediaPaths[1]) : '';
  
  const seed = scene.scene_index || 0;
  const choice = (arr: any[]) => arr[Math.floor(seededRandom(seed + arr.length) * arr.length)];
  
  // 1. Hero Variant Engine (10 Variants)
  const entryVariant = choice(['slide_left', 'slide_right', 'scale_reveal', 'blur_reveal', 'rotate_reveal', 'whip_reveal', 'zoom_reveal', 'mask_reveal', 'light_reveal', 'drop_reveal']);
  
  // 2. Camera Director
  const camMove = choice(['push', 'pull', 'orbit', 'left_pan', 'right_pan', 'tilt', 'dolly', 'push_pan']);
  
  // 3. Background Director (LUTs)
  const luts = [
    { css: 'grayscale(40%) contrast(140%) brightness(60%)' },
    { css: 'sepia(30%) hue-rotate(200deg) saturate(150%) brightness(50%)' },
    { css: 'contrast(120%) saturate(130%) brightness(50%)' },
    { css: 'sepia(50%) hue-rotate(320deg) brightness(60%)' } // Gold
  ];
  const lut = choice(luts);
  
  // 5. Foreground Layer FX
  const fxChoice1 = choice(['Smoke', 'Dust', 'Light Rays', 'Glass Reflection']);
  let fxChoice2 = choice(['Smoke', 'Dust', 'Light Rays', 'Glass Reflection']);
  if (fxChoice1 === fxChoice2) fxChoice2 = 'Dust';

  // Math for 4. Focus Director & 10. Scene Evolution
  const progress = frame / duration;
  
  // Dynamic Blur interpolation
  let bgBlur = 0;
  let heroBlur = 0;
  if (progress < 0.3) {
      bgBlur = 0;
      heroBlur = interpolate(progress, [0, 0.3], [20, 0]);
  } else if (progress < 0.7) {
      bgBlur = interpolate(progress, [0.3, 0.4], [0, 15], { extrapolateRight: 'clamp' });
      heroBlur = 0;
  } else {
      bgBlur = interpolate(progress, [0.7, 0.8], [15, 0], { extrapolateRight: 'clamp' });
      heroBlur = 0;
  }

  // Camera Movement (BG)
  let bgScale = 1.1;
  let bgX = 0;
  let bgY = 0;
  if (camMove === 'push') bgScale = interpolate(progress, [0, 1], [1.1, 1.3]);
  if (camMove === 'pull') bgScale = interpolate(progress, [0, 1], [1.3, 1.1]);
  if (camMove === 'orbit') { bgX = Math.sin(progress * Math.PI) * 30; bgY = Math.cos(progress * Math.PI) * 30; bgScale = 1.2; }
  if (camMove === 'left_pan') { bgX = interpolate(progress, [0, 1], [50, -50]); bgScale = 1.2; }
  if (camMove === 'right_pan') { bgX = interpolate(progress, [0, 1], [-50, 50]); bgScale = 1.2; }
  if (camMove === 'tilt') { bgY = interpolate(progress, [0, 1], [40, -40]); bgScale = 1.2; }
  if (camMove === 'dolly') { bgX = interpolate(progress, [0, 1], [-40, 40]); bgY = interpolate(progress, [0, 1], [20, -20]); bgScale = interpolate(progress, [0, 1], [1.1, 1.2]); }
  if (camMove === 'push_pan') { bgX = interpolate(progress, [0, 1], [-30, 30]); bgScale = interpolate(progress, [0, 1], [1.1, 1.3]); }

  // Hero Entry Physics & Variant Logic
  const entryStart = duration * 0.2; // 20% in
  const heroP = Math.max(0, frame - entryStart);
  
  const hSpring = spring({ frame: heroP, fps, config: { damping: 14, stiffness: 90, mass: 1.2 } });
  
  let hX = 0;
  let hY = 0;
  let hS = 1.0;
  let hRot = 0;
  let hClip = 'none';
  let hOpac = 1;

  if (entryVariant === 'slide_left') hX = interpolate(hSpring, [0, 1], [-1000, 0]);
  if (entryVariant === 'slide_right') hX = interpolate(hSpring, [0, 1], [1000, 0]);
  if (entryVariant === 'scale_reveal') { hS = interpolate(hSpring, [0, 1], [0.1, 1]); hY = interpolate(hSpring, [0, 1], [200, 0]); }
  if (entryVariant === 'blur_reveal') { hX = interpolate(hSpring, [0, 1], [0, 0]); heroBlur += interpolate(hSpring, [0, 1], [30, 0]); hOpac = interpolate(hSpring, [0, 1], [0, 1]); }
  if (entryVariant === 'rotate_reveal') { hRot = interpolate(hSpring, [0, 1], [180, 0]); hS = interpolate(hSpring, [0, 1], [0, 1]); }
  if (entryVariant === 'whip_reveal') { hX = interpolate(hSpring, [0, 1], [1500, 0]); hRot = interpolate(hSpring, [0, 1], [45, 0]); }
  if (entryVariant === 'zoom_reveal') { hS = interpolate(hSpring, [0, 1], [3, 1]); hOpac = interpolate(hSpring, [0, 1], [0, 1]); }
  if (entryVariant === 'mask_reveal') { hClip = `circle(${interpolate(hSpring, [0, 1], [0, 100])}% at center)`; }
  if (entryVariant === 'light_reveal') { hOpac = interpolate(hSpring, [0, 1], [0, 1]); }
  if (entryVariant === 'drop_reveal') { hY = interpolate(hSpring, [0, 1], [-1000, 0]); }

  // 7. Secondary Motion (Always active)
  hY += Math.sin(frame * 0.05) * 15; // Float
  hRot += Math.sin(frame * 0.03) * 1; // Rotate +-1 deg
  hS += Math.sin(frame * 0.04) * 0.01; // Scale 1%
  hX += interpolate(progress, [0, 1], [0, isEven ? 20 : -20]); // Drift

  // 8. Impact Director
  let camShakeX = 0;
  let camShakeY = 0;
  let globalBlur = 0;
  if (heroP > 0 && heroP < 15) {
     camShakeX = Math.sin(heroP * 2) * interpolate(heroP, [0, 15], [20, 0]);
     camShakeY = Math.cos(heroP * 2) * interpolate(heroP, [0, 15], [20, 0]);
     globalBlur = interpolate(heroP, [0, 15], [5, 0]);
  }
  
  // Light Sweep
  const sweepPos = interpolate(frame, [duration * 0.4, duration * 0.6], [-1000, 1000], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      
      <AbsoluteFill style={{ 
         transform: `translate3d(${camShakeX}px, ${camShakeY}px, 0)`,
         filter: `blur(${globalBlur}px)`
      }}>
          {/* Background */}
          {bgPath && (
            <AbsoluteFill style={{ 
              filter: `${lut.css} blur(${bgBlur}px)`,
              transform: `translate3d(${bgX}px, ${bgY}px, 0) scale(${bgScale})`,
              transformOrigin: 'center',
              opacity: interpolate(progress, [0, 0.2], [0.2, 0.9], { extrapolateRight: 'clamp' })
            }}>
              <DualClipBackground scene={scene} duration={duration} isEven={isEven} />
            </AbsoluteFill>
          )}

          {/* Atmosphere Back */}
          <VolumetricDust />

          {/* Hero Element */}
          {heroPath && progress >= 0.2 && (
            <AbsoluteFill style={{ 
              justifyContent: 'center', alignItems: 'center', pointerEvents: 'none',
              filter: `blur(${heroBlur}px)`
            }}>
              <div style={{
                position: 'absolute',
                transform: `translate3d(${hX}px, ${hY}px, 0) scale(${hS}) rotate(${hRot}deg)`,
                clipPath: hClip,
                opacity: hOpac,
                display: 'flex', justifyContent: 'center', alignItems: 'center'
              }}>
                <SmartMedia 
                  src={heroPath} 
                  style={{ 
                    maxHeight: '900px', maxWidth: '1000px', objectFit: 'contain',
                    filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.9))'
                  }} 
                />
                <div style={{
                   position: 'absolute', inset: 0,
                   background: `linear-gradient(105deg, transparent, rgba(255,255,255,0.0), rgba(255,255,255,0.6), rgba(255,255,255,0.0), transparent)`,
                   transform: `translateX(${sweepPos}px)`,
                   mixBlendMode: 'overlay', borderRadius: '20px'
                }} />
              </div>
            </AbsoluteFill>
          )}

          {/* Foreground FX */}
          {[fxChoice1, fxChoice2].includes('Smoke') && <HeavySmoke />}
          {[fxChoice1, fxChoice2].includes('Dust') && <VolumetricDust />}
          {[fxChoice1, fxChoice2].includes('Light Rays') && <LightRays />}
          {[fxChoice1, fxChoice2].includes('Glass Reflection') && <GlassReflection />}
          
          <FilmGrain />
          <AbsoluteFill style={{ background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.8) 100%)' }} />
          
          <DustBurst triggerFrame={Math.floor(entryStart)} />
      </AbsoluteFill>

      {/* 11. Audio Stack */}
      <Sequence from={0}>
        
        
      </Sequence>
      
      {/* Hero Entry Audio */}
      <Sequence from={Math.floor(entryStart)}>
         
         
      </Sequence>
      
      {/* Light Sweep Audio */}
      <Sequence from={Math.floor(duration * 0.4)}>
         
      </Sequence>
      
      {scene.transition !== 'fade' && (
        <Sequence from={Math.max(0, duration - 15)}>
          
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

export const HeroCompositionScene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  
  const bgPath = mediaPaths[0] ? staticFile(mediaPaths[0]) : '';
  const heroPath = mediaPaths[1] ? staticFile(mediaPaths[1]) : '';
  const propPaths = [mediaPaths[2], mediaPaths[3], mediaPaths[4]].filter(Boolean).map(p => staticFile(p));

  const seed = scene.scene_index || 0;
  const choice = (arr: any[]) => arr[Math.floor(seededRandom(seed + arr.length) * arr.length)];
  const random = (offset: number) => seededRandom(seed + offset);

  // 1. Hero Director (8 Layouts)
  const heroLayouts = [
    { x: 0, y: 0, s: 1.0, align: 'center' }, // Center
    { x: -300, y: 0, s: 1.1, align: 'center' }, // Left
    { x: 300, y: 0, s: 1.1, align: 'center' }, // Right
    { x: -400, y: 200, s: 0.9, align: 'flex-end' }, // Lower Left
    { x: 400, y: 200, s: 0.9, align: 'flex-end' }, // Lower Right
    { x: 0, y: 0, s: 1.8, align: 'center' }, // Extreme Close-up
    { x: 0, y: 0, s: 1.4, align: 'flex-end' }, // Oversized Crop
    { x: isEven ? 200 : -200, y: 100, s: 1.2, align: 'center' } // Profile
  ];
  const hLayout = choice(heroLayouts);

  // 4. Hero Entrance
  const heroEntrance = choice(['bottom_rise', 'left_slide', 'right_slide', 'blur_reveal', 'scale_reveal', 'whip_reveal', 'light_reveal']);

  // 5. Camera Director
  const camDir = choice(['push', 'orbit', 'dolly', 'push_orbit', 'pan_push', 'pull']);

  // 7. Lighting
  const allLights = ['Rim Light', 'Window Light', 'Light Sweep', 'Lens Flare', 'Edge Glow'];
  const l1 = choice(allLights);
  let l2 = choice(allLights);
  if (l1 === l2) l2 = 'None';

  // 8. Foreground FX
  const fgFx = choice(['Smoke', 'Dust', 'Glass Reflection', 'Light Rays']);

  // 6. Timelines
  const progress = frame / duration;
  const heroStartFrame = duration * 0.2;
  const heroEndFrame = duration * 0.5;
  const pushStart = duration * 0.5;
  const pushEnd = duration * 0.75;
  
  const hProg = Math.max(0, Math.min(1, (frame - heroStartFrame) / (heroEndFrame - heroStartFrame)));
  const pProg = Math.max(0, Math.min(1, (frame - pushStart) / (pushEnd - pushStart)));
  
  // Hero Spring
  const hP = Math.max(0, frame - heroStartFrame);
  const heroSpring = spring({ frame: hP, fps, config: { damping: 14, stiffness: 80, mass: 1.5 } });

  // 10. Layer Interaction (On hero land -> shake)
  let camShakeX = 0; let camShakeY = 0; let propShake = 0;
  if (hP > 0 && hP < 15) {
      camShakeX = Math.sin(hP * 3) * interpolate(hP, [0, 15], [30, 0]);
      camShakeY = Math.cos(hP * 3) * interpolate(hP, [0, 15], [30, 0]);
      propShake = interpolate(hP, [0, 15], [50, 0]);
  }

  // Camera Math
  let camScale = 1.0; let camX = 0; let camY = 0;
  if (camDir === 'push') camScale = interpolate(progress, [0, 1], [1.0, 1.2]);
  if (camDir === 'pull') camScale = interpolate(progress, [0, 1], [1.2, 1.0]);
  if (camDir === 'orbit') { camX = Math.sin(progress * Math.PI) * 50; camY = Math.cos(progress * Math.PI) * 50; camScale = 1.1; }
  if (camDir === 'push_orbit') { camScale = interpolate(progress, [0, 1], [1.0, 1.2]); camX = Math.sin(progress * Math.PI) * 40; }
  if (camDir === 'pan_push') { camScale = interpolate(progress, [0, 1], [1.0, 1.2]); camX = interpolate(progress, [0, 1], [-50, 50]); }
  if (camDir === 'dolly') { camX = interpolate(progress, [0, 1], [-50, 50]); camY = interpolate(progress, [0, 1], [30, -30]); camScale = interpolate(progress, [0, 1], [1.0, 1.1]); }

  // 9. Focus Director (BG Blur -> Hero Sharp -> FG Blur)
  let bgBlur = interpolate(progress, [0, 0.2, 0.5, 1], [0, 5, 15, 20]);
  let heroBlur = 0;
  let fgBlur = interpolate(progress, [0, 0.5, 1], [0, 0, 10]);
  
  if (heroEntrance === 'blur_reveal') heroBlur = interpolate(heroSpring, [0, 1], [30, 0]);

  // Hero Entry Math
  let currHX = hLayout.x; let currHY = hLayout.y; let currHS = hLayout.s; let currHRot = 0; let hOpac = 1;
  if (heroEntrance === 'bottom_rise') currHY += interpolate(heroSpring, [0, 1], [800, 0]);
  if (heroEntrance === 'left_slide') currHX += interpolate(heroSpring, [0, 1], [-1200, 0]);
  if (heroEntrance === 'right_slide') currHX += interpolate(heroSpring, [0, 1], [1200, 0]);
  if (heroEntrance === 'scale_reveal') currHS *= interpolate(heroSpring, [0, 1], [0.1, 1]);
  if (heroEntrance === 'whip_reveal') { currHX += interpolate(heroSpring, [0, 1], [1500, 0]); currHRot = interpolate(heroSpring, [0, 1], [45, 0]); }
  if (heroEntrance === 'light_reveal') hOpac = interpolate(heroSpring, [0, 1], [0, 1]);

  currHY += Math.sin(frame * 0.04) * 10; // secondary float
  currHS += Math.sin(frame * 0.05) * 0.02;

  // 2 & 3. Prop Director & Animation
  const propSlots = [
    { x: -600, y: -300, z: 25 }, // Top L
    { x: 600, y: -300, z: 25 }, // Top R
    { x: -700, y: 0, z: 25 }, // Mid L
    { x: 700, y: 0, z: 25 }, // Mid R
    { x: -500, y: 300, z: 25 }, // Bot L
    { x: 500, y: 300, z: 25 }, // Bot R
    { x: -300, y: -200, z: 5 }, // Behind L
    { x: 300, y: -200, z: 5 } // Behind R
  ];
  
  // Shuffle slots for props deterministically
  const shuffledSlots = [...propSlots].sort((a, b) => random(a.x) - 0.5);

  const getPropAnim = (idx: number, slot: any) => {
     const animType = ['Float', 'Orbit', 'Swing', 'Rotate', 'Drift', 'Flutter'][Math.floor(random(idx * 5) * 6)];
     const speed = 0.02 + random(idx) * 0.05;
     const phase = random(idx * 2) * 100;
     
     let px = slot.x; let py = slot.y; let prot = 0; let ps = 1.0;
     
     if (animType === 'Float') py += Math.sin((frame + phase) * speed) * 40;
     if (animType === 'Orbit') { px += Math.sin((frame + phase) * speed) * 50; py += Math.cos((frame + phase) * speed) * 50; }
     if (animType === 'Swing') prot = Math.sin((frame + phase) * speed) * 20;
     if (animType === 'Rotate') prot = (frame * speed * 20) % 360;
     if (animType === 'Drift') px += interpolate(progress, [0, 1], [0, slot.x > 0 ? 100 : -100]);
     if (animType === 'Flutter') { px += Math.sin(frame * speed * 3) * 10; py += Math.cos(frame * speed * 3) * 10; }
     
     // Shake impact
     px += Math.sin(frame * 10 + phase) * propShake;
     py += Math.cos(frame * 10 + phase) * propShake;
     
     // Deep Parallax
     px += camX * (slot.z === 25 ? -1.5 : 0.5);
     py += camY * (slot.z === 25 ? -1.5 : 0.5);

     return { px, py, prot, ps, z: slot.z };
  };

  const transition = scene.transition || 'fade';
  const sweepPos = interpolate(frame, [pushStart, pushEnd], [-1000, 1000], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', overflow: 'hidden' }}>
      
      <AbsoluteFill style={{ 
          transform: `translate3d(${camShakeX + camX}px, ${camShakeY + camY}px, 0) scale(${camScale})`,
          transformOrigin: 'center'
      }}>
          
          {/* Background */}
          {bgPath && (
             <AbsoluteFill style={{ filter: `blur(${bgBlur}px) brightness(60%)` }}>
                <DualClipBackground scene={scene} duration={duration} isEven={isEven} />
             </AbsoluteFill>
          )}

          <VolumetricDust />

          {/* Behind Props */}
          {propPaths.map((path, i) => {
             const slot = shuffledSlots[i];
             if (slot.z !== 5) return null;
             const p = getPropAnim(i, slot);
             return (
               <AbsoluteFill key={i} style={{ justifyContent: 'center', alignItems: 'center', zIndex: p.z }}>
                  <SmartMedia src={path} style={{ 
                     position: 'absolute', width: '300px', objectFit: 'contain',
                     transform: `translate3d(${p.px}px, ${p.py}px, 0) scale(${p.ps}) rotate(${p.prot}deg)`,
                     filter: `blur(${bgBlur * 0.5}px) brightness(70%) drop-shadow(0 20px 30px rgba(0,0,0,0.8))`
                  }} />
               </AbsoluteFill>
             );
          })}

          {/* Adaptive Hero */}
          {heroPath && hP > 0 && (
             <AbsoluteFill style={{ 
                justifyContent: hLayout.align === 'flex-end' ? 'flex-end' : 'center', 
                alignItems: hLayout.align === 'flex-end' ? 'flex-end' : 'center', 
                zIndex: 10,
                paddingBottom: hLayout.align === 'flex-end' ? '0' : '0'
             }}>
                <div style={{
                   position: 'absolute',
                   transform: `translate3d(${currHX}px, ${currHY}px, 0) scale(${currHS}) rotate(${currHRot}deg)`,
                   opacity: hOpac,
                   filter: `blur(${heroBlur}px)`
                }}>
                   <SmartMedia src={heroPath} style={{ 
                      maxHeight: hLayout.align === 'flex-end' ? '1080px' : '900px', 
                      maxWidth: hLayout.align === 'flex-end' ? '1200px' : '1000px', 
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 50px 80px rgba(0,0,0,0.95))'
                   }} />
                   
                   {/* Rim Light / Sweep Mask */}
                   {[l1, l2].includes('Light Sweep') && (
                       <div style={{
                         position: 'absolute', inset: 0,
                         background: `linear-gradient(105deg, transparent, rgba(255,255,255,0.0), rgba(255,255,255,0.6), rgba(255,255,255,0.0), transparent)`,
                         transform: `translateX(${sweepPos}px)`,
                         mixBlendMode: 'overlay', borderRadius: '20px'
                      }} />
                   )}
                </div>
             </AbsoluteFill>
          )}

          {/* In Front Props */}
          {propPaths.map((path, i) => {
             const slot = shuffledSlots[i];
             if (slot.z !== 25) return null;
             const p = getPropAnim(i, slot);
             return (
               <AbsoluteFill key={i} style={{ justifyContent: 'center', alignItems: 'center', zIndex: p.z }}>
                  <SmartMedia src={path} style={{ 
                     position: 'absolute', width: '400px', objectFit: 'contain',
                     transform: `translate3d(${p.px}px, ${p.py}px, 0) scale(${p.ps}) rotate(${p.prot}deg)`,
                     filter: `blur(${fgBlur}px) drop-shadow(0 40px 60px rgba(0,0,0,1.0))`
                  }} />
               </AbsoluteFill>
             );
          })}

          {/* Global Lighting & FX */}
          {[l1, l2].includes('Lens Flare') && <LensFlare />}
          {[l1, l2].includes('Window Light') && <WindowLight />}
          {[l1, l2].includes('Edge Glow') && <EdgeGlow />}

          {fgFx === 'Smoke' && <HeavySmoke />}
          {fgFx === 'Dust' && <VolumetricDust />}
          {fgFx === 'Light Rays' && <LightRays />}
          {fgFx === 'Glass Reflection' && <GlassReflection />}

          <DustBurst triggerFrame={Math.floor(heroStartFrame)} />

      </AbsoluteFill>

      {/* Audio Stack */}
      <Sequence from={0}>
        
      </Sequence>
      
      <Sequence from={Math.floor(heroStartFrame)}>
         
         
      </Sequence>
      
      {scene.transition !== 'fade' && (
        <Sequence from={Math.max(0, duration - 15)}>
          
        </Sequence>
      )}

    </AbsoluteFill>
  );
};

export const TripleCompositionScene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  
  const bgPath = mediaPaths[0] ? staticFile(mediaPaths[0]) : '';
  const png1 = mediaPaths[1] ? staticFile(mediaPaths[1]) : '';
  const png2 = mediaPaths[2] ? staticFile(mediaPaths[2]) : '';
  const png3 = mediaPaths[3] ? staticFile(mediaPaths[3]) : '';
  const pPaths = [png1, png2, png3].filter(Boolean);

  const seed = scene.scene_index || 0;
  const choice = (arr: any[]) => arr[Math.floor(seededRandom(seed + arr.length) * arr.length)];
  const random = (offset: number) => seededRandom(seed + offset);

  // 1. Triple Layout Director
  const layouts = [
    [{x:-400, y:200},{x:0, y:-200},{x:400, y:200}], // Triangle
    [{x:-300, y:-100},{x:300, y:-100},{x:0, y:200}], // Pyramid
    [{x:-500, y:0},{x:0, y:-50},{x:500, y:0}], // Fan
    [{x:-400, y:-300},{x:0, y:0},{x:400, y:300}], // Cascade
    [{x:-300, y:-200},{x:400, y:0},{x:-200, y:300}], // Circle-ish
    [{x:-100, y:-100},{x:50, y:50},{x:200, y:200}], // Stack
    [{x:-500, y:0},{x:-100, y:-200},{x:200, y:300}], // Left Heavy
    [{x:500, y:0},{x:100, y:-200},{x:-200, y:300}], // Right Heavy
    [{x:0, y:-300},{x:-300, y:150},{x:300, y:150}], // Center Exp
    [{x:-400, y:-100},{x:100, y:-250},{x:200, y:200}]  // Asymmetrical
  ];
  let layout = choice(layouts);

  // 2. Hero Priority & 3. Depth
  const heroIdx = Math.floor(random(1) * 3);
  const depths = [200, 0, -200].sort(() => random(2) - 0.5); // Fore, Mid, Back Z values
  
  const slots = layout.map((l: any, i: number) => ({
      x: l.x, y: l.y, 
      z: depths[i], 
      isHero: i === heroIdx,
      baseScale: i === heroIdx ? 1.4 : 0.9,
      entryVariant: choice(['slide','whip','scale','blur','rotate','mask','light']),
      path: pPaths[i]
  })).filter((s: any) => s.path);

  // Timelines
  const t1 = 0;
  const t2 = duration * 0.2;
  const t3 = duration * 0.4;
  const tPush = duration * 0.6;
  const tPrep = duration * 0.8;
  const progress = frame / duration;

  // 5. Camera Director
  const camDir = choice(['orbit', 'push', 'dolly', 'tilt', 'pan', 'push_orbit', 'orbit_tilt', 'dolly_push']);
  
  let camZ = 0; let camX = 0; let camY = 0; let camRotY = 0; let camRotX = 0;
  if (camDir === 'push') camZ = interpolate(frame, [tPush, duration], [0, 500]);
  if (camDir === 'orbit') camRotY = interpolate(progress, [0, 1], [-15, 15]);
  if (camDir === 'dolly') camX = interpolate(progress, [0, 1], [-200, 200]);
  if (camDir === 'tilt') camRotX = interpolate(progress, [0, 1], [-10, 10]);
  if (camDir === 'pan') camX = interpolate(progress, [0, 1], [300, -300]);
  if (camDir === 'push_orbit') { camZ = interpolate(frame, [tPush, duration], [0, 600]); camRotY = interpolate(progress, [0, 1], [-10, 10]); }
  if (camDir === 'orbit_tilt') { camRotY = interpolate(progress, [0, 1], [-20, 20]); camRotX = interpolate(progress, [0, 1], [-5, 5]); }
  if (camDir === 'dolly_push') { camX = interpolate(progress, [0, 1], [-150, 150]); camZ = interpolate(frame, [tPush, duration], [0, 400]); }

  // 13. Transition Prep (Accelerate)
  if (frame > tPrep) {
     const p2 = interpolate(frame, [tPrep, duration], [0, 1], { extrapolateRight: 'clamp' });
     camZ += p2 * 300;
  }

  // 11. Interaction (Shake)
  let sysShakeX = 0; let sysShakeY = 0;
  const shakeP3 = Math.max(0, frame - t3);
  if (shakeP3 > 0 && shakeP3 < 15) {
     sysShakeX = Math.sin(shakeP3 * 3) * interpolate(shakeP3, [0, 15], [30, 0]);
     sysShakeY = Math.cos(shakeP3 * 3) * interpolate(shakeP3, [0, 15], [30, 0]);
  }
  
  const reactP2 = Math.max(0, frame - t2);
  const reactScale1 = (reactP2 > 0 && reactP2 < 10) ? Math.sin(reactP2) * interpolate(reactP2, [0, 10], [0.05, 0]) : 0;

  // 9. Focus Pull
  const getFocusBlur = (idx: number) => {
     if (progress > 0.6) return 0; // all sharp
     if (progress < 0.2 && idx === 0) return 0;
     if (progress >= 0.2 && progress < 0.4 && idx === 1) return 0;
     if (progress >= 0.4 && progress < 0.6 && idx === 2) return 0;
     return 15; // out of focus
  };

  // Lighting & FX
  const fgFx = choice(['Smoke', 'Dust', 'Light Rays', 'Glass Reflection']);
  const light = choice(['Rim Light', 'Light Sweep', 'Window Light', 'Edge Glow']);
  const prepBlur = interpolate(frame, [tPrep, duration], [0, 20], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      
      {bgPath && (
         <AbsoluteFill style={{ opacity: 0.6, transform: 'scale(1.2)' }}>
            <DualClipBackground scene={scene} duration={duration} isEven={isEven} />
         </AbsoluteFill>
      )}

      {/* Global Camera System */}
      <AbsoluteFill style={{
          transform: `perspective(1200px) translate3d(${camX + sysShakeX}px, ${camY + sysShakeY}px, ${camZ}px) rotateY(${camRotY}deg) rotateX(${camRotX}deg)`,
          transformStyle: 'preserve-3d',
          justifyContent: 'center', alignItems: 'center',
          filter: `blur(${prepBlur}px)`
      }}>
         {slots.map((slot: any, i: number) => {
             const tStart = i === 0 ? t1 : (i === 1 ? t2 : t3);
             const pActive = Math.max(0, frame - tStart);
             const spr = spring({ frame: pActive, fps, config: { damping: 14, stiffness: 90, mass: 1.2 } });
             
             if (pActive <= 0) return null;

             let cx = slot.x; let cy = slot.y; let cs = slot.baseScale; let cRot = 0; let cOpac = 1; let cClip = 'none';
             
             // 4. Entry Math
             if (slot.entryVariant === 'slide') cx += interpolate(spr, [0, 1], [slot.x > 0 ? 1000 : -1000, 0]);
             if (slot.entryVariant === 'whip') { cx += interpolate(spr, [0, 1], [1500, 0]); cRot = interpolate(spr, [0, 1], [45, 0]); }
             if (slot.entryVariant === 'scale') cs *= interpolate(spr, [0, 1], [0, 1]);
             if (slot.entryVariant === 'blur') cOpac = interpolate(spr, [0, 1], [0, 1]); // Blur handle below
             if (slot.entryVariant === 'rotate') { cRot = interpolate(spr, [0, 1], [180, 0]); cs *= interpolate(spr, [0, 1], [0, 1]); }
             if (slot.entryVariant === 'mask') cClip = `circle(${interpolate(spr, [0, 1], [0, 100])}% at center)`;
             if (slot.entryVariant === 'light') cOpac = interpolate(spr, [0, 1], [0, 1]);

             // 7. Independent Motion
             cy += Math.sin((frame + i * 50) * 0.05) * 20; // Float
             cRot += Math.sin((frame + i * 20) * 0.03) * 2; // Rot
             cs += Math.sin((frame + i * 30) * 0.04) * 0.02; // Breathe
             cx += interpolate(progress, [0, 1], [0, (i % 2 === 0) ? 30 : -30]); // Drift

             if (i === 0) cs += reactScale1;

             let blurAmount = getFocusBlur(i);
             if (slot.entryVariant === 'blur') blurAmount += interpolate(spr, [0, 1], [40, 0]);

             return (
               <div key={i} style={{ 
                  position: 'absolute', 
                  transform: `translate3d(${cx}px, ${cy}px, ${slot.z}px) scale(${cs}) rotate(${cRot}deg)`,
                  zIndex: slot.isHero ? 50 : 10 + i,
                  clipPath: cClip,
                  opacity: cOpac,
                  filter: `blur(${blurAmount}px) drop-shadow(0 40px 50px rgba(0,0,0,0.8))`
               }}>
                  <SmartMedia src={slot.path} style={{ width: slot.isHero ? '700px' : '450px', objectFit: 'contain' }} />
               </div>
             );
         })}
      </AbsoluteFill>

      {/* 8. Foreground FX */}
      {fgFx === 'Smoke' && <HeavySmoke />}
      {fgFx === 'Dust' && <VolumetricDust />}
      {fgFx === 'Light Rays' && <LightRays />}
      {fgFx === 'Glass Reflection' && <GlassReflection />}
      
      {/* 10. Light Director */}
      {light === 'Window Light' && <WindowLight />}
      {light === 'Edge Glow' && <EdgeGlow />}
      {light === 'Light Sweep' && (
         <AbsoluteFill style={{ 
            background: `linear-gradient(105deg, transparent, rgba(255,255,255,0.0), rgba(255,255,255,0.2), rgba(255,255,255,0.0), transparent)`,
            transform: `translateX(${interpolate(frame, [tPush, duration], [-2000, 2000])}px)`,
            mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 100
         }} />
      )}

      {/* Shake Dust Burst */}
      <DustBurst triggerFrame={Math.floor(t3)} />

      {/* 14. Audio Stack */}
      <Sequence from={0}>
        
        
        
        
      </Sequence>
      
      <Sequence from={Math.floor(t2)}>
         
         
      </Sequence>
      
      <Sequence from={Math.floor(t3)}>
         
         
      </Sequence>

      <Sequence from={Math.floor(tPush)}>
         
      </Sequence>
      
      {scene.transition !== 'fade' && (
        <Sequence from={Math.max(0, duration - 15)}>
          
        </Sequence>
      )}

    </AbsoluteFill>
  );
};

export const DocumentaryBoardScene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  
  const bgPath = mediaPaths[0] ? staticFile(mediaPaths[0]) : '';
  const docs = [mediaPaths[1], mediaPaths[2], mediaPaths[3]].filter(Boolean).map(p => staticFile(p));

  const seed = scene.scene_index || 0;
  const choice = (arr: any[]) => arr[Math.floor(seededRandom(seed + arr.length) * arr.length)];
  const random = (offset: number) => seededRandom(seed + offset);

  // 12. Dynamic Backgrounds
  const bgType = choice(['Wood Desk', 'Concrete', 'Dark Paper', 'Metal Table', 'Archive Texture']);
  const bgColors = {
     'Wood Desk': '#3d2b1f', 'Concrete': '#2a2a2a', 'Dark Paper': '#1a1a1a', 'Metal Table': '#222233', 'Archive Texture': '#2c2b29'
  };
  const bgColor = bgColors[bgType as keyof typeof bgColors] || '#111';

  // 1. Board Layout Director & 2. Asset Slots
  const layouts = [
    [{x:0,y:0,s:1},{x:-300,y:200,s:0.6},{x:300,y:-100,s:0.7}], // Investigation
    [{x:0,y:0,s:1},{x:300,y:100,s:0.6},{x:-200,y:-200,s:0.6}], // Desk View
    [{x:-200,y:0,s:0.8},{x:200,y:0,s:0.8},{x:0,y:300,s:0.5}], // Newspaper
    [{x:0,y:0,s:1},{x:-100,y:50,s:0.9},{x:100,y:100,s:0.8}], // Intelligence (Overlapping)
    [{x:-300,y:-100,s:0.6},{x:0,y:0,s:1},{x:300,y:100,s:0.7}], // Evidence Wall
    [{x:-200,y:-200,s:0.5},{x:200,y:-100,s:0.5},{x:0,y:100,s:1}], // Polaroid
    [{x:0,y:0,s:1},{x:0,y:0,s:0.9},{x:0,y:0,s:0.8}], // Gov File (Stacked)
    [{x:-100,y:0,s:1},{x:200,y:200,s:0.7},{x:200,y:-200,s:0.6}], // Financial
    [{x:0,y:100,s:1},{x:-300,y:-150,s:0.6},{x:300,y:-150,s:0.5}], // Blueprint
    [{x:0,y:0,s:1.2},{x:-400,y:300,s:0.5},{x:400,y:300,s:0.5}] // Magazine
  ];
  const layout = choice(layouts);

  // 6. Prop Generator (Tape, Pins, Clips, Strings)
  const numProps = 2 + Math.floor(random(50) * 4); // 2 to 5 props
  const props = Array.from({ length: numProps }).map((_, i) => ({
      type: choice(['Tape', 'Red String', 'Push Pin', 'Sticky Note', 'Paper Clip', 'Coffee Stain']),
      x: (random(i) - 0.5) * 800,
      y: (random(i+10) - 0.5) * 600,
      rot: random(i+20) * 360,
      scale: 0.5 + random(i+30) * 0.5
  }));

  const progress = frame / duration;
  const t1 = duration * 0.25;
  const t2 = duration * 0.5;
  const tPush = duration * 0.75;

  // 4. Camera Director
  const camDir = choice(['Slow Push', 'Orbit', 'Desk Pan', 'Tilt', 'Push + Pan']);
  let camZ = 500; let camX = 0; let camY = 0; let camRotZ = 0; let camRotX = 30; // angled down at desk
  
  if (camDir === 'Slow Push') camZ = interpolate(progress, [0, 1], [500, 200]);
  if (camDir === 'Orbit') camRotZ = interpolate(progress, [0, 1], [-10, 10]);
  if (camDir === 'Desk Pan') camX = interpolate(progress, [0, 1], [200, -200]);
  if (camDir === 'Tilt') camRotX = interpolate(progress, [0, 1], [40, 20]);
  if (camDir === 'Push + Pan') { camZ = interpolate(progress, [0, 1], [600, 200]); camX = interpolate(progress, [0, 1], [-200, 200]); }

  // 15. Scene Evolution (Push)
  if (frame > tPush) {
     const endProg = interpolate(frame, [tPush, duration], [0, 1], { extrapolateRight: 'clamp' });
     camZ -= endProg * 200;
  }

  // 8. Interaction
  let sysShake = 0;
  const shake1 = Math.max(0, frame - t1);
  const shake2 = Math.max(0, frame - t2);
  if (shake1 > 0 && shake1 < 10) sysShake += Math.sin(shake1 * 3) * interpolate(shake1, [0, 10], [10, 0]);
  if (shake2 > 0 && shake2 < 10) sysShake += Math.sin(shake2 * 3) * interpolate(shake2, [0, 10], [15, 0]);
  camX += sysShake;
  camY += sysShake;

  // 7. Focus Pull
  const getFocus = (idx: number) => {
     if (progress > 0.75) return 0; // whole board
     if (progress < 0.25) return 10; // bg only focus
     if (progress >= 0.25 && progress < 0.5 && idx === 0) return 0; // main doc
     if (progress >= 0.5 && progress < 0.75 && idx === 1) return 0; // second doc
     return 5;
  };

  const atmos = [choice(['Dust', 'Smoke', 'Grain', 'Light Rays', 'Paper Particles']), choice(['Dust', 'Smoke', 'Grain', 'Light Rays', 'Paper Particles'])];
  const light = choice(['Desk Lamp', 'Window Light', 'Flashlight Sweep', 'Edge Glow']);

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: 'hidden' }}>
       
       {bgPath && (
          <AbsoluteFill style={{ opacity: 0.3, filter: 'grayscale(50%) blur(5px)', transform: 'scale(1.2)' }}>
             <DualClipBackground scene={scene} duration={duration} isEven={isEven} />
          </AbsoluteFill>
       )}

       {/* Camera Rig */}
       <AbsoluteFill style={{
          transform: `perspective(1000px) translate3d(${camX}px, ${camY}px, ${camZ}px) rotateX(${camRotX}deg) rotateZ(${camRotZ}deg)`,
          transformStyle: 'preserve-3d',
          justifyContent: 'center', alignItems: 'center'
       }}>
           
           {/* Desk Level (Props) */}
           <AbsoluteFill style={{ zIndex: 1, pointerEvents: 'none', justifyContent: 'center', alignItems: 'center' }}>
              {props.map((p, i) => {
                  let content = null;
                  if (p.type === 'Tape') content = <div style={{ width: 80, height: 25, backgroundColor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(2px)' }}/>;
                  if (p.type === 'Push Pin') content = <div style={{ width: 15, height: 15, borderRadius: '50%', backgroundColor: 'red', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)' }}/>;
                  if (p.type === 'Coffee Stain') content = <div style={{ width: 100, height: 100, borderRadius: '50%', border: '4px solid rgba(80,50,20,0.3)', filter: 'blur(1px)' }}/>;
                  if (p.type === 'Sticky Note') content = <div style={{ width: 100, height: 100, backgroundColor: '#ffeb3b', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}/>;
                  if (p.type === 'Red String') content = <div style={{ width: 300, height: 2, backgroundColor: '#d32f2f', transformOrigin: 'left center' }}/>;
                  
                  return (
                     <div key={i} style={{ 
                        position: 'absolute', transform: `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rot}deg) scale(${p.scale})`,
                        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
                     }}>
                        {content}
                     </div>
                  );
              })}
           </AbsoluteFill>

           {/* Documents */}
           {docs.map((docPath, i) => {
               if (i >= layout.length) return null;
               const slot = layout[i];
               const tStart = i === 0 ? t1 : t2;
               const pActive = Math.max(0, frame - tStart);
               const spr = spring({ frame: pActive, fps, config: { damping: 16, stiffness: 80, mass: 1.5 } });
               
               if (pActive <= 0) return null;

               const entryDir = choice(['Paper Drop', 'Slide', 'Whip', 'Rotate', 'Stamp Down', 'Fade In']);
               let cx = slot.x; let cy = slot.y; let cz = i * 10; let cRot = random(i) * 10 - 5; let cScale = slot.s; let cOpac = 1;

               if (entryDir === 'Paper Drop') { cz += interpolate(spr, [0, 1], [500, 0]); cRot += interpolate(spr, [0, 1], [45, 0]); }
               if (entryDir === 'Slide') cy += interpolate(spr, [0, 1], [1000, 0]);
               if (entryDir === 'Whip') { cx += interpolate(spr, [0, 1], [-1000, 0]); cRot += interpolate(spr, [0, 1], [-45, 0]); }
               if (entryDir === 'Rotate') { cRot += interpolate(spr, [0, 1], [180, 0]); }
               if (entryDir === 'Stamp Down') { cScale *= interpolate(spr, [0, 1], [3, 1]); }
               if (entryDir === 'Fade In') cOpac = interpolate(spr, [0, 1], [0, 1]);

               // 9. Paper Physics
               // Micro bending
               const bendX = Math.sin((frame + i * 20) * 0.05) * 5;
               const bendY = Math.cos((frame + i * 20) * 0.05) * 5;
               const drift = Math.sin(frame * 0.02) * 5;

               // Interaction ripple
               if (i === 0 && shake2 > 0 && shake2 < 10) cz += Math.sin(shake2) * 20;

               const blur = getFocus(i);

               return (
                  <div key={i} style={{
                     position: 'absolute',
                     transform: `translate3d(${cx + drift}px, ${cy + drift}px, ${cz}px) rotateZ(${cRot}deg) rotateX(${bendX}deg) rotateY(${bendY}deg) scale(${cScale})`,
                     zIndex: 10 + i,
                     opacity: cOpac,
                     filter: `blur(${blur}px) drop-shadow(0 15px 25px rgba(0,0,0,0.6))`
                  }}>
                     <SmartMedia src={docPath} style={{ width: i === 0 ? '700px' : '500px', backgroundColor: 'white', padding: '10px' }} />
                  </div>
               );
           })}
       </AbsoluteFill>

       {/* 13. Atmosphere */}
       {atmos.includes('Dust') && <VolumetricDust />}
       {atmos.includes('Smoke') && <HeavySmoke />}
       {atmos.includes('Grain') && <FilmGrain />}
       {atmos.includes('Light Rays') && <LightRays />}

       {/* 10. Lighting */}
       {light === 'Desk Lamp' && (
          <div style={{ position: 'absolute', top: '-20%', left: '10%', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(255,220,150,0.2) 0%, transparent 70%)', mixBlendMode: 'overlay', pointerEvents: 'none' }}/>
       )}
       {light === 'Flashlight Sweep' && (
          <AbsoluteFill style={{ 
            background: `radial-gradient(circle at ${interpolate(frame, [t1, duration], [-20, 120])}% 50%, rgba(255,255,255,0.15) 0%, transparent 30%)`,
            mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 100
         }} />
       )}

       <DustBurst triggerFrame={Math.floor(t1)} />
       <DustBurst triggerFrame={Math.floor(t2)} />

       {/* 14. Audio Stack */}
       <Sequence from={0}>
          
       </Sequence>

       <Sequence from={Math.floor(t1)}>
          
          
          
       </Sequence>

       <Sequence from={Math.floor(t2)}>
          
          
       </Sequence>

       {scene.transition !== 'fade' && (
        <Sequence from={Math.max(0, duration - 15)}>
          
        </Sequence>
       )}

    </AbsoluteFill>
  );
};

export const TextTitleScene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  const textTitle = scene.text || (scene.words ? scene.words.map((w: any) => w.word).join(' ') : "MAIN TITLE");
  
  const bgPath = mediaPaths[0] ? staticFile(mediaPaths[0]) : '';

  const seed = scene.scene_index || 0;
  const choice = (arr: any[]) => arr[Math.floor(seededRandom(seed + arr.length) * arr.length)];

  // Background Director
  const progress = frame / duration;
  const bgS = interpolate(progress, [0, 1], [1.1, 1.3]);
  const bgX = interpolate(progress, [0, 1], [-50, 50]);
  const bgBlur = interpolate(progress, [0, 0.2, 0.8, 1], [0, 10, 10, 0]);

  // Premium Typography Setup
  const words = textTitle.split(' ');
  const isSplit = words.length >= 2 && choice([true, false]);
  
  const tEntry = duration * 0.15;
  const activeFrame = Math.max(0, frame - tEntry);

  return (
    <AbsoluteFill style={{ backgroundColor: '#050A10', overflow: 'hidden' }}>
       {/* Cinematic Background */}
       {bgPath && (
          <AbsoluteFill style={{ 
              opacity: 0.5, 
              filter: `blur(${bgBlur}px) brightness(60%) contrast(120%)`, 
              transform: `scale(${bgS}) translateX(${bgX}px)`
          }}>
             <DualClipBackground scene={scene} duration={duration} isEven={isEven} />
          </AbsoluteFill>
       )}

       <AbsoluteFill style={{
          justifyContent: 'center', alignItems: 'center',
          perspective: '1500px', padding: '50px'
       }}>
          <div style={{
             display: 'flex', 
             flexDirection: isSplit ? 'column' : 'row',
             gap: isSplit ? '20px' : '40px',
             alignItems: 'center',
             justifyContent: 'center',
             textAlign: 'center',
             transform: `scale(${interpolate(progress, [0, 1], [1, 1.1])})`
          }}>
             {words.map((word, wIdx) => {
                const chars = word.split('');
                return (
                   <div key={wIdx} style={{ display: 'flex', overflow: 'hidden', padding: '20px' }}>
                      {chars.map((char, cIdx) => {
                         const delay = (wIdx * 10) + (cIdx * 2);
                         const charFrame = Math.max(0, activeFrame - delay);
                         const pop = spring({ frame: charFrame, fps, config: { damping: 14, stiffness: 60 } });
                         const charY = interpolate(pop, [0, 1], [150, 0]);
                         const charRot = interpolate(pop, [0, 1], [45, 0]);
                         
                         const isAccent = wIdx === Math.floor(words.length / 2) && words.length > 1;
                         const color = isAccent ? '#00E5FF' : '#FFFFFF';
                         const textShadow = isAccent 
                            ? `0 0 40px rgba(0,229,255,0.6), 0 10px 30px rgba(0,0,0,0.8)` 
                            : `0 10px 40px rgba(0,0,0,0.8)`;

                         return (
                            <span key={cIdx} style={{
                               fontFamily: '"Inter", "Roboto", sans-serif',
                               fontSize: isSplit ? '140px' : '100px',
                               fontWeight: 900,
                               color,
                               textShadow,
                               letterSpacing: '10px',
                               textTransform: 'uppercase',
                               display: 'inline-block',
                               transform: `translateY(${charY}px) rotateX(${charRot}deg)`,
                               opacity: pop,
                               marginLeft: char === ' ' ? '30px' : '0'
                            }}>
                               {char}
                            </span>
                         );
                      })}
                   </div>
                );
             })}
          </div>
       </AbsoluteFill>

       <VolumetricDust />
       <WindowLight />
    </AbsoluteFill>
  );
};

export const SplitScreenScene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  
  const vid1 = mediaPaths[0] ? staticFile(mediaPaths[0]) : '';
  const vid2 = mediaPaths[1] ? staticFile(mediaPaths[1]) : '';
  const vid3 = mediaPaths[2] ? staticFile(mediaPaths[2]) : ''; // For triple split

  const seed = scene.scene_index || 0;
  const choice = (arr: any[]) => arr[Math.floor(seededRandom(seed + arr.length) * arr.length)];
  const random = (offset: number) => seededRandom(seed + offset);

  // 1. Layout Director
  const layouts = ['Vertical', 'Horizontal', 'Diagonal', '70/30', '30/70', 'Center Window', 'Triple Split', 'Offset Split', 'Floating Cards', 'Before/After', 'Picture in Picture', 'Expanding Split'];
  let layout = choice(layouts);
  if (layout === 'Triple Split' && !vid3) layout = 'Vertical'; // fallback if only 2 assets

  // 6 & 7. Comparison Director
  const winnerSide = choice(['Left', 'Right']);
  const isLWin = winnerSide === 'Left';

  const progress = frame / duration;
  const tReveal = duration * 0.25;
  const tFocusL = duration * 0.50;
  const tFocusR = duration * 0.75;
  
  // 4 & 13. Attention & Scene Evolution
  let blurL = 0; let blurR = 0;
  let brightL = 100; let brightR = 100;
  if (progress < 0.25) { blurL = 0; blurR = 0; } // Reveal
  else if (progress < 0.5) { // Left Dom
      blurL = isLWin ? 0 : 5; blurR = 15;
      brightL = 110; brightR = 70;
  }
  else if (progress < 0.75) { // Right Dom
      blurL = 15; blurR = !isLWin ? 0 : 5;
      brightL = 70; brightR = 110;
  }
  else { // Merge Both
      blurL = isLWin ? 0 : 5; blurR = !isLWin ? 0 : 5;
      brightL = isLWin ? 100 : 80; brightR = !isLWin ? 100 : 80;
  }

  // 6. Reveal Director
  const revealMode = choice(['Wipe', 'Expand', 'Split Open', 'Whip', 'Mask', 'Flash', 'Push Apart']);
  const pActive = Math.max(0, frame - 5); // start slightly after frame 0
  const spr = spring({ frame: pActive, fps, config: { damping: 14 } });

  // Compute Wipe value (0 to 100)
  let wipeAnim = 0;
  if (revealMode === 'Wipe') wipeAnim = interpolate(spr, [0, 1], [0, 100]);
  if (revealMode === 'Split Open') wipeAnim = interpolate(spr, [0, 1], [0, 100]);
  if (revealMode === 'Expand') wipeAnim = interpolate(spr, [0, 1], [0, 100]);
  else wipeAnim = interpolate(spr, [0, 1], [0, 100]); // fallback

  // Layout Clips
  let clipL = ''; let clipR = ''; let clip3 = '';
  
  if (layout === 'Vertical' || layout === 'Before/After' || layout === 'Push Apart') {
      clipL = `polygon(0 0, ${wipeAnim / 2}% 0, ${wipeAnim / 2}% 100%, 0 100%)`;
      clipR = `polygon(${100 - wipeAnim / 2}% 0, 100% 0, 100% 100%, ${100 - wipeAnim / 2}% 100%)`;
  } else if (layout === 'Horizontal') {
      clipL = `polygon(0 0, 100% 0, 100% ${wipeAnim / 2}%, 0 ${wipeAnim / 2}%)`;
      clipR = `polygon(0 ${100 - wipeAnim / 2}%, 100% ${100 - wipeAnim / 2}%, 100% 100%, 0 100%)`;
  } else if (layout === 'Diagonal') {
      clipL = `polygon(0 0, ${wipeAnim}% 0, 0 ${wipeAnim}%)`;
      clipR = `polygon(100% 100%, ${100 - wipeAnim}% 100%, 100% ${100 - wipeAnim}%)`;
  } else if (layout === '70/30') {
      clipL = `polygon(0 0, ${wipeAnim * 0.7}% 0, ${wipeAnim * 0.7}% 100%, 0 100%)`;
      clipR = `polygon(${100 - wipeAnim * 0.3}% 0, 100% 0, 100% 100%, ${100 - wipeAnim * 0.3}% 100%)`;
  } else if (layout === '30/70') {
      clipL = `polygon(0 0, ${wipeAnim * 0.3}% 0, ${wipeAnim * 0.3}% 100%, 0 100%)`;
      clipR = `polygon(${100 - wipeAnim * 0.7}% 0, 100% 0, 100% 100%, ${100 - wipeAnim * 0.7}% 100%)`;
  } else if (layout === 'Picture in Picture') {
      clipL = `polygon(0 0, 100% 0, 100% 100%, 0 100%)`; // BG
      const pipS = wipeAnim * 0.3; // 0 to 30%
      clipR = `polygon(${100-pipS}% ${100-pipS}%, 100% ${100-pipS}%, 100% 100%, ${100-pipS}% 100%)`;
  } else if (layout === 'Triple Split') {
      clipL = `polygon(0 0, ${wipeAnim * 0.33}% 0, ${wipeAnim * 0.33}% 100%, 0 100%)`;
      clipR = `polygon(${100 - wipeAnim * 0.33}% 0, 100% 0, 100% 100%, ${100 - wipeAnim * 0.33}% 100%)`;
      clip3 = `polygon(${wipeAnim * 0.33}% 0, ${100 - wipeAnim * 0.33}% 0, ${100 - wipeAnim * 0.33}% 100%, ${wipeAnim * 0.33}% 100%)`;
  } else {
      clipL = `polygon(0 0, ${wipeAnim / 2}% 0, ${wipeAnim / 2}% 100%, 0 100%)`;
      clipR = `polygon(${100 - wipeAnim / 2}% 0, 100% 0, 100% 100%, ${100 - wipeAnim / 2}% 100%)`;
  }

  // 3. Camera Director (Independent)
  const getCamTransform = (camType: string, isWinner: boolean) => {
      // 11. Adaptive scale: winner gets 1.2x, loser 0.9x base
      const sBase = isWinner ? 1.2 : 0.95;
      if (camType === 'Push') return `scale(${interpolate(progress, [0, 1], [sBase, sBase + 0.3])})`;
      if (camType === 'Pull') return `scale(${interpolate(progress, [0, 1], [sBase + 0.3, sBase])})`;
      if (camType === 'Pan') return `scale(${sBase + 0.2}) translateX(${interpolate(progress, [0, 1], [-50, 50])}px)`;
      if (camType === 'Orbit') return `perspective(600px) rotateY(${interpolate(progress, [0, 1], [-10, 10])}deg) scale(${sBase + 0.1})`;
      if (camType === 'Tilt') return `scale(${sBase + 0.2}) translateY(${interpolate(progress, [0, 1], [-50, 50])}px)`;
      return `scale(${sBase})`;
  };
  
  const transL = getCamTransform(choice(['Push', 'Pull', 'Orbit', 'Pan', 'Tilt']), isLWin);
  const transR = getCamTransform(choice(['Push', 'Pull', 'Orbit', 'Pan', 'Tilt']), !isLWin);
  const trans3 = getCamTransform('Push', false);

  // 5. Divider Director
  const divType = choice(['Glass', 'Neon', 'Light Beam', 'Paper Tear', 'Smoke Gap', 'Burning Edge', 'Metal Strip', 'Glow Line']);

  // 8. Interaction (Shake/Glow)
  let divShake = 0; let divGlow = 0;
  if (pActive > 0 && pActive < 15) {
     divShake = Math.sin(pActive * 4) * interpolate(pActive, [0, 15], [30, 0]);
     divGlow = interpolate(pActive, [0, 15], [40, 0]);
  }

  // 10. Atmos
  const atmosL = choice(['Smoke', 'Dust', 'Grain', 'Rays', 'Fog', 'Bokeh']);
  const atmosR = choice(['Smoke', 'Dust', 'Grain', 'Rays', 'Fog', 'Bokeh']);

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', overflow: 'hidden' }}>
       
       {/* Left Side */}
       <AbsoluteFill style={{ clipPath: clipL, filter: `blur(${blurL}px) brightness(${brightL}%)`, zIndex: layout === 'Picture in Picture' ? 1 : 10 }}>
           <AbsoluteFill style={{ transform: transL, transformOrigin: 'center center' }}>
              {vid1 && <KenBurnsMedia src={vid1} type={vid1.endsWith('.mp4') ? 'video' : 'image'} duration={duration} isEven={isEven} />}
           </AbsoluteFill>
           <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
             {atmosL === 'Dust' && <VolumetricDust />}
             {atmosL === 'Grain' && <FilmGrain />}
             {atmosL === 'Fog' && <HeavySmoke />}
           </AbsoluteFill>
       </AbsoluteFill>

       {/* Triple Split Center */}
       {clip3 && (
         <AbsoluteFill style={{ clipPath: clip3, zIndex: 10 }}>
             <AbsoluteFill style={{ transform: trans3, transformOrigin: 'center center' }}>
                {vid3 && <KenBurnsMedia src={vid3} type={vid3.endsWith('.mp4') ? 'video' : 'image'} duration={duration} isEven={true} />}
             </AbsoluteFill>
         </AbsoluteFill>
       )}

       {/* Right Side */}
       <AbsoluteFill style={{ clipPath: clipR, filter: `blur(${blurR}px) brightness(${brightR}%)`, zIndex: layout === 'Picture in Picture' ? 20 : 10 }}>
           <AbsoluteFill style={{ transform: transR, transformOrigin: 'center center' }}>
              {vid2 && <KenBurnsMedia src={vid2} type={vid2.endsWith('.mp4') ? 'video' : 'image'} duration={duration} isEven={!isEven} />}
           </AbsoluteFill>
           <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
             {atmosR === 'Dust' && <VolumetricDust />}
             {atmosR === 'Smoke' && <HeavySmoke />}
             {atmosR === 'Rays' && <LightRays />}
           </AbsoluteFill>
       </AbsoluteFill>

       {/* Divider FX */}
       {pActive > 0 && layout !== 'Picture in Picture' && (
          <AbsoluteFill style={{ pointerEvents: 'none', transform: `translateX(${divShake}px)`, zIndex: 30 }}>
             {divType === 'Glow Line' && <div style={{ position: 'absolute', top: 0, left: '50%', width: 4, height: '100%', backgroundColor: 'white', boxShadow: `0 0 ${20 + divGlow}px ${10 + divGlow/2}px #0ff`, transform: 'translateX(-50%)' }} />}
             {divType === 'Neon' && <div style={{ position: 'absolute', top: 0, left: '50%', width: 8, height: '100%', backgroundColor: '#fff', boxShadow: `0 0 ${30 + divGlow}px 15px rgba(255,255,255,0.8)`, transform: 'translateX(-50%)' }} />}
             {divType === 'Glass' && <div style={{ position: 'absolute', top: 0, left: '49%', width: '2%', height: '100%', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }} />}
             {divType === 'Light Beam' && <div style={{ position: 'absolute', top: 0, left: '40%', width: '20%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', filter: 'blur(10px)', mixBlendMode: 'overlay' }} />}
             {divType === 'Metal Strip' && <div style={{ position: 'absolute', top: 0, left: '49.5%', width: '1%', height: '100%', background: 'linear-gradient(90deg, #555, #ccc, #fff, #aaa, #333)' }} />}
             {/* Fallback */}
             {!['Glow Line', 'Neon', 'Glass', 'Light Beam', 'Metal Strip'].includes(divType) && <div style={{ position: 'absolute', top: 0, left: '50%', width: 4, height: '100%', backgroundColor: 'white', transform: 'translateX(-50%)' }} />}
          </AbsoluteFill>
       )}

       {/* 9. Cross Interaction (Global FX) */}
       <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 40, mixBlendMode: 'screen', opacity: 0.5 }}>
          {choice(['Sweep', 'None']) === 'Sweep' && (
             <div style={{ position: 'absolute', width: '200%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', transform: `translateX(${interpolate(frame, [0, duration], [-100, 50])}%)` }} />
          )}
          <VolumetricDust />
       </AbsoluteFill>

       {/* 12. Audio Stack */}
       <Sequence from={0}>
          
       </Sequence>

       <Sequence from={Math.floor(tReveal)}>
          
          
       </Sequence>
       
       <Sequence from={Math.floor(tFocusL)}>
          
       </Sequence>
       
       <Sequence from={Math.floor(tFocusR)}>
          
       </Sequence>

       {scene.transition !== 'fade' && (
        <Sequence from={Math.max(0, duration - 15)}>
          
        </Sequence>
       )}

    </AbsoluteFill>
  );
};

export const DynamicMosaicScene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  
  const seed = scene.scene_index || 0;
  const choice = (arr: any[]) => arr[Math.floor(seededRandom(seed + arr.length) * arr.length)];
  const random = (offset: number) => seededRandom(seed + offset);

  // 1. Mosaic Director (15 Layouts mapped to CSS Grid)
  const layouts = [
     // 1. Classic 2x2
     { cols: '1fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3', '2 / 1 / 3 / 2', '2 / 2 / 3 / 3'] },
     // 2. Hero + 3 Small (Left hero)
     { cols: '2fr 1fr', rows: '1fr 1fr 1fr', areas: ['1 / 1 / 4 / 2', '1 / 2 / 2 / 3', '2 / 2 / 3 / 3', '3 / 2 / 4 / 3'] },
     // 3. One V + Two H
     { cols: '1fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 3 / 2', '1 / 2 / 2 / 3', '2 / 2 / 3 / 3', 'none'] },
     // 4. Magazine Grid
     { cols: '1.5fr 1fr', rows: '1fr 1.5fr', areas: ['1 / 1 / 2 / 2', '1 / 2 / 3 / 3', '2 / 1 / 3 / 2', 'none'] },
     // 5. Asymmetrical
     { cols: '1fr 1.5fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 2 / 2', '1 / 2 / 3 / 3', '1 / 3 / 2 / 4', '2 / 1 / 3 / 2'] },
     // 6. Golden Ratio
     { cols: '1fr 0.618fr', rows: '1fr 0.618fr', areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3', '2 / 1 / 3 / 2', '2 / 2 / 3 / 3'] },
     // 7. Bento Grid
     { cols: '1fr 1fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 3 / 2', '1 / 2 / 2 / 3', '1 / 3 / 2 / 4', '2 / 2 / 3 / 4'] },
     // 8. Triple Stack
     { cols: '1fr', rows: '1fr 1fr 1fr', areas: ['1 / 1 / 2 / 2', '2 / 1 / 3 / 2', '3 / 1 / 4 / 2', 'none'] },
     // 9. Four Floating Cards (simulated with large gaps)
     { cols: '1fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3', '2 / 1 / 3 / 2', '2 / 2 / 3 / 3'], gap: '50px', padding: '50px' },
     // 10. Offset Grid
     { cols: '1fr 1fr', rows: '1fr 1fr 1fr', areas: ['1 / 1 / 3 / 2', '2 / 2 / 4 / 3', 'none', 'none'] },
     // 11. Pyramid
     { cols: '1fr 1fr 1fr', rows: '1fr 1fr', areas: ['1 / 2 / 2 / 3', '2 / 1 / 3 / 2', '2 / 2 / 3 / 3', '2 / 3 / 3 / 4'] },
     // 12. Timeline Mosaic
     { cols: '1fr 1fr 1fr 1fr', rows: '1fr', areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3', '1 / 3 / 2 / 4', '1 / 4 / 2 / 5'] },
     // 13. Window Mosaic
     { cols: '1fr 2fr 1fr', rows: '1fr', areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3', '1 / 3 / 2 / 4', 'none'] },
     // 14. Expanding Grid (Center focus)
     { cols: '1fr 2fr 1fr', rows: '1fr 2fr 1fr', areas: ['2 / 2 / 3 / 3', '1 / 1 / 2 / 4', '3 / 1 / 4 / 2', '3 / 2 / 4 / 4'] },
     // 15. Cinematic Wall
     { cols: '2fr 1fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 3 / 2', '1 / 2 / 2 / 4', '2 / 2 / 3 / 3', '2 / 3 / 3 / 4'] }
  ];
  const layout = choice(layouts);

  // 2. Dominance Director
  const domIdx = Math.floor(random(0) * 4); // 0 to 3

  const progress = frame / duration;
  
  // 6. Camera Director
  const outerCam = choice(['Push', 'Orbit', 'Pan', 'Dolly', 'Tilt']);
  const getCamTransform = (camType: string, isOuter: boolean, p: number) => {
      const s = isOuter ? 1.05 : 1.2;
      if (camType === 'Push') return `scale(${interpolate(p, [0, 1], [s, s + 0.1])})`;
      if (camType === 'Pull') return `scale(${interpolate(p, [0, 1], [s + 0.1, s])})`;
      if (camType === 'Pan') return `scale(${s + 0.1}) translateX(${interpolate(p, [0, 1], [-20, 20])}px)`;
      if (camType === 'Orbit') return `perspective(800px) rotateY(${interpolate(p, [0, 1], [-5, 5])}deg) scale(${s})`;
      if (camType === 'Tilt') return `scale(${s + 0.1}) translateY(${interpolate(p, [0, 1], [-20, 20])}px)`;
      if (camType === 'Dolly') return `scale(${s + 0.1}) translateX(${interpolate(p, [0, 1], [20, -20])}px)`;
      return `scale(${s})`;
  };

  // 8. Dynamic Borders
  const borderType = choice(['Glass', 'Glow', 'Gold', 'Metal', 'Neon', 'Soft Shadow', 'Paper']);
  const getBorderStyle = (bType: string) => {
     if (bType === 'Glass') return { border: '2px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' };
     if (bType === 'Glow') return { border: '1px solid #fff', boxShadow: '0 0 20px rgba(255,255,255,0.5)' };
     if (bType === 'Gold') return { border: '4px solid #D4AF37' };
     if (bType === 'Metal') return { border: '3px solid #888' };
     if (bType === 'Neon') return { border: '2px solid #0ff', boxShadow: '0 0 15px #0ff' };
     if (bType === 'Soft Shadow') return { border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' };
     if (bType === 'Paper') return { border: '10px solid #f4f4f4' };
     return { border: '2px solid #333' }; // Fallback
  };
  const bStyle = getBorderStyle(borderType);

  // 12. Atmosphere
  const atmosChoices = ['Dust', 'Smoke', 'Grain', 'Fog', 'Rays', 'Bokeh'];
  const atmos1 = choice(atmosChoices);
  const atmos2 = choice(atmosChoices);

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', overflow: 'hidden' }}>
       {/* 6. Whole Mosaic wrapper */}
       <AbsoluteFill style={{ transform: getCamTransform(outerCam, true, progress) }}>
          <div style={{
             display: 'grid', width: '100%', height: '100%',
             gridTemplateColumns: layout.cols,
             gridTemplateRows: layout.rows,
             gap: layout.gap || '0px',
             padding: layout.padding || '0px'
          }}>
             {[0,1,2,3].map(i => {
                const mediaPath = mediaPaths[i];
                if (!mediaPath || layout.areas[i] === 'none') return null;

                // 4. Panel Director
                const cam = choice(['Push', 'Pull', 'Orbit', 'Pan', 'Tilt']);
                // 3. Sequential Reveal (0-20, 20-40, 40-60, 60-80)
                const startT = duration * (i * 0.2);
                const spr = spring({ frame: Math.max(0, frame - startT), fps, config: { damping: 14 } });
                
                // 5. Entry
                const entry = choice(['Scale', 'Slide', 'Whip', 'Mask', 'Blur']);
                let tScale = 1; let tX = 0; let tOpac = 1; let tClip = 'none'; let tBlur = 0;
                if (entry === 'Scale') { tScale = interpolate(spr, [0,1], [0,1]); tOpac = interpolate(spr, [0,1], [0,1]); }
                if (entry === 'Slide') { tX = interpolate(spr, [0,1], [1000, 0]); }
                if (entry === 'Whip') { tX = interpolate(spr, [0,1], [-1000, 0]); }
                if (entry === 'Mask') { tClip = `inset(0 0 ${interpolate(spr, [0,1], [100, 0])}% 0)`; }
                if (entry === 'Blur') { tBlur = interpolate(spr, [0,1], [50, 0]); tOpac = interpolate(spr, [0,1], [0,1]); }

                // 7. Focus Director
                let focusBlur = 0;
                if (progress > 0.25 && progress < 0.75 && i !== domIdx) focusBlur = 10;

                // 10. Hero Promotion (Dominant panel expands 50-75)
                const isPromo = (i === domIdx && progress >= 0.5 && progress < 0.75);
                const promoSpr = spring({ frame: Math.max(0, frame - duration * 0.5), fps, config: { damping: 14 } });
                const promoDownSpr = spring({ frame: Math.max(0, frame - duration * 0.75), fps, config: { damping: 14 } });
                let combinedPromo = isPromo ? promoSpr : 0;
                if (progress >= 0.75) combinedPromo = interpolate(promoDownSpr, [0,1], [1,0]); // Collapse

                // Default vs Expanded styles
                let cellStyle: React.CSSProperties = {
                   gridArea: layout.areas[i],
                   position: 'relative', overflow: 'hidden',
                   transform: `scale(${tScale}) translateX(${tX}px)`,
                   opacity: tOpac, clipPath: tClip,
                   filter: `blur(${tBlur + focusBlur}px)`,
                   zIndex: i === domIdx ? 10 : 1,
                   ...bStyle
                };

                if (combinedPromo > 0.01) {
                   cellStyle = {
                      ...cellStyle,
                      zIndex: 100,
                      transform: `scale(${tScale + combinedPromo * 0.5})`, // Scale up by 1.5x
                      boxShadow: `0 30px 100px rgba(0,0,0,${combinedPromo})`
                   };
                }

                return (
                   <div key={i} style={cellStyle}>
                      <AbsoluteFill style={{ transform: getCamTransform(cam, false, progress), transformOrigin: 'center center' }}>
                         <KenBurnsMedia src={staticFile(mediaPath)} type={mediaPath.endsWith('.mp4') ? 'video' : 'image'} duration={duration} isEven={isEven ? i%2===0 : i%2!==0} />
                      </AbsoluteFill>
                   </div>
                );
             })}
          </div>
       </AbsoluteFill>

       {/* 9. Cross-Panel Interaction (Global FX) */}
       <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 50, mixBlendMode: 'screen', opacity: 0.6 }}>
          {(atmos1 === 'Dust' || atmos2 === 'Dust' || atmos1 === 'Bokeh') && <VolumetricDust />}
          {(atmos1 === 'Grain' || atmos2 === 'Grain') && <FilmGrain />}
          {(atmos1 === 'Rays' || atmos2 === 'Rays') && <LightRays />}
          {(atmos1 === 'Smoke' || atmos2 === 'Smoke' || atmos1 === 'Fog') && <HeavySmoke />}
          <div style={{ position: 'absolute', width: '200%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', transform: `translateX(${interpolate(frame, [0, duration], [-100, 50])}%)` }} />
       </AbsoluteFill>

       {/* 13. Audio */}
       <Sequence from={0}>
          
          
       </Sequence>
       <Sequence from={Math.floor(duration * 0.2)}>
          
       </Sequence>
       <Sequence from={Math.floor(duration * 0.4)}>
          
       </Sequence>
       <Sequence from={Math.floor(duration * 0.5)}>
          {/* Hero Promotion Boom */}
          
       </Sequence>
       {scene.transition !== 'fade' && (
        <Sequence from={Math.max(0, duration - 15)}>
          
        </Sequence>
       )}
    </AbsoluteFill>
  );
};

export const ParallaxCollageScene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  
  const seed = scene.scene_index || 0;
  const choice = (arr: any[]) => arr[Math.floor(seededRandom(seed + arr.length) * arr.length)];
  const random = (offset: number) => seededRandom(seed + offset);

  // 1. Collage Director
  const layouts = ['Hero Left', 'Hero Right', 'Hero Center', 'Magazine', 'Bento', 'Layer Stack', 'Documentary', 'Floating Cards', 'Offset Cards', 'Pyramid', 'Cascade', 'Circle', 'Evidence Collage', 'Scattered', 'Cinematic Wall'];
  const layout = choice(layouts);

  // 5. Camera Director
  const camType = choice(['Push', 'Orbit', 'Dolly', 'Tilt', 'Pan', 'Push + Orbit']);
  const progress = frame / duration;
  
  // 7. Dynamic Parallax calculations
  const getCamState = (pMultiplier: number) => {
     let scale = 1; let x = 0; let y = 0; let rotY = 0;
     const tP = progress * pMultiplier;
     if (camType === 'Push' || camType === 'Push + Orbit') scale = interpolate(progress, [0, 1], [1, 1 + 0.3 * pMultiplier]);
     if (camType === 'Orbit' || camType === 'Push + Orbit') rotY = interpolate(progress, [0, 1], [-5 * pMultiplier, 5 * pMultiplier]);
     if (camType === 'Dolly') x = interpolate(progress, [0, 1], [-100 * pMultiplier, 100 * pMultiplier]);
     if (camType === 'Pan') x = interpolate(progress, [0, 1], [100 * pMultiplier, -100 * pMultiplier]);
     if (camType === 'Tilt') y = interpolate(progress, [0, 1], [-100 * pMultiplier, 100 * pMultiplier]);
     return { scale, x, y, rotY };
  };

  // 10. Lighting
  const light = choice(['Rim Light', 'Window Light', 'Edge Glow', 'Light Sweep', 'Lens Flare']);

  // 12. Atmosphere
  const atmosChoices = ['Smoke', 'Dust', 'Grain', 'Rays', 'Fog', 'Floating Paper'];
  const atmos1 = choice(atmosChoices);
  const atmos2 = choice(atmosChoices);

  // 2. Layer Director & 4. Hero Promotion
  const planes = [
     { role: 'BG', z: -1000, pMult: 0.2, enterT: 0, w: '100%', h: '100%', top: '0', left: '0' },
     { role: 'Mid', z: -400, pMult: 0.6, enterT: 0.4, w: '60%', h: '70%', top: '15%', left: choice(['10%', '30%']) },
     { role: 'Hero', z: 0, pMult: 1.0, enterT: 0.2, w: '50%', h: '80%', top: '10%', left: layout === 'Hero Left' ? '5%' : layout === 'Hero Right' ? '45%' : '25%' },
     { role: 'Fore', z: 400, pMult: 1.4, enterT: 0.4, w: '40%', h: '50%', top: '40%', left: choice(['50%', '10%']) }
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', perspective: '1200px' }}>
       {/* 9. Cross Layer Interaction: Background FX */}
       <AbsoluteFill style={{ transform: 'translateZ(-1500px)', opacity: 0.5, mixBlendMode: 'screen' }}>
           {(atmos1 === 'Smoke' || atmos2 === 'Smoke' || atmos1 === 'Fog') && <HeavySmoke />}
           {(atmos1 === 'Dust' || atmos2 === 'Dust') && <VolumetricDust />}
       </AbsoluteFill>

       {mediaPaths.map((media, idx) => {
           if (idx > 3) return null;
           // Assign plane by idx. If exactly 3 assets, make sure we get BG, Hero, Fore.
           let plane = planes[idx]; 
           if (mediaPaths.length === 3) {
              if (idx === 0) plane = planes[0]; // BG
              if (idx === 1) plane = planes[2]; // Hero
              if (idx === 2) plane = planes[3]; // Fore
           }
           if (!plane) plane = planes[idx % 4];

           // 13. Card Physics
           const driftX = Math.sin(frame * 0.01 + idx) * 20;
           const driftY = Math.cos(frame * 0.01 + idx) * 20;
           const driftRot = Math.sin(frame * 0.02 + idx) * 2;

           // 6. Card Entry & 14. Scene Evolution timing
           const entry = choice(['Slide', 'Whip', 'Scale', 'Blur', 'Mask', 'Paper Drop', 'Flash', 'Rotate']);
           const tStart = duration * plane.enterT;
           const pActive = Math.max(0, frame - tStart);
           const spr = spring({ frame: pActive, fps, config: { damping: 14, mass: 1.5 } });

           let tS = 1; let tX = 0; let tY = 0; let tOpac = 1; let tBlur = 0; let tClip = 'none'; let tRot = 0;
           if (entry === 'Scale') { tS = interpolate(spr, [0,1], [0,1]); tOpac = interpolate(spr, [0,1], [0,1]); }
           if (entry === 'Slide') { tY = interpolate(spr, [0,1], [1000, 0]); }
           if (entry === 'Whip') { tX = interpolate(spr, [0,1], [-1000, 0]); tRot = interpolate(spr, [0,1], [-45, 0]); }
           if (entry === 'Blur') { tBlur = interpolate(spr, [0,1], [40, 0]); tOpac = interpolate(spr, [0,1], [0,1]); }
           if (entry === 'Mask') { tClip = `inset(0 0 ${interpolate(spr, [0,1], [100, 0])}% 0)`; }
           if (entry === 'Paper Drop') { tS = interpolate(spr, [0,1], [2, 1]); tOpac = interpolate(spr, [0,1], [0,1]); }
           if (entry === 'Flash') { tOpac = interpolate(spr, [0,1], [0,1]); }
           if (entry === 'Rotate') { tRot = interpolate(spr, [0,1], [90, 0]); tOpac = interpolate(spr, [0,1], [0,1]); }

           // 7. Parallax Cam logic
           const cState = getCamState(plane.pMult);

           // 8. Focus Director (Shifts focus)
           // BG starts sharp, then blurs when Hero enters. Secondary cards stay slightly blurred.
           let focusBlur = 0;
           if (plane.role === 'BG' && progress > 0.3) focusBlur = 10;
           if (plane.role !== 'Hero' && plane.role !== 'BG' && progress > 0.4 && progress < 0.8) focusBlur = 5;

           // 3. Card Director (Border/Shadow)
           const border = choice(['none', '10px solid white', '4px solid #D4AF37', '2px solid rgba(255,255,255,0.2)']);
           const shadow = choice(['0 30px 60px rgba(0,0,0,0.8)', '0 10px 20px rgba(0,0,0,0.5)', 'none']);
           // 11. Adaptive Composition: Base rotation
           const baseRot = plane.role === 'BG' ? 0 : (random(idx) * 10 - 5);

           return (
              <AbsoluteFill key={idx} style={{
                 transformStyle: 'preserve-3d',
                 transform: `translateZ(${plane.z}px) scale(${cState.scale}) translateX(${cState.x}px) translateY(${cState.y}px) rotateY(${cState.rotY}deg)`
              }}>
                 {pActive > 0 && (
                    <div style={{
                       position: 'absolute',
                       top: plane.top, left: plane.left, width: plane.w, height: plane.h,
                       border: plane.role === 'BG' ? 'none' : border,
                       boxShadow: plane.role === 'BG' ? 'none' : shadow,
                       transform: `scale(${tS}) translateX(${tX + driftX}px) translateY(${tY + driftY}px) rotate(${tRot + baseRot + driftRot}deg)`,
                       opacity: tOpac, clipPath: tClip,
                       filter: `blur(${tBlur + focusBlur}px)`,
                       overflow: 'hidden'
                    }}>
                       <KenBurnsMedia src={staticFile(media)} type={media.endsWith('.mp4') ? 'video' : 'image'} duration={duration} isEven={isEven ? idx%2===0 : idx%2!==0} />
                    </div>
                 )}
              </AbsoluteFill>
           );
       })}

       {/* 9. Cross Layer Interaction: Foreground FX */}
       <AbsoluteFill style={{ transform: 'translateZ(600px)', pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.7 }}>
           {atmos1 === 'Floating Paper' && <VolumetricDust />}
           {(atmos1 === 'Grain' || atmos2 === 'Grain') && <FilmGrain />}
           {(atmos1 === 'Rays' || atmos2 === 'Rays' || light === 'Lens Flare') && <LightRays />}
           {light === 'Window Light' && <WindowLight />}
           {light === 'Edge Glow' && <EdgeGlow />}
           {light === 'Light Sweep' && (
              <div style={{ position: 'absolute', width: '200%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', transform: `translateX(${interpolate(frame, [0, duration], [-100, 50])}%)` }} />
           )}
       </AbsoluteFill>

       {/* 15. Audio */}
       <Sequence from={0}>
          
       </Sequence>
       <Sequence from={Math.floor(duration * 0.2)}>
          
          
       </Sequence>
       <Sequence from={Math.floor(duration * 0.4)}>
          
       </Sequence>
       {scene.transition !== 'fade' && (
        <Sequence from={Math.max(0, duration - 15)}>
          
        </Sequence>
       )}
    </AbsoluteFill>
  );
};

export const Style10Scene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  
  const seed = scene.scene_index || 0;
  const choice = (arr: any[]) => arr[Math.floor(seededRandom(seed + arr.length) * arr.length)];
  const random = (offset: number) => seededRandom(seed + offset);

  // 1. Timeline Layouts
  const layouts = [
     { name: 'Horizontal', pts: [{x: 20, y: 50}, {x: 50, y: 50}, {x: 80, y: 50}] },
     { name: 'Vertical', pts: [{x: 50, y: 20}, {x: 50, y: 50}, {x: 50, y: 80}] },
     { name: 'Curved', pts: [{x: 10, y: 30}, {x: 50, y: 70}, {x: 90, y: 30}] },
     { name: 'Zig-Zag', pts: [{x: 20, y: 20}, {x: 80, y: 50}, {x: 20, y: 80}] },
     { name: 'Floating', pts: [{x: 30, y: 25}, {x: 60, y: 40}, {x: 40, y: 75}] }
  ];
  const layout = choice(layouts);

  // 6. Hero Event
  const domIdx = Math.floor(random(0) * 3); // 0, 1, or 2

  const progress = frame / duration;
  
  // 15. Scene Evolution & 8. Focus Director
  // timeline draws 0-20. Event 1: 20-40, Event 2: 40-60, Event 3: 60-80.
  
  // 4. Camera Director (Follows the timeline)
  const camType = choice(['Follow', 'Push', 'Orbit', 'Pan']);
  
  // To follow the timeline, we find our target X/Y based on progress
  let camX = 0; let camY = 0; let camS = 1.0;
  if (camType === 'Follow') {
     const tP = interpolate(progress, [0, 0.2, 0.5, 0.8, 1], [0, 0, 1, 2, 2], { extrapolateRight: 'clamp' });
     const getCamT = (idx: number, axis: 'x'|'y') => 50 - layout.pts[idx][axis];
     
     if (tP <= 1) {
         camX = interpolate(tP, [0, 1], [getCamT(0, 'x'), getCamT(1, 'x')]);
         camY = interpolate(tP, [0, 1], [getCamT(0, 'y'), getCamT(1, 'y')]);
     } else {
         camX = interpolate(tP, [1, 2], [getCamT(1, 'x'), getCamT(2, 'x')]);
         camY = interpolate(tP, [1, 2], [getCamT(1, 'y'), getCamT(2, 'y')]);
     }
     camS = 1.3;
  } else if (camType === 'Push') {
     camS = interpolate(progress, [0,1], [1, 1.2]);
  } else if (camType === 'Pan') {
     camX = interpolate(progress, [0,1], [10, -10]);
     camS = 1.1;
  }

  // 13. Event Interaction (Camera Shake on event hits)
  let shakeX = 0; let shakeY = 0;
  const event1Active = progress >= 0.2 && progress < 0.25;
  const event2Active = progress >= 0.4 && progress < 0.45;
  const event3Active = progress >= 0.6 && progress < 0.65;
  if (event1Active || event2Active || event3Active) {
      shakeX = Math.sin(frame * 2) * 5;
      shakeY = Math.cos(frame * 2.5) * 5;
  }

  // 11. Atmosphere
  const atmosChoices = ['Dust', 'Smoke', 'Grain', 'Rays', 'Paper'];
  const atmos1 = choice(atmosChoices);
  
  // 10. Lighting
  const light = choice(['Flashlight Sweep', 'Desk Lamp', 'Window Light', 'Edge Glow']);

  // SVG Line drawing (2. Timeline Build)
  const lineDraw = interpolate(progress, [0, 0.2], [1000, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#111' }}>
       {/* Global Lighting */}
       {light === 'Desk Lamp' && <div style={{ position: 'absolute', top: '-20%', left: '30%', width: '100%', height: '100%', background: 'radial-gradient(circle at top left, rgba(255,220,150,0.2) 0%, transparent 60%)' }} />}

       <AbsoluteFill style={{
          transform: `scale(${camS}) translateX(${camX}vw) translateY(${camY}vh) translateX(${shakeX}px) translateY(${shakeY}px)`,
          transition: 'transform 0.1s linear'
       }}>
          
          {/* SVG Line Background */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
             <path 
                d={`M ${layout.pts[0].x}vw ${layout.pts[0].y}vh L ${layout.pts[1].x}vw ${layout.pts[1].y}vh L ${layout.pts[2].x}vw ${layout.pts[2].y}vh`}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="4"
                strokeDasharray="1000"
                strokeDashoffset={lineDraw}
             />
          </svg>

          {/* Events */}
          {[0,1,2].map(i => {
             // 3. Event Director
             const tStart = duration * (0.2 + (i * 0.2)); // 20%, 40%, 60%
             const pActive = Math.max(0, frame - tStart);
             const spr = spring({ frame: pActive, fps, config: { damping: 12, mass: 1.2 } });
             
             // 5. Event Entrance
             const entry = choice(['Paper Drop', 'Fade', 'Slide', 'Stamp']);
             let tS = 1; let tOpac = 1; let tY = 0;
             if (entry === 'Paper Drop') { tS = interpolate(spr, [0,1], [3, 1]); tOpac = interpolate(spr, [0,1], [0,1]); }
             if (entry === 'Fade') { tOpac = interpolate(spr, [0,1], [0,1]); }
             if (entry === 'Slide') { tY = interpolate(spr, [0,1], [200, 0]); tOpac = interpolate(spr, [0,1], [0,1]); }
             if (entry === 'Stamp') { tS = interpolate(spr, [0,0.5,1], [5, 0.8, 1]); tOpac = interpolate(spr, [0,1], [0,1]); }

             // 7. Timeline Physics
             const driftY = Math.sin(frame * 0.02 + i) * 10;
             const breatheScale = 1 + Math.sin(frame * 0.05 + i) * 0.02;

             // 8. Focus Director
             let focusBlur = 0;
             if (progress > 0.4 && i === 0) focusBlur = 5;
             if (progress > 0.6 && i === 1) focusBlur = 5;

             // 6. Hero Event
             const isHero = i === domIdx;
             const heroScale = isHero ? 1.4 : 1.0;
             
             const media = mediaPaths[i % mediaPaths.length];
             const prop = choice(['Tape', 'Pin', 'Stamp', 'Folder']);

             return (
                <div key={i} style={{
                   position: 'absolute',
                   top: `${layout.pts[i].y}%`, left: `${layout.pts[i].x}%`,
                   width: isHero ? '400px' : '300px',
                   height: isHero ? '500px' : '350px',
                   transform: `translate(-50%, -50%) scale(${tS * heroScale * breatheScale}) translateY(${tY + driftY}px)`,
                   opacity: tOpac,
                   filter: `blur(${focusBlur}px)`,
                   zIndex: isHero ? 10 : 5,
                   backgroundColor: '#fff', // Paper backing
                   padding: '10px',
                   boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                   display: pActive > 0 ? 'flex' : 'none',
                   flexDirection: 'column'
                }}>
                   {/* Prop decoration */}
                   {prop === 'Tape' && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(-5deg)', width: 80, height: 25, backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)' }} />}
                   {prop === 'Pin' && <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 20, height: 20, borderRadius: '50%', backgroundColor: 'red', boxShadow: '0 5px 10px rgba(0,0,0,0.5)' }} />}

                   {media && (
                      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                         <KenBurnsMedia src={staticFile(media)} type={media.endsWith('.mp4') ? 'video' : 'image'} duration={duration} isEven={isEven ? i%2===0 : i%2!==0} />
                      </div>
                   )}
                   <div style={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#111', fontFamily: 'serif' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>19{20 + i + Math.floor(random(i)*50)}</div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>Historical Archive {i+1}</div>
                   </div>
                </div>
             );
          })}
       </AbsoluteFill>

       {/* 11. Atmosphere */}
       <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.5 }}>
           {atmos1 === 'Dust' && <VolumetricDust />}
           {atmos1 === 'Grain' && <FilmGrain />}
           {atmos1 === 'Smoke' && <HeavySmoke />}
           {atmos1 === 'Rays' && <LightRays />}
           {light === 'Flashlight Sweep' && (
              <div style={{ position: 'absolute', width: '200%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', transform: `translateX(${interpolate(frame, [0, duration], [-100, 50])}%)` }} />
           )}
       </AbsoluteFill>

       {/* 14. Audio */}
       <Sequence from={0}>
          
       </Sequence>
       <Sequence from={Math.floor(duration * 0.2)}>
          
       </Sequence>
       <Sequence from={Math.floor(duration * 0.4)}>
          
       </Sequence>
       <Sequence from={Math.floor(duration * 0.6)}>
          
       </Sequence>
       {scene.transition !== 'fade' && (
        <Sequence from={Math.max(0, duration - 15)}>
          
        </Sequence>
       )}
    </AbsoluteFill>
  );
};

export const Style11Scene: React.FC<{ scene: any, duration: number, isEven: boolean }> = ({ scene, duration, isEven }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  
  const seed = scene.scene_index || 0;
  const choice = (arr: any[]) => arr[Math.floor(seededRandom(seed + arr.length) * arr.length)];
  const random = (offset: number) => seededRandom(seed + offset);

  // 1. Data Director Layouts
  const layout = choice(['Giant Number', 'Financial Dashboard', 'Split Comparison', 'Animated Graph', 'KPI Board', 'Metric Cards']);

  const progress = frame / duration;
  
  // 3. Counter Director
  const targetNum = 75 + Math.floor(random(1) * 200);
  const countStyle = choice(['Count Up', 'Count Down']);
  let currentNum = 0;
  if (countStyle === 'Count Up') {
      currentNum = Math.floor(interpolate(progress, [0.2, 0.5], [0, targetNum], { extrapolateRight: 'clamp' }));
  } else {
      currentNum = Math.floor(interpolate(progress, [0.2, 0.5], [targetNum * 2, targetNum], { extrapolateRight: 'clamp' }));
  }

  // 4. Camera Director
  const camType = choice(['Push', 'Orbit', 'Pan', 'Dolly']);
  let camS = 1; let camX = 0; let camY = 0; let rotY = 0;
  if (camType === 'Push') camS = interpolate(progress, [0, 1], [1, 1.15]);
  if (camType === 'Orbit') rotY = interpolate(progress, [0, 1], [-5, 5]);
  if (camType === 'Pan') camX = interpolate(progress, [0, 1], [5, -5]);
  
  // 14. Scene Evolution (0-20 Build, 20-40 Main, 40-70 Graph)
  const buildSpr = spring({ frame, fps, config: { damping: 14 } }); // Dashboard BG
  const mainSpr = spring({ frame: Math.max(0, frame - duration * 0.2), fps, config: { damping: 14 } }); // Main metric
  const graphSpr = spring({ frame: Math.max(0, frame - duration * 0.4), fps, config: { damping: 12 } }); // Graphs
  
  // 12. Interaction (Pulse, shake)
  let shakeX = 0; let pulse = 1;
  if (progress > 0.4 && progress < 0.45) {
      shakeX = Math.sin(frame * 3) * 5;
      pulse = 1.05;
  }

  // 5. Graph Animation
  const graphType = choice(['Line', 'Bars']);
  const barHeights = [40, 70, 30, 90, 50, 80];
  
  // 8. Data FX & 10. Atmosphere
  const showGrid = true;
  const atmos = choice(['Digital Noise', 'Grain', 'Rays']);

  // Media background
  const bgPath = mediaPaths[0] || '#050510';

  return (
    <AbsoluteFill style={{ backgroundColor: '#050510', perspective: '1000px', color: '#fff', fontFamily: 'monospace' }}>
       {/* Background Media */}
       <AbsoluteFill style={{ opacity: 0.15, transform: `scale(${camS}) rotateY(${rotY}deg) translateX(${camX}vw) translateX(${shakeX}px)` }}>
          {bgPath.startsWith('#') ? (
             <AbsoluteFill style={{ backgroundColor: bgPath }} />
          ) : (
             <DualClipBackground scene={scene} duration={duration} isEven={isEven} />
          )}
       </AbsoluteFill>

       {/* 8. Data FX: Grid */}
       {showGrid && (
          <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundSize: '50px 50px', backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', pointerEvents: 'none' }} />
       )}

       <AbsoluteFill style={{ padding: '5%', display: 'flex', flexDirection: 'column', transform: `scale(${camS}) rotateY(${rotY}deg) translateX(${camX}vw) translateX(${shakeX}px)` }}>
          
          {/* Header */}
          <div style={{ opacity: buildSpr, transform: `translateY(${interpolate(buildSpr, [0,1], [-50, 0])}px)`, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
             <div style={{ fontSize: '24px', letterSpacing: '2px', color: '#0ff' }}>GLOBAL_METRICS_V2</div>
             <div style={{ fontSize: '24px', opacity: 0.5 }}>DATA.NODE.{Math.floor(random(5)*9000)}</div>
          </div>

          <div style={{ display: 'flex', flex: 1, marginTop: '40px', gap: '40px' }}>
             
             {/* 2. Number Hierarchy (Primary) */}
             <div style={{ flex: layout === 'Giant Number' ? '1' : '0.4', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ opacity: mainSpr, transform: `scale(${pulse}) translateX(${interpolate(mainSpr, [0,1], [-100, 0])}px)`, transition: 'transform 0.1s' }}>
                   <div style={{ fontSize: '20px', color: '#aaa', textTransform: 'uppercase' }}>Primary Index</div>
                   {/* 9. Neon Glow */}
                   <div style={{ fontSize: layout === 'Giant Number' ? '200px' : '120px', fontWeight: 'bold', lineHeight: '1', textShadow: '0 0 40px rgba(0,255,255,0.6)', color: '#fff' }}>
                      {currentNum.toLocaleString()}
                      <span style={{ fontSize: '40px', color: '#0ff' }}>%</span>
                   </div>
                   
                   {/* 7. Comparison Director */}
                   <div style={{ fontSize: '30px', color: '#0f0', marginTop: '10px', textShadow: '0 0 20px #0f0' }}>
                      â–² +{Math.floor(random(2)*50)}.{Math.floor(random(3)*99)}%
                   </div>
                </div>
             </div>

             {/* Secondary Stats / Graph */}
             {(layout === 'Financial Dashboard' || layout === 'Animated Graph' || layout === 'KPI Board' || layout === 'Split Comparison') && (
                <div style={{ flex: '0.6', display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: graphSpr }}>
                   
                   {/* 5. Graph Animation */}
                   {graphType === 'Bars' ? (
                      <div style={{ display: 'flex', alignItems: 'flex-end', height: '300px', gap: '20px', borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
                         {barHeights.map((h, i) => {
                             const barSpr = spring({ frame: Math.max(0, frame - duration * 0.4 - i * 5), fps, config: { damping: 12 } });
                             const isWinning = i === 3;
                             return (
                                <div key={i} style={{
                                   flex: 1,
                                   height: `${h * barSpr}%`,
                                   backgroundColor: isWinning ? '#0ff' : 'rgba(255,255,255,0.2)',
                                   boxShadow: isWinning ? '0 0 20px #0ff' : 'none',
                                   transition: 'height 0.1s ease-out'
                                }} />
                             );
                         })}
                      </div>
                   ) : (
                      <svg width="100%" height="300px" viewBox="0 0 600 300">
                         <path 
                            d="M 0 250 Q 100 200, 200 150 T 400 100 T 600 50" 
                            fill="transparent" 
                            stroke="#0ff" 
                            strokeWidth="8" 
                            strokeDasharray="1000" 
                            strokeDashoffset={interpolate(graphSpr, [0, 1], [1000, 0])}
                            style={{ filter: 'drop-shadow(0 0 10px #0ff)' }}
                         />
                      </svg>
                   )}

                   {layout === 'Financial Dashboard' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                         {[1,2,3].map(i => (
                            <div key={i} style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '20px', width: '30%', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                               <div style={{ fontSize: '14px', color: '#888' }}>SYS_METRIC_0{i}</div>
                               <div style={{ fontSize: '30px' }}>{(targetNum * 0.3 * i).toFixed(1)}</div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             )}
          </div>

          {/* 8. Financial Ticker */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', backgroundColor: '#000', borderTop: '1px solid #333', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
             <div style={{ whiteSpace: 'nowrap', transform: `translateX(${interpolate(progress, [0, 1], [100, -100])}vw)`, color: '#0f0', fontSize: '16px' }}>
                INDEX: +12.4% &nbsp;&nbsp;&nbsp; NODE A: ONLINE &nbsp;&nbsp;&nbsp; SYS_THROUGHPUT: {currentNum * 14} TB/s &nbsp;&nbsp;&nbsp; LATENCY: 12ms &nbsp;&nbsp;&nbsp;
             </div>
          </div>
       </AbsoluteFill>

       {/* 10. Atmosphere */}
       <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.3 }}>
           {atmos === 'Digital Noise' && <FilmGrain />}
           {atmos === 'Grain' && <FilmGrain />}
           {atmos === 'Rays' && <LightRays />}
       </AbsoluteFill>

       {/* 13. Audio */}
       <Sequence from={0}>
          
       </Sequence>
       <Sequence from={Math.floor(duration * 0.2)}>
          
       </Sequence>
       <Sequence from={Math.floor(duration * 0.4)}>
          
       </Sequence>
    </AbsoluteFill>
  );
};

export const LayoutRouter = ({ scene, duration, isEven }: any) => {
  const compStyle = scene.composition_style;
  const editingStyle = scene.editing_style;
  const layout = scene.layout?.toLowerCase() || 'hero';
  const mediaPaths = scene.media_paths || (scene.media_path ? [scene.media_path] : []);
  
  const getExt = (path: string) => path ? path.split('.').pop()?.toLowerCase() : '';
  const isVideo = (path: string) => ['mp4', 'mov', 'webm'].includes(getExt(path) || '');

  // -- NEW SYSTEM (Phase 2 Composition Styles) --
  if (compStyle === 'Fullscreen Image' || compStyle === 'Fullscreen Video') {
      const p = mediaPaths[0];
      if (!p) return <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }} />;
      return <FullscreenScene scene={{...scene, media_paths: [p]}} duration={duration} isEven={isEven} />;
  }
  
  if (compStyle === 'Background Video + Foreground Image') {
      const bg = mediaPaths[0];
      const fg = mediaPaths[1];
      if (!bg && !fg) return <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }} />;
      return <HeroPNGScene scene={{...scene, media_paths: [bg, fg].filter(Boolean)}} duration={duration} isEven={isEven} />;
  }
  
  if (compStyle === 'Background Video + Foreground Video') {
      const bg = mediaPaths[0];
      const fg = mediaPaths[1];
      if (!bg && !fg) return <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }} />;
      return (
         <AbsoluteFill>
             {bg && <KenBurnsMedia src={staticFile(bg)} type={isVideo(bg) ? 'video' : 'image'} duration={duration} isEven={isEven} />}
             {fg && (
                <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                   <div style={{ width: '75%', height: '75%', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.1)' }}>
                      <KenBurnsMedia src={staticFile(fg)} type={isVideo(fg) ? 'video' : 'image'} duration={duration} isEven={!isEven} style={{ transform: 'scale(1.1)' }} />
                   </div>
                </AbsoluteFill>
             )}
         </AbsoluteFill>
      );
  }

  // -- OLD SYSTEM (Fallback for safety) --
  if (editingStyle === 1) return <FullscreenScene scene={scene} duration={duration} isEven={isEven} />;
  if (editingStyle === 2) return <HeroPNGScene scene={scene} duration={duration} isEven={isEven} />;
  if (editingStyle === 3) return <HeroCompositionScene scene={scene} duration={duration} isEven={isEven} />;
  if (editingStyle === 4) return <TripleCompositionScene scene={scene} duration={duration} isEven={isEven} />;
  if (editingStyle === 5) return <DocumentaryBoardScene scene={scene} duration={duration} isEven={isEven} />;
  if (editingStyle === 6) return <TextTitleScene scene={scene} duration={duration} isEven={isEven} />;
  if (editingStyle === 7 || layout === 'splitscreen' || layout === 'split_screen') return <SplitScreenScene scene={scene} duration={duration} isEven={isEven} />;
  if (editingStyle === 8 || layout === 'mosaic' || layout === 'dynamic_mosaic') return <DynamicMosaicScene scene={scene} duration={duration} isEven={isEven} />;
  if (editingStyle === 9 || layout === 'parallaxcollage' || layout === 'parallax_collage') return <ParallaxCollageScene scene={scene} duration={duration} isEven={isEven} />;
  if (editingStyle === 10) return <Style10Scene scene={scene} duration={duration} isEven={isEven} />;
  if (editingStyle === 11) return <Style11Scene scene={scene} duration={duration} isEven={isEven} />;
  if (editingStyle === 12) return <MapScene scene={scene} duration={duration} isEven={isEven} />;
  
  // HERO or fallback
  const bgPath = mediaPaths[0] || '#0A0A0A';
  return (
    <AbsoluteFill>
      {bgPath.startsWith('#') ? (
         <AbsoluteFill style={{ backgroundColor: bgPath }} />
      ) : (
         <DualClipBackground scene={scene} duration={duration} isEven={isEven} />
      )}
    </AbsoluteFill>
  );
};

