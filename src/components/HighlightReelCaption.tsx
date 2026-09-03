import { 
  useCurrentFrame, 
  useVideoConfig, 
  interpolate, 
  Easing 
} from "remotion";
import React from "react";

export type HighlightWordTiming = {
  word: string;
  start: number;
  end: number;
  isHighlight?: boolean;
};

export const HighlightReelCaption: React.FC<{ script: HighlightWordTiming[] }> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!script || script.length === 0) return null;

  let activeIndex = -1;
  for (let i = 0; i < script.length; i++) {
    if (frame >= script[i].start && frame < script[i].end) {
      activeIndex = i;
      break;
    }
  }

  let targetProgress = 0;
  let isCurrentWordHighlight = false;
  if (activeIndex !== -1) {
    const w = script[activeIndex];
    isCurrentWordHighlight = !!w.isHighlight;
    const wordProgress = interpolate(frame, [w.start, w.end], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    targetProgress = activeIndex + wordProgress;
  } else if (frame >= script[script.length - 1].end) {
    targetProgress = script.length - 1;
  }

  const liquidOffsetPct = script.length > 1
    ? (targetProgress / (script.length - 1)) * 100
    : 50;

  return (
    <div style={{
      position: "absolute",
      bottom: "12%",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
      pointerEvents: "none"
    }}>
      {/* 8D CURVY LIQUID OBSIDIAN CONTAINER */}
      <div style={{
        position: "relative",
        background: "linear-gradient(155deg, rgba(18, 22, 32, 0.65) 0%, rgba(5, 6, 10, 0.92) 100%)",
        backdropFilter: "blur(50px) saturate(220%) brightness(115%)",
        WebkitBackdropFilter: "blur(50px) saturate(220%) brightness(115%)",
        borderRadius: "100px",
        padding: "16px 46px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderTop: "2px solid rgba(255, 255, 255, 0.75)",
        borderBottom: "1.5px solid rgba(212, 175, 55, 0.5)",
        boxShadow: `
          0 40px 100px rgba(0, 0, 0, 0.92),
          0 15px 40px rgba(0, 0, 0, 0.7),
          inset 0 3px 6px rgba(255, 255, 255, 0.75),
          inset 0 -3px 12px rgba(0, 0, 0, 0.5),
          inset 0 0 35px rgba(212, 175, 55, 0.15)
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "18px",
        flexWrap: "nowrap",
        whiteSpace: "nowrap",
        maxWidth: "88%",
        overflow: "hidden"
      }}>
        
        {/* Top Arc Fresnel Reflection */}
        <div style={{
          position: "absolute",
          top: "2px",
          left: "8%",
          width: "84%",
          height: "45%",
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.04) 70%, transparent 100%)",
          borderRadius: "100px",
          pointerEvents: "none",
          zIndex: 1
        }} />

        {/* GLIDING 8D LIQUID DROPLET (WITH POWER BURST ON HIGHLIGHT WORDS) */}
        {activeIndex !== -1 && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: `calc(30px + (100% - 60px) * ${liquidOffsetPct / 100})`,
            transform: "translate(-50%, -50%)",
            width: isCurrentWordHighlight ? "135px" : "115px",
            height: "54px",
            background: isCurrentWordHighlight
              ? "radial-gradient(ellipse at center, rgba(255, 240, 160, 0.45) 0%, rgba(212, 175, 55, 0.25) 70%, transparent 100%)"
              : "radial-gradient(ellipse at center, rgba(255, 223, 115, 0.35) 0%, rgba(212, 175, 55, 0.15) 60%, transparent 100%)",
            borderRadius: "50px",
            border: isCurrentWordHighlight
              ? "1.5px solid rgba(255, 245, 180, 0.7)"
              : "1px solid rgba(255, 242, 168, 0.4)",
            boxShadow: isCurrentWordHighlight
              ? "0 0 45px rgba(255, 215, 0, 0.8), inset 0 2px 8px rgba(255, 255, 255, 0.9)"
              : "0 0 25px rgba(212, 175, 55, 0.5), inset 0 1px 5px rgba(255, 255, 255, 0.8)",
            pointerEvents: "none",
            zIndex: 3,
            transition: "left 0.12s cubic-bezier(0.2, 0, 0.2, 1), width 0.15s ease, box-shadow 0.15s ease"
          }} />
        )}

        {/* WORDS DISPLAY - ZERO BOUNCE, STRICTLY LOCKED ON BASELINE */}
        {script.map((item, index) => {
          const isActive = frame >= item.start && frame < item.end;
          const hasPassed = frame >= item.end;

          let textColor = "rgba(148, 163, 184, 0.65)"; // Future words: Muted silver grey
          let textShadow = "none";

          if (isActive) {
            if (item.isHighlight) {
              textColor = "#FFF8D6"; // Highlight power word: Radiant Gold Champagne
              textShadow = "0 0 30px rgba(255, 215, 0, 0.95), 0 0 15px rgba(212, 175, 55, 0.8)";
            } else {
              textColor = "#FFFFFF"; // Active standard word
              textShadow = "0 0 25px rgba(255, 223, 115, 0.9), 0 0 10px rgba(212, 175, 55, 0.6)";
            }
          } else if (hasPassed) {
            textColor = "#FFFFFF"; // Read words: Solid crisp white
            textShadow = "0 2px 8px rgba(0, 0, 0, 0.8)";
          }

          return (
            <span
              key={index}
              style={{
                color: textColor,
                fontSize: "40px",
                fontFamily: '"Inter", -apple-system, sans-serif',
                fontWeight: isActive ? (item.isHighlight ? 800 : 700) : 500,
                letterSpacing: item.isHighlight ? "0px" : "-0.5px",
                lineHeight: 1,
                display: "inline-block",
                position: "relative",
                zIndex: 10,
                textShadow: textShadow,
                transition: "color 0.15s ease, text-shadow 0.15s ease",
                transform: "none" // NEVER BOUNCE!
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