import { 
  useCurrentFrame, 
  useVideoConfig 
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

  return (
    <div style={{
      position: "absolute",
      bottom: "9%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
      pointerEvents: "none",
      padding: "0 24px"
    }}>
      {/* SOFT CINEMATIC VIGNETTE (NO PILL BOX - OPEN FRAME) */}
      <div style={{
        position: "relative",
        padding: "18px 48px",
        background: "radial-gradient(ellipse at center, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.3) 50%, transparent 80%)",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: "92%",
        boxSizing: "border-box"
      }}>
        
        {/* WORDS ROW - MONUMENTAL SERIF TYPOGRAPHY */}
        <div style={{
          display: "flex",
          gap: "16px",
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {script.map((item, index) => {
            const isActive = frame >= item.start && frame < item.end;
            const hasPassed = frame >= item.end;

            let textColor = "rgba(226, 232, 240, 0.45)"; // Future words: Translucent parchment mist
            let textShadow = "0 4px 15px rgba(0, 0, 0, 0.9)";
            let fontWeight = 500;

            if (isActive) {
              textColor = "#FFDF73"; // Active word: Warm Liquid Gold Candlelight
              textShadow = "0 0 30px rgba(226, 183, 20, 0.85), 0 0 15px rgba(212, 175, 55, 0.6), 0 4px 20px rgba(0, 0, 0, 0.95)";
              fontWeight = 700;
            } else if (hasPassed) {
              textColor = "#F8FAFC"; // Read words: Dignified solid marble white
              textShadow = "0 4px 14px rgba(0, 0, 0, 0.95)";
              fontWeight = 600;
            }

            return (
              <span
                key={index}
                style={{
                  color: textColor,
                  fontSize: "42px",
                  fontFamily: '"Playfair Display", "Cinzel", "Georgia", serif',
                  fontWeight: fontWeight,
                  letterSpacing: "0.5px",
                  lineHeight: 1.1,
                  display: "inline-block",
                  position: "relative",
                  zIndex: 10,
                  textShadow: textShadow,
                  transition: "color 0.18s ease, text-shadow 0.18s ease",
                  transform: "none", // STRICTLY LOCKED ON BASELINE, ZERO JUMP
                  padding: "0 2px"
                }}
              >
                {item.word}
              </span>
            );
          })}
        </div>

        {/* DELICATE GOLDEN DIAMOND EMBELLISHMENT */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "16px",
          opacity: 0.75
        }}>
          <div style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, transparent, #D4AF37)" }} />
          <span style={{ color: "#D4AF37", fontSize: "9px" }}>◆</span>
          <div style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, #D4AF37, transparent)" }} />
        </div>
      </div>
    </div>
  );
};