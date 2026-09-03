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

export const CinematicDocumentaryCaption: React.FC<{ script: WordTiming[] }> = ({ script }) => {
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
      {/* 8D CURVY LIQUID OBSIDIAN DOSSIER PILL */}
      <div style={{
        position: "relative",
        background: "linear-gradient(155deg, rgba(16, 20, 30, 0.7) 0%, rgba(4, 5, 8, 0.94) 100%)",
        backdropFilter: "blur(50px) saturate(220%) brightness(115%)",
        WebkitBackdropFilter: "blur(50px) saturate(220%) brightness(115%)",
        borderRadius: "100px",
        padding: "16px 48px",
        border: "1px solid rgba(212, 175, 55, 0.25)",
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
        
        {/* Curved Fresnel Highlight */}
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

        {/* GLIDING 8D LIQUID DROPLET */}
        {activeIndex !== -1 && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: `calc(32px + (100% - 64px) * ${liquidOffsetPct / 100})`,
            transform: "translate(-50%, -50%)",
            width: "125px",
            height: "54px",
            background: "radial-gradient(ellipse at center, rgba(255, 235, 150, 0.35) 0%, rgba(212, 175, 55, 0.18) 60%, transparent 100%)",
            borderRadius: "50px",
            border: "1px solid rgba(255, 242, 168, 0.45)",
            boxShadow: "0 0 28px rgba(212, 175, 55, 0.6), inset 0 1px 6px rgba(255, 255, 255, 0.8)",
            pointerEvents: "none",
            zIndex: 3,
            transition: "left 0.12s cubic-bezier(0.2, 0, 0.2, 1)"
          }} />
        )}

        {/* WORDS DISPLAY - CLASSICAL SERIF, ZERO BOUNCE */}
        {script.map((item, index) => {
          const isActive = frame >= item.start && frame < item.end;
          const hasPassed = frame >= item.end;

          let textColor = "rgba(148, 163, 184, 0.65)"; // Future words: Muted silver grey
          let textShadow = "none";

          if (isActive) {
            textColor = "#FFF8D6"; // Active word: Warm luminous ivory gold
            textShadow = "0 0 25px rgba(255, 223, 115, 0.9), 0 0 12px rgba(212, 175, 55, 0.7)";
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
                fontFamily: '"Playfair Display", "Cinzel", Georgia, serif',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.5px",
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