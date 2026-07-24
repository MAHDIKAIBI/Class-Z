import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  Img 
} from "remotion";
import React from "react";

export type WordTiming = {
  word: string;
  start: number;
  end: number;
};

export const CinematicDocumentaryCaption: React.FC<{ script: WordTiming[] }> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{
      position: "absolute",
      bottom: "12%",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      zIndex: 50
    }}>
      <div style={{
        display: "flex",
        gap: "24px 14px",
        flexWrap: "nowrap",
          whiteSpace: "nowrap",
        maxWidth: "75%",
        justifyContent: "center",
        alignItems: "center"
      }}>
        {script.map((item, index) => {
          const isActive = frame >= item.start && frame < item.end;
          
          // DYNAMIC MATH ENGINE
          const duration = item.end - item.start;
          const wordSpring = spring({ 
            frame: isActive ? frame - item.start : 0, 
            fps, 
            config: { 
              damping: 14, 
              stiffness: duration < 15 ? 250 : (duration < 30 ? 150 : 80), 
              mass: duration < 15 ? 1 : 1.5 
            } 
          });
          
          const wordScale = isActive ? interpolate(wordSpring, [0, 1], [1, 1.05]) : 1;

          return (
            <span
              key={index}
              style={{
                color: isActive ? "#E2B714" : "#FFFFFF",
                opacity: isActive ? 1 : 0.85,
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontSize: "40px",
                fontWeight: isActive ? 800 : 600,
                
                textShadow: isActive 
                  ? `0 6px 20px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.9), 0 0 15px rgba(226, 183, 20, 0.4)`
                  : `0 6px 20px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.9)`,
                transition: "color 0.15s ease, opacity 0.15s ease",
                display: "inline-block",
                letterSpacing: "0.5px"
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

export const Scene = () => {
  const dummyJSONPayload: WordTiming[] = [
    { word: "The", start: 15, end: 22 }, 
    { word: "market", start: 22, end: 35 }, 
    { word: "shifted", start: 35, end: 45 },
    { word: "overnight.", start: 45, end: 90 }, 
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202" }}>
      <Img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2564&auto=format&fit=crop" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
      <CinematicDocumentaryCaption script={dummyJSONPayload} />
    </AbsoluteFill>
  );
};