import { 
  Composition,
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  Easing,
  Video,
  Img,
  staticFile as remotionStaticFile
} from "remotion";
import React from "react";
import { CinematicTextureWrapper } from './CinematicTextureWrapper';
const staticFile = (path: string) => {
    if (!path) return '';
    let cleanPath = path;
    if (cleanPath.startsWith('public/')) {
        cleanPath = cleanPath.slice(7);
    } else if (cleanPath.startsWith('/public/')) {
        cleanPath = cleanPath.slice(8);
    }
    try { cleanPath = decodeURIComponent(cleanPath); } catch(e) {}
    return remotionStaticFile(cleanPath);
};

// ============================================================================
// 1. THE ENGINE (Dynamic, Liquid Glass, Smoke, 100% Adaptable)
// ============================================================================

export type DynamicSubject = {
  id: string;
  emoji?: string;
  imageUrl?: string;
  color: string;
};

export type DynamicWord = {
  word: string;
  start: number;
  end: number;
  yOffset: number;
  color?: string;
  scale?: number;
};

export type DioramaPayload = {
  duration: number;
  bgVideoSrc: string;
  subjects: DynamicSubject[]; // Pass 1, 2, or 10 subjects. It auto-adapts.
  text: DynamicWord[];
  particles: { id: string; start: number; end: number; startX: number; startY: number; endX: number; endY: number; scale: number; blur: number }[];
};

function groupDioramaWords(words: DynamicWord[]): DynamicWord[][] {
  const lines: DynamicWord[][] = [];
  let currentLine: DynamicWord[] = [];
  let currentLen = 0;
  for (const w of words) {
    const clean = w.word.replace(/[^a-zA-Z]/g, "");
    if (currentLine.length > 0 && (currentLen + clean.length > 18 || currentLine.length >= 3)) {
      lines.push(currentLine);
      currentLine = [w];
      currentLen = clean.length;
    } else {
      currentLine.push(w);
      currentLen += clean.length;
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);
  return lines;
}

function getDioramaFontSize(line: DynamicWord[]): number {
  const len = line.reduce((acc, w) => acc + w.word.replace(/[^a-zA-Z]/g, "").length, 0);
  if (len > 18) return 90;
  if (len > 14) return 110;
  if (len > 10) return 140;
  return 180;
}

export const DioramaCanvas: React.FC<{ payload: DioramaPayload }> = ({ payload }) => {
  const rawFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = (payload as any).trigger_frame ?? 0;
  const frame = Math.max(0, rawFrame - startFrame);

  // GLOBAL CAMERA PARALLAX (Z-Axis Push)
  const bgScale = interpolate(frame, [0, payload.duration], [1, 1.05], { extrapolateRight: "clamp" });
  const textScale = interpolate(frame, [0, payload.duration], [1, 1.08], { extrapolateRight: "clamp" });
  const subjectScale = interpolate(frame, [0, payload.duration], [0.85, 1.15], { extrapolateRight: "clamp" });

  return (
    <CinematicTextureWrapper
       backgroundLayer={
         <AbsoluteFill style={{ zIndex: 0, transform: `scale(${interpolate(rawFrame, [0, payload.duration], [1, 1.05], { extrapolateRight: 'clamp' })})` }}>
           {payload.bgVideoSrc && (
             <Video 
               src={payload.bgVideoSrc ? (payload.bgVideoSrc.startsWith('http') ? payload.bgVideoSrc : staticFile(payload.bgVideoSrc)) : undefined} 
               style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} 
               muted 
             onError={(e) => console.log("Media playback error caught on Video:", e)} />
           )}
           {/* Heavy vignette to crush the edges and focus the center */}
           <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 400px rgba(0,0,0,1)", pointerEvents: "none" }} />
         </AbsoluteFill>
       }
    >

      {/* LAYER 1: ATMOSPHERIC SMOKE */}
      <AbsoluteFill style={{ zIndex: 5, opacity: 0.6, pointerEvents: "none" }}>
        <div style={{
          position: "absolute",
          bottom: "-20%",
          left: `${interpolate(frame, [0, payload.duration], [-20, 20])}%`,
          width: "150%", height: "80%",
          background: "radial-gradient(ellipse at center, rgba(150,150,150,0.15) 0%, transparent 60%)",
          filter: "blur(100px)",
          transform: `scaleY(0.6) translateY(${Math.sin(rawFrame / 30) * 50}px)`
        }} />
        <div style={{
          position: "absolute",
          bottom: "0%",
          left: `${interpolate(frame, [0, payload.duration], [20, -10])}%`,
          width: "120%", height: "60%",
          background: "radial-gradient(ellipse at center, rgba(200,200,200,0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
          transform: `translateY(${Math.cos(rawFrame / 40) * 40}px)`
        }} />
      </AbsoluteFill>

      {/* LAYER 2: TYPOGRAPHY (AUTO-LAYOUT, ANCHORED IN MIDGROUND) */}
      <AbsoluteFill style={{ zIndex: 10, justifyContent: "center", alignItems: "center", transform: `scale(${textScale}) translateY(-15%) translateX(${interpolate(frame, [0, payload.duration], [0, 40], { extrapolateRight: "clamp" })}px)` }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          {groupDioramaWords(payload.text).map((line, lineIndex) => {
            const fontSize = getDioramaFontSize(line);
            return (
              <div key={lineIndex} style={{ display: "flex", flexDirection: "row", gap: "25px", flexShrink: 0, whiteSpace: "nowrap" }}>
                {line.map((item, wordIdx) => {
                  const timeRatio = (payload as any).actualDurationFrames ? ((payload as any).actualDurationFrames / payload.duration) : 1;
                  const scaledStart = item.start * timeRatio;
                  const scaledEnd = (payload as any).actualDurationFrames || item.end;
                  
                  const isActive = frame >= scaledStart && frame < scaledEnd;
                  const hasPassed = frame >= scaledEnd;
                  const duration = scaledEnd - scaledStart;
                  
                  const wordSpring = spring({ 
                    frame: isActive ? frame - scaledStart : (hasPassed ? duration : 0), 
                    fps, config: { damping: 14, stiffness: 180, mass: 1.2 } 
                  });

                  const yShift = isActive ? interpolate(wordSpring, [0, 1], [item.yOffset, 0]) : 0;
                  const blur = isActive ? interpolate(wordSpring, [0, 1], [40, 0]) : 0;
                  const opacity = isActive ? interpolate(wordSpring, [0, 0.5], [0, 1]) : (hasPassed ? 0.3 : 0);
                  const scalePop = item.scale ? interpolate(wordSpring, [0, 0.5, 1], [0.5, 1.2, item.scale]) : 1;

                  return (
                    <span key={wordIdx} style={{
                      color: item.color || "#ffffff", opacity, 
                      fontSize: `${fontSize}px`, fontFamily: '"Geist", "Inter", sans-serif', fontWeight: 900, 
                      letterSpacing: "-4px", transform: `translateY(${yShift}px) scale(${scalePop})`,
                      filter: `blur(${blur}px)`, textShadow: "0 30px 60px rgba(0,0,0,0.9)", 
                      textTransform: "uppercase", lineHeight: 1,
                      display: "inline-block", flexShrink: 0, whiteSpace: "nowrap"
                    }}>
                      {item.word}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* LAYER 3: DYNAMIC SUBJECTS (LIQUID GLASS AUTO-LAYOUT) */}
      <AbsoluteFill style={{ zIndex: 20, justifyContent: "center", alignItems: "center" }}>
        <div style={{ 
          display: "flex", 
          width: "100%", 
          justifyContent: "space-evenly", 
          alignItems: "center", 
          padding: "0 5%",
          transform: `translateY(15%)`
        }}>
          {payload.subjects.map((sub: any, i) => {
            // Each subject has its own trigger_frame so it reveals on its spoken word
            const subTrigger = (sub as any).trigger_frame ?? (i * 10);
            const entrance = spring({ frame: Math.max(0, rawFrame - startFrame - subTrigger), fps, config: { damping: 12, stiffness: 100 } });
            const popScale = interpolate(entrance, [0, 1], [0, 1]);
            const popOpacity = interpolate(entrance, [0, 0.5], [0, 1]);
            
            return (
            <div key={sub.id} style={{ 
              width: "450px", height: "300px", 
              opacity: popOpacity,
              transform: `translateY(${Math.sin((frame + i * 20) / 15) * 15}px) scale(${subjectScale * popScale})`,
              
              // THE LIQUID GLASS EFFECT
              background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)`,
              backdropFilter: "blur(25px)",
              WebkitBackdropFilter: "blur(25px)",
              border: `1px solid rgba(255,255,255,0.15)`,
              borderTop: `1px solid rgba(255,255,255,0.3)`,
              borderLeft: `1px solid rgba(255,255,255,0.3)`,
              borderRadius: "30px",
              boxShadow: `0 40px 100px rgba(0,0,0,0.8), inset 0 0 40px ${sub.color}`,
              overflow: "hidden", // Keeps the image inside the rounded corners
              display: "flex", justifyContent: "center", alignItems: "center",
            }}>
              {sub.imageUrl ? (
                <Img src={staticFile(sub.imageUrl)} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
              ) : (
                /* Cinematic Void Fallback */
                <div style={{
                  width: "100%", height: "100%",
                  background: `linear-gradient(135deg, rgba(5,5,5,0.9), rgba(15,15,15,0.95))`,
                  display: "flex", justifyContent: "center", alignItems: "center",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute", inset: "-50%",
                    background: `radial-gradient(circle at center, ${sub.color || 'rgba(255,0,50,0.2)'} 0%, transparent 60%)`,
                    opacity: 0.6 + Math.sin(frame / 20) * 0.3,
                    filter: "blur(20px)"
                  }} />
                </div>
              )}
            </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* LAYER 4: OPTICAL CSS FLARES */}
      <AbsoluteFill style={{ zIndex: 30, pointerEvents: "none" }}>
        {payload.particles.map((particle) => {
          const timeRatio = (payload as any).actualDurationFrames ? ((payload as any).actualDurationFrames / payload.duration) : 1;
          const scaledStart = particle.start * timeRatio;
          const scaledEnd = (payload as any).actualDurationFrames || particle.end;
          
          if (frame < scaledStart || frame >= scaledEnd) return null;
          const progress = interpolate(frame - scaledStart, [0, scaledEnd - scaledStart], [0, 1], { easing: Easing.linear });
          const currentX = interpolate(progress, [0, 1], [particle.startX, particle.endX]);
          const currentY = interpolate(progress, [0, 1], [particle.startY, particle.endY]);

          return (
            <div key={particle.id} style={{
              position: "absolute", left: `${currentX}%`, top: `${currentY}%`, width: "800px", height: "800px",
              borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)",
              transform: `scale(${particle.scale})`, filter: `blur(${particle.blur}px)`,
              opacity: interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
            }} />
          );
        })}
      </AbsoluteFill>

    </CinematicTextureWrapper>
  );
};

// ============================================================================
// 2. THE DATA WRAPPER
// ============================================================================

export const DioramaMaster = () => {
  const payload: DioramaPayload = {
    duration: 210, 
    // W3C Standard Test Video - Zero CORS restrictions, 100% unbreakable
    bgVideoSrc: "https://media.w3.org/2010/05/sintel/trailer.mp4", 
    
    // DYNAMIC ARRAY: Adapts instantly to 1, 2, or 3 items
    subjects: [
      { id: "s1", emoji: "🏎️", color: "rgba(0, 255, 102, 0.1)" },
      { id: "s2", emoji: "🏁", color: "rgba(0, 162, 255, 0.1)" }
    ],

    text: [
      { word: "Today", start: 0, end: 210, yOffset: 100 },
      { word: "We", start: 10, end: 30, yOffset: 100 },
      { word: "Compare", start: 20, end: 60, yOffset: 100 },
      { word: "The", start: 60, end: 75, yOffset: -50 },
      { word: "GT43", start: 70, end: 210, yOffset: -50, color: "#00FF66" },
      { word: "VS", start: 90, end: 210, yOffset: 50, color: "#FF0044", scale: 1.5 },
      { word: "The", start: 110, end: 125, yOffset: -50 },
      { word: "Audi", start: 120, end: 210, yOffset: -50 },
      { word: "R8", start: 130, end: 210, yOffset: -50, color: "#00A2FF" }
    ],
    
    particles: [
      { id: "flare1", start: 0, end: 210, startX: -20, startY: 20, endX: 120, endY: 50, scale: 2.5, blur: 50 },
      { id: "flare2", start: 30, end: 210, startX: 110, startY: 80, endX: -10, endY: 10, scale: 3.5, blur: 40 }
    ]
  };
  return <DioramaCanvas payload={payload} />;
};
