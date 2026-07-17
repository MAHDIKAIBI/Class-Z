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

export const LiquidMirrorCaption: React.FC<{ script: WordTiming[] }> = ({ script }) => {
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
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
        backdropFilter: "blur(48px) saturate(250%) brightness(110%)",
        WebkitBackdropFilter: "blur(48px) saturate(250%) brightness(110%)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 10px rgba(0, 0, 0, 0.2), inset 0 10px 20px rgba(255, 255, 255, 0.05)",
        borderRadius: "100px",
        padding: "20px 48px",
        display: "flex",
        gap: "14px",
        flexWrap: "wrap",
        maxWidth: "85%",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        
        <div style={{
          position: "absolute",
          top: 0,
          left: `${interpolate(frame, [0, 150], [-50, 150])}%`,
          width: "40%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
          transform: "skewX(-20deg)",
          pointerEvents: "none",
          zIndex: 1
        }} />

        {script.map((item, index) => {
          const isActive = frame >= item.start && frame < item.end;
          const hasPassed = frame >= item.end;
          
          // DYNAMIC MATH ENGINE
          const duration = item.end - item.start;
          const wordSpring = spring({ 
            frame: isActive ? frame - item.start : 0, 
            fps, 
            config: { 
              damping: 18, 
              stiffness: duration < 15 ? 200 : (duration < 30 ? 120 : 60), 
              mass: duration < 15 ? 1 : 1.5 
            } 
          });
          
          const wordScale = isActive ? interpolate(wordSpring, [0, 1], [1, 1.08]) : 1;
          const opacity = isActive ? 1 : (hasPassed ? 0.3 : 0.3);

          return (
            <span
              key={index}
              style={{
                color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                opacity: opacity,
                fontSize: "42px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: isActive ? 700 : 400,
                transform: `scale(${wordScale})`,
                textShadow: isActive ? "0 0 30px rgba(255,255,255,0.9)" : "none",
                transition: "color 0.2s ease, opacity 0.2s ease, font-weight 0.2s ease",
                display: "inline-block",
                letterSpacing: "-1px",
                zIndex: 2
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
    { word: "Water", start: 15, end: 25 },
    { word: "flows", start: 25, end: 40 },
    { word: "perfectly.", start: 40, end: 90 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202" }}>
      <Img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2564&auto=format&fit=crop" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
      <LiquidMirrorCaption script={dummyJSONPayload} />
    </AbsoluteFill>
  );
};