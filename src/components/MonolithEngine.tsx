import { 
  Composition,
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  Img,
  Video
} from "remotion";
import React from "react";

// ============================================================================
// THE KINETIC PARALLAX ENGINE (Fully Dynamic JSON Driven)
// ============================================================================

export type MonolithPayload = {
  duration: number;
  bgScrollingText: string; 
  mainTitle: string;
  subTitle: string;
  subTitleColor: string; 
  assetSrc: string; 
  bgVideoSrc?: string;
};

export const MonolithEngine: React.FC<{ payload: MonolithPayload }> = ({ payload }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // CAMERA LOGIC
  const scale = interpolate(frame, [0, payload.duration], [1, 1.15], { extrapolateRight: 'clamp' });
  const driftX = Math.sin(frame / 60) * 2;
  const driftY = Math.cos(frame / 60) * 2;
  const cameraTransform = `scale(${scale}) translate(${driftX}%, ${driftY}%)`;

  // ENTRY ANIMATIONS
  const cardSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const cardY = interpolate(cardSpring, [0, 1], [100, 0]);
  const cardRotX = interpolate(cardSpring, [0, 1], [20, 0]);
  const opacity = interpolate(cardSpring, [0, 0.5], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#07070a", overflow: "hidden", perspective: "1000px" }}>
      
      {/* LAYER 0: THE DEEP GRID OR CINEMATIC VIDEO */}
      <AbsoluteFill style={{ zIndex: 0, opacity: payload.bgVideoSrc ? 0.4 : 0.15, transform: cameraTransform }}>
        {payload.bgVideoSrc ? (
            <Video 
                src={payload.bgVideoSrc} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                muted 
            />
        ) : (
            <div style={{
              width: "200%", height: "200%",
              position: "absolute", top: "-50%", left: "-50%",
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.1) 2px, transparent 2px)",
              backgroundSize: "100px 100px",
              transform: `rotateX(60deg) translateY(${-(frame * 2)}px)`,
            }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, #07070a 70%)" }} />
      </AbsoluteFill>

      {/* LAYER 1: KINETIC BACKGROUND TYPOGRAPHY */}
      <AbsoluteFill style={{ zIndex: 5, justifyContent: "center", alignItems: "center", transform: cameraTransform, opacity: 0.1 }}>
        <div style={{
          fontSize: "400px", fontFamily: '"Geist", "Inter", sans-serif', fontWeight: 900,
          color: "transparent", WebkitTextStroke: "4px #ffffff", whiteSpace: "nowrap",
          transform: `translateX(${(frame * 3) - 500}px) translateY(-20%)`,
          letterSpacing: "-15px"
        }}>
          {payload.bgScrollingText} {payload.bgScrollingText} {payload.bgScrollingText}
        </div>
      </AbsoluteFill>

      {/* LAYER 2: THE MONOLITH CARD */}
      <AbsoluteFill style={{ zIndex: 20, justifyContent: "center", alignItems: "center", transform: cameraTransform }}>
        
        <div style={{
          width: "600px", height: "750px",
          position: "relative",
          transform: `translateY(${cardY}px) rotateX(${cardRotX}deg) rotateY(${driftX * 2}deg)`,
          opacity: opacity,
          boxShadow: "0 60px 120px rgba(0,0,0,1), 0 0 40px rgba(255,255,255,0.05)",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          
          {payload.assetSrc && (
            <Img src={payload.assetSrc} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.2) grayscale(0.3) brightness(0.7)" }} />
          )}
          
          <div style={{
            position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%",
            background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)",
            transform: `translateX(${interpolate(frame % 150, [0, 150], [-100, 100])}%)`,
            mixBlendMode: "overlay"
          }} />

          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 -100px 150px rgba(0,0,0,0.9)" }} />
        </div>
      </AbsoluteFill>

      {/* LAYER 3: FOREGROUND TYPOGRAPHY */}
      <AbsoluteFill style={{ zIndex: 30, justifyContent: "center", alignItems: "center", transform: cameraTransform }}>
        <div style={{
          position: "absolute", top: "65%", display: "flex", flexDirection: "column", alignItems: "center",
          transform: `translateZ(50px) translateY(${interpolate(cardSpring, [0, 1], [50, 0])}px)`,
          opacity: opacity
        }}>
          <div style={{
            fontSize: "140px", fontFamily: '"Geist", "Inter", sans-serif', fontWeight: 900,
            color: "#ffffff", textTransform: "uppercase", letterSpacing: "-5px",
            textShadow: "0 40px 80px rgba(0,0,0,1)", lineHeight: 1
          }}>
            {payload.mainTitle}
          </div>
          <div style={{
            fontSize: "40px", fontFamily: '"Geist", "Inter", sans-serif', fontWeight: 700,
            color: payload.subTitleColor, letterSpacing: "8px", textTransform: "uppercase",
            textShadow: "0 20px 40px rgba(0,0,0,0.8)"
          }}>
            {payload.subTitle}
          </div>
        </div>
      </AbsoluteFill>

      {/* LAYER 4: OUT-OF-FOCUS FOREGROUND DUST */}
      <AbsoluteFill style={{ zIndex: 40, pointerEvents: "none" }}>
        {[...Array(5)].map((_, i) => {
          const speed = (i + 1) * 2;
          return (
            <div key={i} style={{
              position: "absolute",
              top: `${20 * i}%`, left: `${(frame * speed) % 120}%`,
              width: "15px", height: "15px", borderRadius: "50%",
              background: "rgba(255,255,255,0.3)",
              filter: "blur(8px)",
              transform: `scale(${i % 2 === 0 ? 2 : 1})`
            }} />
          )
        })}
      </AbsoluteFill>

      <AbsoluteFill style={{ zIndex: 50, pointerEvents: "none", boxShadow: "inset 0 0 300px rgba(0,0,0,0.9)" }} />

    </AbsoluteFill>
  );
};
