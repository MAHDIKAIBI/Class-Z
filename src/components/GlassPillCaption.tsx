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

export const GlassPillCaption: React.FC<{ script: WordTiming[] }> = ({ script }) => {
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

  // Smooth continuous transition
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
      {/* 8D CURVY LIQUID OBSIDIAN PILL */}
      <div style={{
        position: "relative",
        background: "linear-gradient(150deg, rgba(16, 20, 28, 0.65) 0%, rgba(4, 5, 8, 0.92) 100%)",
        backdropFilter: "blur(50px) saturate(220%) brightness(115%)",
        WebkitBackdropFilter: "blur(50px) saturate(220%) brightness(115%)",
        borderRadius: "100px", // Ultra-Curvy Liquid Glass
        padding: "16px 44px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderTop: "1.8px solid rgba(255, 255, 255, 0.7)", // Specular top rim
        borderBottom: "1.5px solid rgba(212, 175, 55, 0.45)", // Caustic gold reflection
        boxShadow: `
          0 40px 90px rgba(0, 0, 0, 0.92),
          0 15px 35px rgba(0, 0, 0, 0.65),
          inset 0 2px 5px rgba(255, 255, 255, 0.7),
          inset 0 -2px 10px rgba(0, 0, 0, 0.5),
          inset 0 0 25px rgba(212, 175, 55, 0.12)
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
        
        {/* Curved Fresnel Highlight */}
        <div style={{
          position: "absolute",
          top: "2px",
          left: "10%",
          width: "80%",
          height: "45%",
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.03) 70%, transparent 100%)",
          borderRadius: "100px",
          pointerEvents: "none",
          zIndex: 1
        }} />

        {/* GLIDING 8D LIQUID DROPLET / LENS UNDER ACTIVE WORD */}
        {activeIndex !== -1 && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: `calc(28px + (100% - 56px) * ${liquidOffsetPct / 100})`,
            transform: "translate(-50%, -50%)",
            width: "115px",
            height: "52px",
            background: "radial-gradient(ellipse at center, rgba(255, 223, 115, 0.35) 0%, rgba(212, 175, 55, 0.16) 60%, transparent 100%)",
            borderRadius: "50px",
            border: "1px solid rgba(255, 242, 168, 0.45)",
            boxShadow: "0 0 25px rgba(212, 175, 55, 0.6), inset 0 1px 5px rgba(255, 255, 255, 0.8)",
            pointerEvents: "none",
            zIndex: 3,
            transition: "left 0.12s cubic-bezier(0.2, 0, 0.2, 1)"
          }} />
        )}

        {/* WORDS DISPLAY - ZERO BOUNCE, LOCKED ON BASELINE */}
        {script.map((item, index) => {
          const isActive = frame >= item.start && frame < item.end;
          const hasPassed = frame >= item.end;

          let textColor = "rgba(148, 163, 184, 0.65)"; // Future words: Muted silver grey
          let textShadow = "none";

          if (isActive) {
            textColor = "#FFFFFF"; // Active word: Radiant crisp white
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