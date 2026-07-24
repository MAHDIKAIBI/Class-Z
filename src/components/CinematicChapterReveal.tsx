import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  Img,
  Easing,
  Audio,
  staticFile,
  random
} from "remotion";
import React, { useMemo } from "react";

// Webpack require.context to find all chapter SFX dynamically without hardcoding paths.
// This works perfectly in the cloud because it resolves relative to the Remotion project!
let availableSfx: string[] = [];
try {
  // @ts-ignore
  const sfxContext = require.context('../../public/audio/sfx/chapters', false, /\.wav$/);
  availableSfx = sfxContext.keys().map((key: string) => `audio/sfx/chapters/${key.replace('./', '')}`);
} catch (e) {
  console.warn("Could not load dynamic chapter SFX from public/audio/sfx/chapters", e);
}

export type ChapterRevealProps = {
  chapterNumber: number;
  subtitle: string;
  bgImgUrl: string;
  leftAssetUrl?: string;
  rightAssetUrl?: string;
  sfxUrl?: string; // Engine will pass the random sfx path here
};

// ... (BasePlate stays same)
const BasePlate: React.FC<{ bgImgUrl: string; text: string }> = ({ bgImgUrl, text }) => {
  return (
    <AbsoluteFill>
      <Img 
        src={bgImgUrl} 
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%) contrast(1.5)" }} 
      />
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(150, 0, 15, 0.7)", mixBlendMode: "multiply" }} />
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255, 0, 0, 0.3)", mixBlendMode: "color-burn" }} />
      
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <h1 style={{ 
          color: "rgba(255, 255, 255, 0.95)", 
          fontSize: "200px", 
          fontWeight: 900, 
          fontFamily: '"Geist", "Inter", sans-serif',
          whiteSpace: "nowrap",
          textShadow: "0 10px 40px rgba(0,0,0,0.8)"
        }}>
          {text}
        </h1>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const CinematicChapterReveal: React.FC<ChapterRevealProps> = ({ 
  chapterNumber, 
  subtitle, 
  bgImgUrl,
  leftAssetUrl,
  rightAssetUrl,
  sfxUrl
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. THE PERPETUAL PUSH
  const perpetualScale = interpolate(frame, [0, 150], [1, 1.15], { extrapolateRight: "clamp" });

  // 2. THE UNPREDICTABLE SHARD ENGINE
  const driftEase = Easing.out(Easing.cubic);
  const leftShardDrift = interpolate(frame, [0, 50], [0, -80], { easing: driftEase, extrapolateRight: "clamp" });
  const centerShardDrift = interpolate(frame, [0, 50], [0, 40], { easing: driftEase, extrapolateRight: "clamp" });
  const rightShardDrift = interpolate(frame, [0, 50], [0, -50], { easing: driftEase, extrapolateRight: "clamp" });
  const glitchOpacity = interpolate(frame, [38, 48], [1, 0], { extrapolateRight: "clamp" });

  // 3. CHAPTER BOX ENTRANCE
  const boxSpring = spring({ frame: Math.max(0, frame - 40), fps, config: { damping: 14, stiffness: 200 } });
  const boxScale = interpolate(boxSpring, [0, 1], [4, 1]);
  const boxOpacity = interpolate(boxSpring, [0, 0.5], [0, 1]);

  // 4. FLANKING ENTITIES
  const flankSpring = spring({ frame: Math.max(0, frame - 55), fps, config: { damping: 16, stiffness: 120 } });
  const leftFlankX = interpolate(flankSpring, [0, 1], [-800, -500]); 
  const rightFlankX = interpolate(flankSpring, [0, 1], [800, 500]);  

  // 5. DETERMINISTIC AUDIO ROTATION
  const finalSfxUrl = useMemo(() => {
    if (sfxUrl) return sfxUrl; // Explicit override
    if (availableSfx.length === 0) return null;
    if (availableSfx.length === 1) return availableSfx[0];
    
    // Seed the random picker using the chapterNumber and subtitle so it's perfectly synced across renders
    const hash = subtitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + chapterNumber;
    return availableSfx[hash % availableSfx.length];
  }, [sfxUrl, subtitle, chapterNumber]);

  // 6. CINEMATIC AUDIO CROSSFADE (No sudden cuts)
  // Fades in over the first 15 frames, stays at 100%, then fades out smoothly over the last 30 frames.
  const audioVolume = interpolate(
    frame,
    [0, 15, 120, 150],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", overflow: "hidden" }}>
      
      {/* SYNCHRONIZED CINEMATIC AUDIO (Now rotating dynamically with smooth volume curves) */}
      {finalSfxUrl && <Audio src={staticFile(finalSfxUrl)} volume={audioVolume} />}

      <AbsoluteFill style={{ transform: `scale(${perpetualScale})`, justifyContent: "center", alignItems: "center" }}>
        
        {/* ========================================================= */}
        {/* PHASE 1: THE FLOATING MIRROR SHARDS & REFLECTIONS */}
        {/* ========================================================= */}
        <AbsoluteFill style={{ opacity: glitchOpacity }}>
          
          <AbsoluteFill style={{ backgroundColor: "#020202" }} />

          {/* RIGHT SHARD */}
          <AbsoluteFill style={{ 
            transform: `translateX(${rightShardDrift}px)`, 
            clipPath: "polygon(65% -10%, 110% -10%, 90% 110%, 55% 110%)",
            filter: "drop-shadow(-20px 0 30px rgba(0,0,0,0.8))"
          }}>
            <AbsoluteFill style={{ transform: "scale(1.4) translateX(-100px) translateY(20px)", filter: "blur(4px)" }}>
              <BasePlate bgImgUrl={bgImgUrl} text={subtitle} />
            </AbsoluteFill>
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255, 0, 50, 0.1)", mixBlendMode: "overlay" }} />
          </AbsoluteFill>

          {/* LEFT SHARD */}
          <AbsoluteFill style={{ 
            transform: `translateX(${leftShardDrift}px)`, 
            clipPath: "polygon(-10% -10%, 35% -10%, 25% 110%, -20% 110%)",
            filter: "drop-shadow(30px 0 40px rgba(0,0,0,0.9))"
          }}>
            <AbsoluteFill style={{ transform: "scale(2.2) translateX(150px) translateY(-30px)" }}>
              <BasePlate bgImgUrl={bgImgUrl} text={subtitle} />
            </AbsoluteFill>
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.2)" }} />
          </AbsoluteFill>

          {/* CENTER SHARD */}
          <AbsoluteFill style={{ 
            transform: `translateX(${centerShardDrift}px)`, 
            clipPath: "polygon(30% -10%, 70% -10%, 60% 110%, 20% 110%)",
            filter: "drop-shadow(0 0 50px rgba(0,0,0,0.95))"
          }}>
            <AbsoluteFill style={{ transform: "scale(1.15) translateX(-20px) rotate(1deg)" }}>
              <BasePlate bgImgUrl={bgImgUrl} text={subtitle} />
            </AbsoluteFill>
            <div style={{ position: "absolute", left: "20%", top: 0, bottom: 0, width: "5px", backgroundColor: "rgba(255,255,255,0.4)", transform: "skewX(-5deg)" }} />
          </AbsoluteFill>

          {/* TOP LETTERBOX */}
          <AbsoluteFill style={{ 
            height: "22%", top: 0, backgroundColor: "rgba(5, 0, 5, 0.95)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", boxShadow: "0 20px 50px rgba(0,0,0,0.9)", overflow: "hidden"
          }}>
            <AbsoluteFill style={{ 
                transform: `translateY(${interpolate(frame, [0, 50], [50, 0])}px) scale(1.5) rotate(2deg)`, opacity: 0.25, filter: "blur(12px)", transformOrigin: "top center"
            }}>
                <BasePlate bgImgUrl={bgImgUrl} text={subtitle} />
            </AbsoluteFill>
          </AbsoluteFill>

          {/* BOTTOM LETTERBOX */}
          <AbsoluteFill style={{ 
            height: "22%", bottom: 0, top: "auto", backgroundColor: "rgba(5, 0, 5, 0.95)", borderTop: "1px solid rgba(255, 255, 255, 0.05)", boxShadow: "0 -20px 50px rgba(0,0,0,0.9)", overflow: "hidden"
          }}>
            <AbsoluteFill style={{ 
                transform: `translateY(${interpolate(frame, [0, 50], [-50, 0])}px) scaleY(-1) scaleX(1.3) rotate(-3deg)`, opacity: 0.35, filter: "blur(15px)", transformOrigin: "bottom center"
            }}>
                <BasePlate bgImgUrl={bgImgUrl} text={subtitle} />
                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255, 0, 50, 0.6)", mixBlendMode: "overlay" }} />
            </AbsoluteFill>
          </AbsoluteFill>

        </AbsoluteFill>

        {/* ========================================================= */}
        {/* PHASE 2: THE ETHEREAL CHAPTER REVEAL (Ultra-Premium Redesign) */}
        {/* ========================================================= */}
        <AbsoluteFill style={{ opacity: interpolate(frame, [40, 48], [0, 1], { extrapolateRight: "clamp" }), justifyContent: "center", alignItems: "center" }}>
          
          <AbsoluteFill>
            <Img src={bgImgUrl} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%) contrast(1.2)" }} />
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(5, 0, 5, 0.85)" }} />
            <div style={{ position: "absolute", inset: "-50%", background: "radial-gradient(circle at center, rgba(200, 0, 20, 0.15) 0%, transparent 60%)", opacity: interpolate(frame, [45, 100], [0, 1], { extrapolateRight: "clamp" }) + Math.sin(frame / 20) * 0.1 }} />
          </AbsoluteFill>

          <div style={{
            position: "absolute",
            fontSize: "1500px",
            fontWeight: 900,
            fontFamily: '"Geist", "Inter", sans-serif',
            color: "transparent",
            WebkitTextStroke: "2px rgba(255,255,255,0.03)",
            transform: `translateY(-50px) rotate(-15deg) scale(${interpolate(frame, [40, 150], [1, 1.1], { extrapolateRight: "clamp" })})`,
            zIndex: 0
          }}>
            {chapterNumber}
          </div>

          {leftAssetUrl && (
            <div style={{ position: "absolute", transform: `translateX(${leftFlankX}px) translateY(${50 + Math.sin(frame / 15) * 15}px)`, zIndex: 1, opacity: interpolate(flankSpring, [0, 0.3], [0, 1]) }}>
              <Img src={leftAssetUrl} style={{ width: "600px", height: "auto", filter: "drop-shadow(0 50px 50px rgba(0,0,0,0.9))" }} />
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)", zIndex: -1, filter: "blur(40px)" }} />
            </div>
          )}
          {rightAssetUrl && (
            <div style={{ position: "absolute", transform: `translateX(${rightFlankX}px) translateY(${50 + Math.cos(frame / 18) * 15}px)`, zIndex: 1, opacity: interpolate(flankSpring, [0, 0.3], [0, 1]) }}>
              <Img src={rightAssetUrl} style={{ width: "600px", height: "auto", filter: "drop-shadow(0 50px 50px rgba(0,0,0,0.9))" }} />
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)", zIndex: -1, filter: "blur(40px)" }} />
            </div>
          )}

          <div style={{
            transform: `scale(${boxScale}) rotate(-0.5deg)`, 
            opacity: boxOpacity,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative"
          }}>
            
            <div style={{
               position: "absolute", inset: "-30px -80px", 
               backgroundColor: "rgba(40, 0, 5, 0.6)",
               backdropFilter: "blur(20px)",
               border: "1px solid rgba(255, 0, 50, 0.3)",
               boxShadow: "0 30px 60px rgba(0,0,0,0.9), inset 0 0 60px rgba(255, 0, 0, 0.2)",
               zIndex: -1
            }} />

            <div style={{
               position: "absolute", inset: "-30px -80px",
               background: `linear-gradient(110deg, transparent 0%, transparent ${interpolate(frame, [45, 90], [0, 100], { extrapolateRight: "clamp" }) - 20}%, rgba(255, 150, 150, 0.15) ${interpolate(frame, [45, 90], [0, 100], { extrapolateRight: "clamp" })}%, transparent ${interpolate(frame, [45, 90], [0, 100], { extrapolateRight: "clamp" }) + 20}%, transparent 100%)`,
               zIndex: -1
            }} />

            <h1 style={{
              margin: 0,
              fontSize: "100px",
              fontWeight: 900,
              fontFamily: '"Geist", "Inter", sans-serif',
              letterSpacing: "8px",
              textTransform: "uppercase",
              background: `linear-gradient(90deg, #ffffff, #ffcccc, #ffffff)`,
              backgroundSize: "200% auto",
              backgroundPosition: `${interpolate(frame, [50, 120], [0, 100], { extrapolateRight: "clamp" })}% center`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 10px 20px rgba(255,0,0,0.4))"
            }}>
              CHAPTER {chapterNumber}
            </h1>
          </div>

          <div style={{
            marginTop: "60px",
            opacity: interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" }),
            filter: `blur(${interpolate(frame, [60, 90], [20, 0], { extrapolateRight: "clamp" })}px)`,
            transform: `translateY(${interpolate(frame, [60, 90], [30, 0], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" })}px)`,
            zIndex: 10,
            textAlign: "center",
            maxWidth: "1200px"
          }}>
            <h2 style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: "36px",
              fontWeight: 700,
              fontFamily: '"Geist", "Inter", sans-serif',
              letterSpacing: "6px",
              textTransform: "uppercase",
              textShadow: "0 10px 30px rgba(0,0,0,1)",
              position: "relative"
            }}>
              {subtitle}
              <div style={{
                position: "absolute", bottom: "-10px", left: "10%", right: "10%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,0,50,0.8), transparent)",
                opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" }),
                transform: `scaleX(${interpolate(frame, [80, 120], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" })})`
              }} />
            </h2>
          </div>

          <div style={{
            position: "absolute", top: "40%", left: "-50%", width: "200%", height: "15px",
            background: "linear-gradient(90deg, transparent, rgba(255,50,50,0.3), transparent)",
            filter: "blur(12px)", transform: `translateY(${Math.sin(frame / 30) * 150}px) rotate(2deg)`,
            opacity: 0.6, mixBlendMode: "screen", pointerEvents: "none", zIndex: 100
          }} />

        </AbsoluteFill>
      </AbsoluteFill>

      {/* ========================================================= */}
      {/* GLOBAL ATMOSPHERICS */}
      {/* ========================================================= */}
      
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 400px rgba(0,0,0,0.9)", zIndex: 100, pointerEvents: "none" }} />
      <AbsoluteFill style={{ backgroundImage: "url('https://raw.githubusercontent.com/remotion-dev/logo/main/public/noise.png')", opacity: 0.15, mixBlendMode: "screen", pointerEvents: "none", zIndex: 102 }} />
      
      <div style={{ position: "absolute", inset: "-20%", backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 2px)", backgroundSize: "150px 150px", backgroundPosition: `${frame * 2}px ${frame * -1}px`, opacity: 0.2, mixBlendMode: "screen", zIndex: 102, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: "-20%", backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 2px, transparent 3px)", backgroundSize: "250px 300px", backgroundPosition: `${frame * -2.5}px ${frame * -1.5}px`, opacity: 0.15, mixBlendMode: "screen", filter: "blur(1px)", zIndex: 102, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: "-20%", backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 3px, transparent 4px)", backgroundSize: "400px 400px", backgroundPosition: `${frame * 0.5}px ${frame * -3}px`, opacity: 0.15, mixBlendMode: "screen", filter: "blur(4px)", zIndex: 102, pointerEvents: "none" }} />

    </AbsoluteFill>
  );
};
