import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  Img 
} from "remotion";
import React from "react";

// ============================================================================
// 1. THE VAULT COMPONENT (Premium Right - Heavy Volumetric)
// ============================================================================

export type WordTiming = {
  word: string;
  start: number;
  end: number;
};

export const PremiumRightSpatial: React.FC<{ script: WordTiming[] }> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{
      position: "absolute",
      right: "8%", // Anchors perfectly to the right edge
      top: "0", 
      height: "100%", 
      width: "45%", 
      display: "flex",
      flexWrap: "wrap",
      alignContent: "center",
      justifyContent: "flex-end", // Words build INWARD from the right
      gap: "12px 20px",
      zIndex: 50
    }}>
      {script.map((item, index) => {
        const isActive = frame >= item.start && frame < item.end;
        const hasPassed = frame >= item.end;
        
        // GLOBAL DYNAMIC MATH ENGINE: Perfect Sync
        const duration = item.end - item.start;
        const wordSpring = spring({ 
          frame: isActive ? frame - item.start : (hasPassed ? duration : 0), 
          fps, 
          config: { 
            damping: 16, 
            stiffness: duration < 15 ? 350 : (duration < 30 ? 200 : 120),
            mass: 1.5 // Retaining heavy weight
          } 
        });
        
        // High-End Animations: Heavy drop, deep blur reveal
        const blurAmount = isActive ? interpolate(wordSpring, [0, 1], [30, 0]) : 0;
        const yShift = isActive ? interpolate(wordSpring, [0, 1], [60, 0]) : 0;
        const scale = isActive ? interpolate(wordSpring, [0, 1], [0.85, 1.02]) : 1;
        
        let opacity = 0;
        if (isActive) opacity = interpolate(wordSpring, [0, 0.4], [0, 1]);
        else if (hasPassed) opacity = 0.3; // Dimmer inactive state for higher contrast

        return (
          <span
            key={index}
            style={{
              color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
              opacity: opacity,
              fontSize: "84px", // Massive, authoritative size
              fontFamily: '"Geist", "Inter", system-ui, sans-serif',
              fontWeight: isActive ? 900 : 500, // Maximum density
              transform: `translateY(${yShift}px) scale(${scale})`,
              filter: isActive ? `blur(${blurAmount}px)` : "none",
              textShadow: isActive 
                ? `0 25px 50px rgba(0,0,0,0.9), 0 0 40px rgba(255,255,255,0.3)` 
                : `0 15px 30px rgba(0,0,0,0.9)`,
              transition: "color 0.2s ease, opacity 0.3s ease, filter 0.2s ease",
              display: "inline-block",
              letterSpacing: "-2.5px", // Tight premium kerning
              lineHeight: "1",
              textAlign: "right" // Vital for spatial alignment
            }}
          >
            {item.word}
          </span>
        );
      })}
    </div>
  );
};

// ============================================================================
// 2. THE TEST WRAPPER (Flipped Vignette)
// ============================================================================

export const Scene = () => {
  const dummyJSONPayload: WordTiming[] = [
    { word: "But", start: 10, end: 20 },
    { word: "the", start: 20, end: 30 },
    { word: "market", start: 30, end: 50 },
    { word: "demanded", start: 50, end: 70 },
    { word: "more.", start: 70, end: 110 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202" }}>
      
      {/* 1. Full Screen Image Canvas */}
      <Img 
        src="https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=2564&auto=format&fit=crop" 
        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
      />
      
      {/* 2. The Flipped Cinematic Vignette (Environmental Bleed to LEFT) 
          This is crucial: it darkens the RIGHT side of the frame for the text
          while leaving the subject clear on the left side.
      */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to left, rgba(2,2,2,0.95) 0%, rgba(2,2,2,0.7) 35%, rgba(2,2,2,0) 70%)",
        pointerEvents: "none"
      }} />
      
      <PremiumRightSpatial script={dummyJSONPayload} />
      
    </AbsoluteFill>
  );
};