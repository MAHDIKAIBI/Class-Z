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
// 1. THE VAULT COMPONENT (Highlight Reel - Silent Edition)
// ============================================================================

export type HighlightWordTiming = {
  word: string;
  start: number;
  end: number;
  isHighlight?: boolean; // Flags the word for the massive glow effect
};

export const HighlightReelCaption: React.FC<{ script: HighlightWordTiming[] }> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{
      position: "absolute",
      bottom: "15%",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      zIndex: 50
    }}>
      {/* The Subtle Dark Liquid Glass Container */}
      <div style={{
        background: "rgba(5, 5, 8, 0.35)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        borderRadius: "24px",
        padding: "24px 40px",
        display: "flex",
        gap: "24px 16px",
        flexWrap: "nowrap",
          whiteSpace: "nowrap",
        maxWidth: "80%",
        justifyContent: "center",
        alignItems: "center",
        transition: "all 0.3s ease"
      }}>
        {script.map((item, index) => {
          const isActive = frame >= item.start && frame < item.end;
          
          // Dynamic Speed: Physics adjust based on how long the word is on screen
          const duration = item.end - item.start;
          const wordSpring = spring({ 
            frame: isActive ? frame - item.start : 0, 
            fps, 
            config: { 
              damping: 12, 
              stiffness: duration < 15 ? 300 : 150 // Faster words snap harder
            } 
          });
          
          // Normal words scale slightly, highlight words punch harder
          
          

          // Color Routing
          const baseColor = "rgba(255, 255, 255, 0.5)"; // Dimmed normal state
          const activeNormalColor = "#FFFFFF";
          const activeHighlightColor = "#00FF66"; // Premium Neon Green

          let currentColor = baseColor;
          if (isActive) {
            currentColor = item.isHighlight ? activeHighlightColor : activeNormalColor;
          }

          return (
            <span
              key={index}
              style={{
                color: currentColor,
                fontSize: "48px",
                fontFamily: '"Geist", system-ui, sans-serif',
                fontWeight: isActive ? (item.isHighlight ? 800 : 600) : 500,
                
                
                // The Highlight Glow
                textShadow: isActive && item.isHighlight 
                  ? "0 0 20px rgba(0,255,102,0.6), 0 0 40px rgba(0,255,102,0.3)" 
                  : "none",
                
                transition: "color 0.15s ease-out, text-shadow 0.15s ease-out",
                display: "inline-block",
              }}
            >
              {item.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 2. THE TEST WRAPPER 
// ============================================================================

export const Scene = () => {
  const dummyJSONPayload: HighlightWordTiming[] = [
    { word: "This", start: 10, end: 20 },
    { word: "strategy", start: 20, end: 35 },
    { word: "generates", start: 35, end: 50 },
    { word: "massive", start: 50, end: 70, isHighlight: true },
    { word: "returns.", start: 70, end: 100 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202" }}>
      {/* High-end cinematic background to test the dark liquid glass transparency */}
      <Img 
        src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2564&auto=format&fit=crop" 
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
      />
      
      <HighlightReelCaption script={dummyJSONPayload} />
    </AbsoluteFill>
  );
};