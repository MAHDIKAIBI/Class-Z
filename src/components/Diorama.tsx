import { 
  Composition,
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  Easing,
  Video
} from "remotion";
import React from "react";

// ============================================================================
// 1. THE ENGINE (Dynamic, Liquid Glass, Smoke, 100% Adaptable)
// ============================================================================

export type DynamicSubject = {
  id: string;
  emoji: string;
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

export const DioramaCanvas: React.FC<{ payload: DioramaPayload }> = ({ payload }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // GLOBAL CAMERA PARALLAX (Z-Axis Push)
  const bgScale = interpolate(frame, [0, payload.duration], [1, 1.05], { extrapolateRight: "clamp" });
  const textScale = interpolate(frame, [0, payload.duration], [1, 1.08], { extrapolateRight: "clamp" });
  const subjectScale = interpolate(frame, [0, payload.duration], [0.85, 1.15], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", overflow: "hidden" }}>
      
      {/* LAYER 0: CINEMATIC VIDEO BACKGROUND */}
      <AbsoluteFill style={{ zIndex: 0, transform: `scale(${bgScale})` }}>
        {payload.bgVideoSrc && (
          <Video 
            src={payload.bgVideoSrc} 
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} 
            muted 
          onError={(e) => console.log("Media playback error caught on Video:", e)} />
        )}
        {/* Heavy vignette to crush the edges and focus the center */}
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 400px rgba(0,0,0,1)", pointerEvents: "none" }} />
      </AbsoluteFill>

      {/* LAYER 1: ATMOSPHERIC SMOKE */}
      <AbsoluteFill style={{ zIndex: 5, opacity: 0.6, pointerEvents: "none" }}>
        <div style={{
          position: "absolute",
          bottom: "-20%",
          left: `${interpolate(frame, [0, payload.duration], [-20, 20])}%`,
          width: "150%", height: "80%",
          background: "radial-gradient(ellipse at center, rgba(150,150,150,0.15) 0%, transparent 60%)",
          filter: "blur(100px)",
          transform: `scaleY(0.6) translateY(${Math.sin(frame / 30) * 50}px)`
        }} />
        <div style={{
          position: "absolute",
          bottom: "0%",
          left: `${interpolate(frame, [0, payload.duration], [20, -10])}%`,
          width: "120%", height: "60%",
          background: "radial-gradient(ellipse at center, rgba(200,200,200,0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
          transform: `translateY(${Math.cos(frame / 40) * 40}px)`
        }} />
      </AbsoluteFill>

      {/* LAYER 2: TYPOGRAPHY (AUTO-LAYOUT, ANCHORED IN MIDGROUND) */}
      <AbsoluteFill style={{ zIndex: 10, justifyContent: "center", alignItems: "center", transform: `scale(${textScale}) translateY(-15%)` }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", width: "90%", gap: "25px" }}>
          {payload.text.map((item, index) => {
            const isActive = frame >= item.start && frame < item.end;
            const hasPassed = frame >= item.end;
            const duration = item.end - item.start;
            
            const wordSpring = spring({ 
              frame: isActive ? frame - item.start : (hasPassed ? duration : 0), 
              fps, config: { damping: 14, stiffness: 180, mass: 1.2 } 
            });

            const yShift = isActive ? interpolate(wordSpring, [0, 1], [item.yOffset, 0]) : 0;
            const blur = isActive ? interpolate(wordSpring, [0, 1], [40, 0]) : 0;
            const opacity = isActive ? interpolate(wordSpring, [0, 0.5], [0, 1]) : (hasPassed ? 0.3 : 0);
            const scalePop = item.scale ? interpolate(wordSpring, [0, 0.5, 1], [0.5, 1.2, item.scale]) : 1;

            return (
              <span key={index} style={{
                color: item.color || "#ffffff", opacity, 
                fontSize: "140px", fontFamily: '"Geist", "Inter", sans-serif', fontWeight: 900, 
                letterSpacing: "-4px", transform: `translateY(${yShift}px) scale(${scalePop})`,
                filter: `blur(${blur}px)`, textShadow: "0 30px 60px rgba(0,0,0,0.9)", 
                textTransform: "uppercase", lineHeight: 1
              }}>
                {item.word}
              </span>
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
          {payload.subjects.map((sub, i) => (
            <div key={sub.id} style={{ 
              width: "450px", height: "300px", 
              transform: `translateY(${Math.sin((frame + i * 20) / 15) * 15}px) scale(${subjectScale})`,
              
              // THE LIQUID GLASS EFFECT
              background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)`,
              backdropFilter: "blur(25px)",
              WebkitBackdropFilter: "blur(25px)",
              border: `1px solid rgba(255,255,255,0.15)`,
              borderTop: `1px solid rgba(255,255,255,0.3)`,
              borderLeft: `1px solid rgba(255,255,255,0.3)`,
              borderRadius: "30px",
              boxShadow: `0 40px 100px rgba(0,0,0,0.8), inset 0 0 40px ${sub.color}`,
              
              display: "flex", justifyContent: "center", alignItems: "center", fontSize: "120px",
              color: "rgba(255,255,255,0.8)"
            }}>
              {sub.emoji}
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* LAYER 4: OPTICAL CSS FLARES */}
      <AbsoluteFill style={{ zIndex: 30, pointerEvents: "none" }}>
        {payload.particles.map((particle) => {
          if (frame < particle.start || frame >= particle.end) return null;
          const progress = interpolate(frame - particle.start, [0, particle.end - particle.start], [0, 1], { easing: Easing.linear });
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

    </AbsoluteFill>
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
