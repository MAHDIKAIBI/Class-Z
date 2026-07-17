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

export const GlassPillCaption: React.FC<{ script: WordTiming[] }> = ({ script }) => {
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
        background: "rgba(10, 10, 12, 0.6)",
        backdropFilter: "blur(32px) saturate(150%)",
        WebkitBackdropFilter: "blur(32px) saturate(150%)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
        borderRadius: "100px",
        padding: "20px 48px",
        display: "flex",
        gap: "14px",
        flexWrap: "wrap",
        maxWidth: "85%",
        justifyContent: "center",
        alignItems: "center"
      }}>
        {script.map((item, index) => {
          const isActive = frame >= item.start && frame < item.end;
          const hasPassed = frame >= item.end;
          
          // DYNAMIC MATH ENGINE
          const duration = item.end - item.start;
          const wordSpring = spring({ 
            frame: isActive ? frame - item.start : 0, 
            fps, 
            config: { 
              damping: 12, 
              stiffness: duration < 15 ? 350 : (duration < 30 ? 200 : 120) 
            } 
          });
          
          const wordScale = isActive ? interpolate(wordSpring, [0, 1], [1, 1.1]) : 1;
          const opacity = isActive ? 1 : (hasPassed ? 0.4 : 0.4);

          return (
            <span
              key={index}
              style={{
                color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
                opacity: opacity,
                fontSize: "42px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: isActive ? 800 : 500,
                transform: `scale(${wordScale})`,
                textShadow: isActive ? "0 0 24px rgba(255,255,255,0.8)" : "none",
                transition: "color 0.1s ease-out, opacity 0.2s ease-out",
                display: "inline-block",
                letterSpacing: "-1px"
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
    { word: "Fast", start: 15, end: 25 }, // 10 frames (Snaps hard)
    { word: "words", start: 25, end: 35 }, // 10 frames (Snaps hard)
    { word: "land", start: 35, end: 60 }, // 25 frames (Medium snap)
    { word: "heavy.", start: 60, end: 110 }, // 50 frames (Slow cinematic settle)
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202" }}>
      <Img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
      <GlassPillCaption script={dummyJSONPayload} />
    </AbsoluteFill>
  );
};