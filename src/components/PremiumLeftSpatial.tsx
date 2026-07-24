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
// 1. THE VAULT COMPONENT (Heavy-Weight Volumetric Edition)
// ============================================================================

export type WordTiming = {
  word: string;
  start: number;
  end: number;
};

export const PremiumLeftSpatial: React.FC<{ script: WordTiming[] }> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{
      position: "absolute",
      left: "8%",
      top: "0", 
      height: "100%", 
      width: "45%", 
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "flex-start", 
      gap: "32px 28px", // Adjusted gap for massive text
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
            mass: 1.5 // Increased mass for a heavier visual landing
          } 
        });
        
        // High-End Animations: Heavy drop, deep blur reveal
        const blurAmount = isActive ? interpolate(wordSpring, [0, 1], [30, 0]) : 0;
        const yShift = isActive ? interpolate(wordSpring, [0, 1], [60, 0]) : 0; // Deeper drop
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
              fontWeight: isActive ? 900 : 500, // Maximum density when active
              
              filter: isActive ? `blur(${blurAmount}px)` : "none",
              textShadow: isActive 
                ? `0 25px 50px rgba(0,0,0,0.9), 0 0 40px rgba(255,255,255,0.3)` 
                : `0 15px 30px rgba(0,0,0,0.9)`,
              transition: "color 0.2s ease, opacity 0.3s ease, filter 0.2s ease",
              display: "inline-block",
              textTransform: "capitalize",
              letterSpacing: "-2.5px", // Extremely tight kerning for that premium look
              lineHeight: "1"
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
// 2. THE TEST WRAPPER 
// ============================================================================

export const Scene = () => {
  const dummyJSONPayload: WordTiming[] = [
    { word: "The", start: 10, end: 20 },
    { word: "design", start: 20, end: 40 },
    { word: "is", start: 40, end: 50 },
    { word: "flawless.", start: 50, end: 90 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202" }}>
      
      {/* 1. Full Screen Image Canvas */}
      <Img 
        src="https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2564&auto=format&fit=crop" 
        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
      />
      
      {/* 2. The Cinematic Vignette (Environmental Bleed) */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to right, rgba(2,2,2,0.95) 0%, rgba(2,2,2,0.7) 35%, rgba(2,2,2,0) 70%)",
        pointerEvents: "none"
      }} />
      
      <PremiumLeftSpatial script={dummyJSONPayload} />
      
    </AbsoluteFill>
  );
};