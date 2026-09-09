import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  interpolate, 
  Easing, 
  OffthreadVideo, 
  Img, 
  staticFile as remotionStaticFile 
} from "remotion";
import React from "react";
import { CinematicTextureWrapper } from './CinematicTextureWrapper';

const staticFile = (path: string) => {
  if (!path) return '';
  let cleanPath = path;
  if (cleanPath.startsWith('public/')) {
    cleanPath = cleanPath.slice(7);
  } else if (cleanPath.startsWith('/public/')) {
    cleanPath = cleanPath.slice(8);
  }
  try { cleanPath = decodeURIComponent(cleanPath); } catch(e) {}
  return remotionStaticFile(cleanPath);
};

export type FloatingCardSubject = {
  id: string;
  rank?: string;           // e.g. "#5", "#4", "#1"
  label?: string;          // e.g. "ENTRY BENCHMARK"
  subtitle?: string;       // e.g. "UNCOMPROMISED VELOCITY"
  imageUrl?: string;       // Local or remote image
  color?: string;          // Hex or rgba accent color
  isClassified?: boolean;  // If true, shows lock / classified badge
};

export type Floating3DCardsPayload = {
  duration?: number;
  actualDurationFrames?: number;
  bgVideoSrc?: string;
  headlineTag?: string;    // e.g. "TOPIC REVEAL // THE 2026 PAYLOAD"
  headlineText?: string;   // Full headline text
  accentWord?: string;     // Keyword to highlight with theme color
  themeNiche?: "midi" | "gold" | "crime" | "tech";
  subjects: FloatingCardSubject[];
};

export const Floating3DCardsCanvas: React.FC<{ payload: Floating3DCardsPayload }> = ({ payload }) => {
  const rawFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 100% DYNAMIC DURATION: Relies strictly on the actual spoken audio length
  const dur = payload.actualDurationFrames 
    || (payload as any).visualDurFrames 
    || payload.duration 
    || Math.round(fps * 7.5);

  const startFrame = (payload as any).trigger_frame ?? 0;
  const frame = Math.max(0, Math.min(dur, rawFrame - startFrame));

  const subjects = payload.subjects && payload.subjects.length > 0 
    ? payload.subjects 
    : [
        { id: "s1", rank: "#1", label: "PRIMARY SUBJECT", subtitle: "VERIFIED REVEAL", color: "#00F0FF" }
      ];

  const totalCards = subjects.length;

  // -------------------------------------------------------------
  // ADAPTIVE 3D CYLINDER ARC MATHEMATICS (1 to N Cards)
  // -------------------------------------------------------------
  // ADAPTIVE 3D CYLINDER ARC MATHEMATICS (1 to N Cards) - 2K UNIVISIUM (2560x1333)
  // -------------------------------------------------------------
  const arcRadius = 1180;
  const arcSpreadDeg = totalCards <= 1 
    ? 0 
    : totalCards === 2 
      ? 25 
      : Math.min(23, 140 / (totalCards - 1));

  const cardsCoords = subjects.map((_, i) => {
    if (totalCards === 1) {
      return { baseX: 0, baseZ: 0, baseRotY: 0 };
    }
    const centerOffset = i - (totalCards - 1) / 2;
    const angleDeg = centerOffset * arcSpreadDeg;
    const angleRad = (angleDeg * Math.PI) / 180;
    const baseX = Math.sin(angleRad) * arcRadius;
    const baseZ = Math.cos(angleRad) * arcRadius - arcRadius;
    const baseRotY = -angleDeg;
    return { baseX, baseZ, baseRotY };
  });

  const firstCardX: number = cardsCoords[0]?.baseX ?? 0;
  const lastCardX: number = cardsCoords[cardsCoords.length - 1]?.baseX ?? 0;

  // -------------------------------------------------------------
  // DYNAMIC CAMERA CHOREOGRAPHY NORMALIZED TO AUDIO DURATION:
  // Phase 1 (0 to 28%): High-angle top-down descent, swooping in
  // Phase 2 (28% to 52%): Macro zoom dive into Card #1 (sliver of next card)
  // Phase 3 (52% to 100%): Dolly glide across cards to the last card
  // -------------------------------------------------------------
  const p1End = dur * 0.28;
  const p2End = dur * 0.52;

  let camPitch: number = 0;
  let camY: number = 0;
  let camZ: number = 0;
  let camX: number = 0;

  if (frame <= p1End) {
    const t = interpolate(frame, [0, p1End], [0, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    camPitch = interpolate(t, [0, 1], [42, 11]);
    camY = interpolate(t, [0, 1], [-280, -35]);
    camZ = interpolate(t, [0, 1], [-600, 220]);
    camX = Number(interpolate(t, [0, 1], [0, totalCards > 1 ? firstCardX * 0.85 : 0]));
  } else if (frame <= p2End) {
    const t = interpolate(frame, [p1End, p2End], [0, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    camPitch = interpolate(t, [0, 1], [11, 4]);
    camY = interpolate(t, [0, 1], [-35, -10]);
    camZ = interpolate(t, [0, 1], [220, 640]); // Macro zoom: Card fills frame, sliver of next card
    camX = Number(interpolate(t, [0, 1], [totalCards > 1 ? firstCardX * 0.85 : 0, firstCardX]));
  } else {
    const t = interpolate(frame, [p2End, dur], [0, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.2, 0.05, 0.2, 1) });
    camPitch = interpolate(t, [0, 1], [4, 7]);
    camY = interpolate(t, [0, 1], [-10, -18]);
    camZ = interpolate(t, [0, 1], [640, totalCards > 1 ? 580 : 660]);
    camX = Number(interpolate(t, [0, 1], [firstCardX, lastCardX]));
  }

  // Background Theme Accent Color
  const themeNiche = payload.themeNiche || "midi";
  const defaultAccent = themeNiche === "gold" ? "#D4AF37" : themeNiche === "crime" ? "#EF4444" : "#00F0FF";

  return (
    <CinematicTextureWrapper
      backgroundLayer={
        <AbsoluteFill style={{ zIndex: 0, backgroundColor: "#020306", overflow: "hidden" }}>
          {/* Background Video (Muted, Darkened Stock Atmosphere) */}
          {payload.bgVideoSrc && (
            <div style={{ position: "absolute", inset: "-10%", transform: `scale(${interpolate(frame, [0, dur], [1, 1.12], { extrapolateRight: "clamp" })})`, transformOrigin: "center" }}>
              <OffthreadVideo
                src={payload.bgVideoSrc.startsWith('http') ? payload.bgVideoSrc : staticFile(payload.bgVideoSrc)}
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.25, filter: "grayscale(90%) contrast(130%)" }}
                muted
                onError={(e) => console.log("Media playback error on Floating3DCards video:", e)}
              />
            </div>
          )}

          {/* Volumetric Ambient Color Halo */}
          <div style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            width: "1100px",
            height: "800px",
            transform: "translateX(-50%)",
            background: `radial-gradient(circle, ${defaultAccent}33 0%, transparent 70%)`,
            filter: "blur(140px)",
            pointerEvents: "none",
            opacity: 0.35
          }} />

          {/* Heavy Deep Vignette */}
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 450px rgba(0,0,0,1)", pointerEvents: "none" }} />
        </AbsoluteFill>
      }
    >
      {/* 3D SCENE STAGE - 2K UNIVISIUM PERSPECTIVE */}
      <AbsoluteFill style={{ perspective: "1450px", perspectiveOrigin: "50% 44%", transformStyle: "preserve-3d" }}>
        
        {/* Reflective Ground Floor Plane */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: "-50%",
          width: "200%",
          height: "62%",
          background: `radial-gradient(ellipse at 50% 0%, rgba(18, 24, 36, 0.85) 0%, #020306 75%)`,
          transform: "rotateX(85deg) translateZ(-320px)",
          opacity: 0.94,
          pointerEvents: "none"
        }} />

        {/* Camera Rig Transform */}
        <AbsoluteFill style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${camPitch}deg) translateX(${-camX}px) translateY(${-camY}px) translateZ(${camZ}px)`
        }}>

          {/* 3D Cards Track */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transformStyle: "preserve-3d"
          }}>
            {subjects.map((sub, i) => {
              const { baseX, baseZ, baseRotY } = cardsCoords[i];

              // Smooth continuous floating motion per card
              const floatY = Math.sin((frame + i * 26) / 19) * 14;
              const floatRotZ = Math.cos((frame + i * 22) / 24) * 1.5;

              // Simulated Optical Depth-of-Field Blur relative to Camera Pan
              const distToCam = Math.abs(baseX - camX);
              const dofBlur = totalCards === 1 ? 0 : Math.min(14, Math.max(0, (distToCam - 240) / 130));
              const isFocused = distToCam < 320;

              const cardColor = sub.color || defaultAccent;
              const cardRank = sub.rank || (totalCards === 1 ? "#1" : `#${totalCards - i}`);

              // Light sweep animation across card edge
              const sweepX = ((frame * 2.8 + i * 45) % 280) - 90;

              return (
                <div
                  key={sub.id || `card-${i}`}
                  style={{
                    position: "absolute",
                    width: "560px",
                    height: "780px",
                    borderRadius: "36px",
                    transformStyle: "preserve-3d",
                    transform: `translateX(${baseX}px) translateZ(${baseZ}px) translateY(${floatY}px) rotateY(${baseRotY}deg) rotateZ(${floatRotZ}deg)`,
                    filter: `blur(${dofBlur.toFixed(1)}px)`,
                    willChange: "transform, filter"
                  }}
                >
                  {/* Volumetric Drop Glow Behind Card Edges */}
                  <div style={{
                    position: "absolute",
                    inset: "-32px",
                    borderRadius: "56px",
                    background: `radial-gradient(circle at 50% 50%, ${cardColor}88 0%, transparent 72%)`,
                    filter: "blur(52px)",
                    transform: "translateZ(-35px)",
                    opacity: isFocused ? 0.95 : 0.35,
                    pointerEvents: "none"
                  }} />

                  {/* Obsidian Glass Outer Shell */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "28px",
                    background: `linear-gradient(135deg, rgba(20, 26, 36, 0.9) 0%, rgba(6, 8, 12, 0.96) 100%)`,
                    border: `1px solid rgba(255, 255, 255, 0.12)`,
                    borderTop: `1.8px solid ${cardColor}`,
                    borderLeft: `1px solid rgba(255, 255, 255, 0.28)`,
                    boxShadow: `0 40px 100px rgba(0, 0, 0, 0.95), inset 0 0 35px rgba(255, 255, 255, 0.03)`,
                    overflow: "hidden",
                    backdropFilter: "blur(25px)"
                  }}>

                    {/* Mystery Card Image (Intentionally Blurred & Contrasted) */}
                    {sub.imageUrl ? (
                      <Img
                        src={sub.imageUrl.startsWith('http') ? sub.imageUrl : staticFile(sub.imageUrl)}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: "blur(22px) saturate(1.4) brightness(0.62)",
                          transform: "scale(1.2)"
                        }}
                      />
                    ) : (
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(circle at 50% 40%, ${cardColor}22 0%, #030508 85%)`
                      }} />
                    )}

                    {/* Dark Vignette & High-Tech Gridlines */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "radial-gradient(circle at 50% 40%, transparent 20%, rgba(0,0,0,0.85) 100%)"
                    }} />
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0.18,
                      backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
                      backgroundSize: "32px 32px"
                    }} />

                    {/* Anamorphic Light Sweep */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(115deg, transparent 25%, rgba(255, 255, 255, 0.16) 45%, ${cardColor}55 50%, transparent 60%)`,
                      transform: `translateX(${sweepX}%)`,
                      mixBlendMode: "screen",
                      pointerEvents: "none"
                    }} />

                    {/* Card Header & Badge */}
                    <div style={{
                      position: "absolute",
                      top: "24px",
                      left: "24px",
                      right: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      zIndex: 20,
                      filter: "blur(7px)",
                      userSelect: "none"
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 14px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(0,0,0,0.65)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        backdropFilter: "blur(10px)"
                      }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cardColor, boxShadow: `0 0 10px ${cardColor}` }} />
                        <span style={{ fontFamily: 'monospace', fontSize: "13px", fontWeight: 900, letterSpacing: "1px", color: "#FFFFFF" }}>{cardRank}</span>
                      </div>

                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: "10px",
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.5)",
                        fontWeight: 700,
                        backgroundColor: "rgba(255,255,255,0.06)",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "1px solid rgba(255,255,255,0.06)"
                      }}>
                        {sub.isClassified ? "CLASSIFIED" : "CONFIDENTIAL"}
                      </div>
                    </div>

                    {/* Mystery Lock Icon & Label Center */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 20,
                      textAlign: "center",
                      padding: "0 24px"
                    }}>
                      <div style={{
                        width: "68px",
                        height: "68px",
                        borderRadius: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "16px",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
                        backdropFilter: "blur(14px)"
                      }}>
                        <svg style={{ width: "32px", height: "32px", opacity: 0.85 }} fill="none" stroke={cardColor} strokeWidth="1.6" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: "12px",
                        letterSpacing: "4px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        marginBottom: "6px",
                        color: cardColor,
                        filter: "blur(6px)",
                        userSelect: "none"
                      }}>
                        {sub.label || `SECTION ${i + 1}`}
                      </div>
                      <div style={{
                        fontSize: "22px",
                        fontWeight: 900,
                        letterSpacing: "-0.5px",
                        color: "#FFFFFF",
                        textTransform: "uppercase",
                        textShadow: "0 10px 25px rgba(0,0,0,0.9)",
                        filter: "blur(8px)",
                        userSelect: "none"
                      }}>
                        {sub.subtitle || "VERIFIED PAYLOAD"}
                      </div>
                    </div>

                    {/* Bottom Footer Spec Readout */}
                    <div style={{
                      position: "absolute",
                      bottom: "22px",
                      left: "24px",
                      right: "24px",
                      zIndex: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      paddingTop: "14px",
                      fontFamily: 'monospace',
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.4)",
                      filter: "blur(5px)",
                      userSelect: "none"
                    }}>
                      <span>STATUS: SEALED</span>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>REVEAL CH.{i + 1}</span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </AbsoluteFill>

        {/* Volumetric Headline Presentation Overlay */}
        <AbsoluteFill style={{
          zIndex: 40,
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: "90px",
          pointerEvents: "none"
        }}>
          <div style={{ textAlign: "center", maxWidth: "1100px", padding: "0 30px" }}>
            <div style={{
              display: "inline-block",
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: defaultAccent,
              marginBottom: "12px",
              padding: "4px 14px",
              backgroundColor: "rgba(0,0,0,0.6)",
              border: `1px solid ${defaultAccent}40`,
              borderRadius: "9999px"
            }}>
              {payload.headlineTag || "TOPIC REVEAL // THE PAYLOAD"}
            </div>

            <h1 style={{
              fontSize: "44px",
              fontWeight: 900,
              letterSpacing: "-1.5px",
              color: "#FFFFFF",
              textTransform: "uppercase",
              margin: 0,
              lineHeight: 1.15,
              textShadow: "0 15px 35px rgba(0,0,0,0.95)"
            }}>
              {payload.headlineText ? (
                payload.headlineText
              ) : (
                <>
                  We Are Breaking Down The Only <span style={{ color: defaultAccent }}>{totalCards} Subjects</span> That Matter
                </>
              )}
            </h1>
          </div>
        </AbsoluteFill>

      </AbsoluteFill>
    </CinematicTextureWrapper>
  );
};
