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

  const reticleOffsetPct = script.length > 1
    ? (targetProgress / (script.length - 1)) * 100
    : 50;

  return (
    <div style={{
      position: "absolute",
      bottom: "10%",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
      pointerEvents: "none",
      padding: "0 24px"
    }}>
      {/* PRECISION CYBER-LUXURY HUD BANNER (CHAMFERED EDGES - NOT A PILL) */}
      <div style={{
        position: "relative",
        background: "linear-gradient(180deg, rgba(12, 14, 20, 0.92) 0%, rgba(3, 4, 6, 0.98) 100%)",
        backdropFilter: "blur(30px) saturate(1.4)",
        WebkitBackdropFilter: "blur(30px) saturate(1.4)",
        border: "1px solid rgba(212, 175, 55, 0.3)",
        borderTop: "2px solid #D4AF37",
        borderRadius: "4px", // Sharp, modern dossier aesthetic
        padding: "16px 42px 18px 42px",
        boxShadow: "0 30px 80px rgba(0, 0, 0, 0.95), inset 0 1px 15px rgba(212, 175, 55, 0.08)",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: "94%",
        boxSizing: "border-box"
      }}>
        
        {/* Precision HUD Corner Brackets */}
        <div style={{ position: "absolute", top: "4px", left: "4px", width: "8px", height: "8px", borderTop: "2px solid #D4AF37", borderLeft: "2px solid #D4AF37" }} />
        <div style={{ position: "absolute", top: "4px", right: "4px", width: "8px", height: "8px", borderTop: "2px solid #D4AF37", borderRight: "2px solid #D4AF37" }} />
        <div style={{ position: "absolute", bottom: "4px", left: "4px", width: "8px", height: "8px", borderBottom: "2px solid #D4AF37", borderLeft: "2px solid #D4AF37" }} />
        <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "8px", height: "8px", borderBottom: "2px solid #D4AF37", borderRight: "2px solid #D4AF37" }} />

        {/* Top Micro Telemetry Ribbon */}
        <div style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          borderBottom: "1px solid rgba(212, 175, 55, 0.15)",
          paddingBottom: "4px"
        }}>
          <span style={{
            fontFamily: '"Inter", monospace',
            fontSize: "10px",
            letterSpacing: "3px",
            color: "#D4AF37",
            fontWeight: 600,
            textTransform: "uppercase"
          }}>
            // POWER HIGHLIGHT PROTOCOL
          </span>
          <span style={{
            fontFamily: '"Inter", monospace',
            fontSize: "9px",
            letterSpacing: "1px",
            color: "rgba(255, 255, 255, 0.4)"
          }}>
            EMP.REEL // CH.02
          </span>
        </div>

        {/* WORDS CONTAINER */}
        <div style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          whiteSpace: "nowrap"
        }}>
          {/* GLIDING RETICLE TARGETING FRAME (SNAPS OVER ACTIVE WORD) */}
          {activeIndex !== -1 && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: `calc(35px + (100% - 70px) * ${reticleOffsetPct / 100})`,
              transform: "translate(-50%, -50%)",
              width: isCurrentWordHighlight ? "140px" : "110px",
              height: "48px",
              border: isCurrentWordHighlight ? "2px solid #FFD700" : "1px solid rgba(212, 175, 55, 0.6)",
              borderRadius: "4px",
              background: isCurrentWordHighlight ? "rgba(212, 175, 55, 0.15)" : "rgba(255, 255, 255, 0.04)",
              boxShadow: isCurrentWordHighlight ? "0 0 35px rgba(255, 215, 0, 0.7), inset 0 0 15px rgba(255, 215, 0, 0.3)" : "0 0 15px rgba(212, 175, 55, 0.3)",
              pointerEvents: "none",
              zIndex: 2,
              transition: "left 0.12s cubic-bezier(0.2, 0, 0.2, 1), width 0.15s ease, border-color 0.15s ease"
            }}>
              {/* Reticle Corner Crosshair Ticks */}
              <div style={{ position: "absolute", top: "-3px", left: "-3px", width: "5px", height: "5px", borderTop: "2px solid #FFF", borderLeft: "2px solid #FFF" }} />
              <div style={{ position: "absolute", top: "-3px", right: "-3px", width: "5px", height: "5px", borderTop: "2px solid #FFF", borderRight: "2px solid #FFF" }} />
              <div style={{ position: "absolute", bottom: "-3px", left: "-3px", width: "5px", height: "5px", borderBottom: "2px solid #FFF", borderLeft: "2px solid #FFF" }} />
              <div style={{ position: "absolute", bottom: "-3px", right: "-3px", width: "5px", height: "5px", borderBottom: "2px solid #FFF", borderRight: "2px solid #FFF" }} />
            </div>
          )}

          {/* WORDS DISPLAY - STRICTLY LOCKED TO BASELINE */}
          {script.map((item, index) => {
            const isActive = frame >= item.start && frame < item.end;
            const hasPassed = frame >= item.end;

            let textColor = "rgba(148, 163, 184, 0.65)";
            let textShadow = "none";
            let backgroundStyle = "none";

            if (isActive) {
              if (item.isHighlight) {
                textColor = "transparent";
                backgroundStyle = "linear-gradient(180deg, #FFFFFF 15%, #FFD700 70%, #AA8529 100%)";
                textShadow = "none";
              } else {
                textColor = "#FFFFFF";
                textShadow = "0 0 20px rgba(255, 255, 255, 0.9)";
              }
            } else if (hasPassed) {
              textColor = "#FFFFFF";
              textShadow = "0 2px 8px rgba(0, 0, 0, 0.9)";
            }

            return (
              <span
                key={index}
                style={{
                  color: textColor,
                  fontSize: "36px",
                  fontFamily: '"Inter", -apple-system, sans-serif',
                  fontWeight: item.isHighlight ? 800 : (isActive ? 700 : 500),
                  letterSpacing: item.isHighlight ? "1px" : "-0.3px",
                  lineHeight: 1,
                  display: "inline-block",
                  position: "relative",
                  zIndex: 10,
                  textShadow: textShadow,
                  background: backgroundStyle,
                  WebkitBackgroundClip: item.isHighlight && isActive ? "text" : "border-box",
                  WebkitTextFillColor: item.isHighlight && isActive ? "transparent" : "inherit",
                  filter: item.isHighlight && isActive ? "drop-shadow(0 0 12px rgba(255,215,0,0.8))" : "none",
                  transition: "color 0.15s ease",
                  transform: "none", // NEVER BOUNCE!
                  padding: "0 4px"
                }}
              >
                {item.isHighlight ? item.word.toUpperCase() : item.word}
              </span>
            );
          })}
        </div>

        {/* Bottom Hairline Laser Bar with Center Gold Accent */}
        <div style={{
          width: "100%",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #D4AF37 50%, transparent)",
          marginTop: "12px",
          opacity: 0.7
        }} />
      </div>
    </div>
  );
};