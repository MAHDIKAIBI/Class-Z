import { 
  useCurrentFrame, 
  useVideoConfig, 
  interpolate, 
  Easing 
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

  if (!script || script.length === 0) return null;

  // Find active word index
  let activeIndex = -1;
  for (let i = 0; i < script.length; i++) {
    if (frame >= script[i].start && frame < script[i].end) {
      activeIndex = i;
      break;
    }
  }

  // Smooth continuous transition between words (0 to script.length - 1)
  let targetProgress = 0;
  if (activeIndex !== -1) {
    const w = script[activeIndex];
    const wordProgress = interpolate(frame, [w.start, w.end], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    targetProgress = activeIndex + wordProgress;
  } else if (frame >= script[script.length - 1].end) {
    targetProgress = script.length - 1;
  }

  // Calculate sliding position as percentage across all words
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
      {/* 8D CURVY LIQUID GLASS CONTAINER */}
      <div style={{
        position: "relative",
        background: "linear-gradient(155deg, rgba(22, 27, 38, 0.6) 0%, rgba(6, 8, 14, 0.88) 100%)",
        backdropFilter: "blur(50px) saturate(220%) brightness(118%)",
        WebkitBackdropFilter: "blur(50px) saturate(220%) brightness(118%)",
        borderRadius: "100px", // Ultra-Curvy Liquid Pill
        padding: "18px 46px",
        border: "1px solid rgba(255, 255, 255, 0.22)",
        borderTop: "2px solid rgba(255, 255, 255, 0.75)", // 8D Specular Top Rim
        borderBottom: "1.5px solid rgba(212, 175, 55, 0.5)", // Caustic Gold Reflection
        boxShadow: `
          0 40px 100px rgba(0, 0, 0, 0.9),
          0 15px 40px rgba(0, 0, 0, 0.7),
          inset 0 3px 6px rgba(255, 255, 255, 0.75),
          inset 0 -3px 12px rgba(0, 0, 0, 0.5),
          inset 0 0 30px rgba(212, 175, 55, 0.14)
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
        
        {/* Top Arc Fresnel Reflection (Curved Glass Sheen) */}
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

        {/* Diagonal Light Sweep Passing Periodically */}
        <div style={{
          position: "absolute",
          top: 0,
          left: `${interpolate(frame % 180, [0, 90], [-40, 140])}%`,
          width: "30%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)",
          transform: "skewX(-25deg)",
          pointerEvents: "none",
          zIndex: 2
        }} />

        {/* GLIDING 8D LIQUID DROPLET / LENS UNDER ACTIVE WORD */}
        {activeIndex !== -1 && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: `calc(30px + (100% - 60px) * ${liquidOffsetPct / 100})`,
            transform: "translate(-50%, -50%)",
            width: "120px",
            height: "56px",
            background: "radial-gradient(ellipse at center, rgba(255, 235, 150, 0.3) 0%, rgba(212, 175, 55, 0.15) 60%, transparent 100%)",
            borderRadius: "50px",
            border: "1px solid rgba(255, 242, 168, 0.4)",
            boxShadow: "0 0 25px rgba(212, 175, 55, 0.6), inset 0 1px 6px rgba(255, 255, 255, 0.8)",
            pointerEvents: "none",
            zIndex: 3,
            transition: "left 0.12s cubic-bezier(0.2, 0, 0.2, 1)"
          }} />
        )}

        {/* WORDS DISPLAY - STRICTLY LOCKED TO BASELINE, ZERO JUMP */}
        {script.map((item, index) => {
          const isActive = frame >= item.start && frame < item.end;
          const hasPassed = frame >= item.end;

          let textColor = "rgba(148, 163, 184, 0.65)"; // Future words: Elegant muted grey/silver
          let textShadow = "none";

          if (isActive) {
            textColor = "#FFFFFF"; // Active word: Crisp radiant white on gold
            textShadow = "0 0 25px rgba(255, 223, 115, 0.9), 0 0 10px rgba(212, 175, 55, 0.6)";
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
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "-0.5px",
                lineHeight: 1,
                display: "inline-block",
                position: "relative",
                zIndex: 10,
                textShadow: textShadow,
                transition: "color 0.15s ease, text-shadow 0.15s ease",
                // ZERO TRANSFORM: Text stays rock solid!
                transform: "none"
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