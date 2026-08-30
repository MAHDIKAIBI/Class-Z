import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  Easing, 
  OffthreadVideo, 
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
// MAGNATES TIER DIORAMA (Obsidian Glass, 3D Parallax, Auto-Syncing)
// ============================================================================

export type DynamicSubject = {
  id: string;
  imageUrl?: string;
  color: string;
};

export type DynamicWord = {
  word: string;
  color?: string;
  scale?: number;
};

export type DioramaPayload = {
  duration: number;
  actualDurationFrames?: number; // Injected by index.tsx
  bgVideoSrc: string;
  subjects: DynamicSubject[]; 
  text: DynamicWord[];
};

function groupDioramaWords(words: DynamicWord[]): DynamicWord[][] {
  if (!words || !Array.isArray(words)) return [];
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
  
  // Use the exact real duration from the engine to prevent desync
  const dur = payload.actualDurationFrames || payload.duration || 150;
  
  // The actual starting frame for this specific element in the timeline
  const startFrame = (payload as any).trigger_frame ?? 0;
  const frame = Math.max(0, rawFrame - startFrame);

  // ==========================================
  // 1. GLOBAL CAMERA & PARALLAX
  // ==========================================
  // Creates a relentless, heavy push through the Z-axis
  const globalZPush = interpolate(frame, [0, dur], [0, 600], { extrapolateRight: "clamp" });
  const globalDriftY = Math.sin(frame / 40) * 15;

  return (
    <CinematicTextureWrapper 
      backgroundLayer={
        <AbsoluteFill style={{ zIndex: 0, backgroundColor: "#020205", overflow: "hidden" }}>
          <div style={{
            position: "absolute", inset: "-10%",
            transform: `scale(${interpolate(frame, [0, dur], [1, 1.15], { extrapolateRight: "clamp" })})`,
            transformOrigin: "center"
          }}>
            {payload.bgVideoSrc && (
              <OffthreadVideo 
                src={payload.bgVideoSrc.startsWith('http') ? payload.bgVideoSrc : staticFile(payload.bgVideoSrc)} 
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3, filter: "grayscale(80%) contrast(120%)" }} 
                muted 
                onError={(e) => console.log("Media playback error caught on Video:", e)} 
              />
            )}
          </div>
          {/* Heavy Cinematic Vignette */}
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 500px rgba(0,0,0,1)", pointerEvents: "none" }} />
        </AbsoluteFill>
      }
    >
      
      {/* 3D ARENA WRAPPER */}
      <AbsoluteFill style={{ perspective: "1500px", transformStyle: "preserve-3d" }}>
        
        <AbsoluteFill style={{
          transformStyle: "preserve-3d",
          transform: `translateZ(${globalZPush}px) translateY(${globalDriftY}px)`,
        }}>
          
          {/* ==========================================
              LAYER 1: VOLUMETRIC TYPOGRAPHY (Z: -200px)
              ========================================== */}
          <AbsoluteFill style={{ 
            zIndex: 10, 
            justifyContent: "center", 
            alignItems: "center", 
            transform: `translateZ(-200px) translateY(-15%)`,
            transformStyle: "preserve-3d"
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              {groupDioramaWords(payload.text || []).map((line, lineIndex) => {
                const fontSize = getDioramaFontSize(line);
                return (
                  <div key={lineIndex} style={{ display: "flex", flexDirection: "row", gap: "25px", flexShrink: 0 }}>
                    {line.map((item, wordIdx) => {
                      // KILLED THE LLM DESYNC: Mathmatically stagger based on word index, not LLM JSON guesses.
                      const globalIdx = lineIndex * 3 + wordIdx;
                      const wordStart = Math.min(globalIdx * 8, dur * 0.3); // Caps stagger to first 30% of scene
                      
                      const wordSpring = spring({ frame: Math.max(0, frame - wordStart), fps, config: { damping: 14, stiffness: 200, mass: 1.2 } });
                      
                      const yShift = interpolate(wordSpring, [0, 1], [150, 0]);
                      const zShift = interpolate(wordSpring, [0, 1], [-500, 0]);
                      const blur = interpolate(wordSpring, [0, 1], [40, 0]);
                      const opacity = interpolate(wordSpring, [0, 0.4], [0, 1]);
                      const popScale = item.scale ? interpolate(wordSpring, [0, 0.5, 1], [0.8, 1.2, item.scale]) : 1;

                      return (
                        <span key={wordIdx} style={{
                          color: item.color || "#FFFFFF", 
                          opacity, 
                          fontSize: `${fontSize}px`, 
                          fontFamily: '"Geist", "Inter", sans-serif', 
                          fontWeight: 900, 
                          letterSpacing: "-4px", 
                          transform: `translateY(${yShift}px) translateZ(${zShift}px) scale(${popScale})`,
                          filter: `blur(${blur}px)`, 
                          textShadow: `0 30px 60px rgba(0,0,0,0.9), 0 0 40px ${item.color ? item.color + '80' : 'rgba(255,255,255,0.2)'}`, 
                          textTransform: "uppercase", 
                          lineHeight: 1,
                          display: "inline-block"
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

          {/* ==========================================
              LAYER 2: OBSIDIAN GLASS SUBJECT CARDS (Z: 100px)
              ========================================== */}
          <AbsoluteFill style={{ 
            zIndex: 20, 
            justifyContent: "center", 
            alignItems: "center",
            transformStyle: "preserve-3d"
          }}>
            <div style={{ 
              display: "flex", width: "100%", justifyContent: "space-evenly", alignItems: "center", padding: "0 5%",
              transform: `translateZ(100px) translateY(15%)`,
              transformStyle: "preserve-3d"
            }}>
              {(payload.subjects || []).map((sub: any, i) => {
                
                // PERFECT SYNC: Relies entirely on Python's exact trigger_start_ms
                const subTrigger = (sub as any).trigger_frame ?? (i * 15);
                const isActive = frame >= subTrigger;
                
                const cardSpring = spring({ frame: Math.max(0, frame - subTrigger), fps, config: { damping: 14, stiffness: 120 } });
                const cardZ = interpolate(cardSpring, [0, 1], [-800, 0]);
                const cardRotY = interpolate(cardSpring, [0, 1], [i % 2 === 0 ? -45 : 45, 0]);
                const cardOpacity = interpolate(cardSpring, [0, 0.5], [0, 1]);
                
                // Continuous floating motion independent per card
                const floatY = Math.sin((frame + i * 30) / 20) * 15;
                const floatRot = Math.cos((frame + i * 20) / 25) * 2;

                return (
                  <div key={sub.id} style={{ 
                    width: "480px", height: "320px", position: "relative",
                    opacity: cardOpacity,
                    transformStyle: "preserve-3d",
                    transform: `translateZ(${cardZ}px) translateY(${floatY}px) rotateY(${cardRotY + floatRot}deg) rotateX(5deg)`,
                  }}>
                    
                    {/* The Obsidian Glass Shell */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: `linear-gradient(145deg, rgba(20, 25, 30, 0.9) 0%, rgba(5, 5, 8, 0.95) 100%)`,
                      border: `1px solid ${sub.color}60`,
                      borderTop: `2px solid ${sub.color}`,
                      borderLeft: `1px solid rgba(255,255,255,0.3)`,
                      borderRadius: "24px",
                      boxShadow: `0 50px 100px rgba(0,0,0,0.9), inset 0 0 60px ${sub.color}20`,
                      overflow: "hidden",
                      display: "flex", justifyContent: "center", alignItems: "center",
                    }}>
                      {/* Image Asset with Vignette */}
                      {sub.imageUrl && (
                        <>
                          <Img src={staticFile(sub.imageUrl)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.15) saturate(1.1)", opacity: 0.85 }} />
                          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 80px rgba(0,0,0,1)" }} />
                        </>
                      )}

                      {/* Anamorphic Light Sweep */}
                      {isActive && (
                        <div style={{
                          position: "absolute", top: 0, bottom: 0, width: "150%",
                          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), ${sub.color}80, rgba(255,255,255,0.1), transparent)`,
                          transform: `translateX(${interpolate(frame - subTrigger, [0, 60], [-100, 100], { extrapolateRight: "clamp" })}%) skewX(-30deg)`,
                          mixBlendMode: "screen", pointerEvents: "none"
                        }} />
                      )}
                    </div>

                    {/* Floor Reflection Glow */}
                    <div style={{
                      position: "absolute", bottom: "-40px", left: "-20%", width: "140%", height: "40px",
                      background: `radial-gradient(ellipse, ${sub.color}80 0%, transparent 60%)`,
                      filter: "blur(20px)", transform: "rotateX(75deg)", opacity: cardOpacity
                    }} />

                  </div>
                );
              })}
            </div>
          </AbsoluteFill>

        </AbsoluteFill>
      </AbsoluteFill>
    </CinematicTextureWrapper>
  );
};