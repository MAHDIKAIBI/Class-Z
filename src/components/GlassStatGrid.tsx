import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  Img,
  Easing 
} from "remotion";
import React from "react";

// ============================================================================
// 1. ELITE HOLOGRAPHIC STAT GRID (Magnates Media Tier)
// ============================================================================
export type StatItem = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
};

export type GridProps = {
  start: number;
  end: number;
  stats: StatItem[];
};

export const GlassStatGrid: React.FC<GridProps> = ({ start, end, stats }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  const isActive = frame >= start && frame < end;
  const duration = end - start;
  const total = stats.length;

  // GLOBAL CAMERA DRONE
  const camZ = interpolate(frame, [0, durationInFrames], [0, 200], { extrapolateRight: "clamp" });
  const floatY = Math.sin(frame / 30) * 10;

  return (
    <AbsoluteFill style={{ 
      justifyContent: "center", 
      alignItems: "center", 
      zIndex: 40,
      perspective: "1200px" // Creates the 3D space
    }}>
      
      {/* 3D CAMERA RIG */}
      <div style={{
        display: "flex",
        gap: "30px",
        transformStyle: "preserve-3d",
        transform: `translateZ(${camZ}px) translateY(${floatY}px)`,
        justifyContent: "center",
        alignItems: "center"
      }}>
        
        {stats.map((stat, index) => {
          const delay = index * 8; // Staggered entry
          const cardFrame = Math.max(0, frame - start - delay);
          
          const cardSpring = spring({
            frame: isActive ? cardFrame : 0,
            fps,
            config: { damping: 16, stiffness: 120, mass: 1.2 }
          });

          // THE PANORAMIC CURVE MATH
          // Angles outer cards inward like a curved monitor. 
          const targetRotY = total > 1 ? interpolate(index, [0, total - 1], [25, -25]) : 0;
          // Pushes outer cards slightly further back in Z space
          const targetZOffset = total > 1 ? Math.abs(index - (total - 1) / 2) * -60 : 0;

          const scale = isActive ? interpolate(cardSpring, [0, 1], [0.8, 1]) : 1;
          const yShift = isActive ? interpolate(cardSpring, [0, 1], [60, 0]) : 0;
          const rotX = isActive ? interpolate(cardSpring, [0, 1], [-20, 0]) : 0;
          
          // Apply the curve rotation only as it springs in
          const currentRotY = interpolate(cardSpring, [0, 1], [0, targetRotY]);
          const currentZ = interpolate(cardSpring, [0, 1], [-200, targetZOffset]);

          let opacity = 0;
          if (isActive) {
            opacity = interpolate(cardSpring, [0, 0.5], [0, 1]);
          } else if (frame >= end) {
            opacity = 0; 
          }

          // NUMBER TICKING ENGINE
          const rawValue = interpolate(
            cardFrame, 
            [10, duration - 40], 
            [0, stat.value], 
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
          );

          // HOLOGRAPHIC LASER SCANNER
          const scanlineY = interpolate(cardFrame, [0, 45], [-20, 120], { extrapolateRight: "clamp" });

          return (
            <div key={index} style={{
              flexShrink: 0,
              position: "relative",
              transformStyle: "preserve-3d",
              transform: `translateZ(${currentZ}px) translateY(${yShift}px) rotateY(${currentRotY}deg) rotateX(${rotX}deg) scale(${scale})`,
              opacity,
              minWidth: "340px"
            }}>
              
              {/* THE OBSIDIAN GLASS SHELL */}
              <div style={{
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(145deg, rgba(15, 18, 22, 0.85) 0%, rgba(5, 7, 10, 0.95) 100%)",
                backdropFilter: "blur(40px) saturate(130%)",
                WebkitBackdropFilter: "blur(40px) saturate(130%)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.8), inset 0 0 30px rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderTop: "2px solid rgba(255,255,255,0.4)", // Heavy rim light
                borderRadius: "20px",
                padding: "40px 45px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}>
                
                {/* SCANNING LASER EFFECT */}
                <div style={{
                  position: "absolute",
                  top: `${scanlineY}%`,
                  left: 0,
                  width: "100%",
                  height: "4px",
                  background: "rgba(0, 255, 204, 0.8)",
                  boxShadow: "0 0 20px 10px rgba(0, 255, 204, 0.3)",
                  zIndex: 0,
                  pointerEvents: "none"
                }} />

                <div style={{ zIndex: 1, position: "relative" }}>
                  <div style={{ 
                    color: "rgba(255,255,255,0.5)", 
                    fontSize: "14px", 
                    fontWeight: 700,
                    textTransform: "uppercase", 
                    letterSpacing: "4px", 
                    marginBottom: "15px",
                    fontFamily: '"Geist", "Inter", system-ui, sans-serif',
                    textShadow: "0 2px 10px rgba(0,0,0,0.8)"
                  }}>
                    {stat.label}
                  </div>
                  
                  <div style={{ 
                    display: "flex", 
                    alignItems: "baseline", 
                    color: "#FFFFFF", 
                    fontFamily: '"Geist", "Inter", sans-serif',
                    whiteSpace: "nowrap"
                  }}>
                    {stat.prefix && (
                      <span style={{ fontSize: "32px", fontWeight: 600, marginRight: "8px", opacity: 0.8, color: "#00FFCC" }}>
                        {stat.prefix}
                      </span>
                    )}
                    <span style={{ 
                      fontSize: "64px", 
                      fontWeight: 900, 
                      fontVariantNumeric: "tabular-nums", 
                      letterSpacing: "-2px",
                      // Color Dodge simulation for the glowing numbers
                      color: "#FFFFFF",
                      textShadow: "0 0 20px rgba(0, 255, 204, 0.4), 0 0 40px rgba(0, 255, 204, 0.2), 0 5px 15px rgba(0,0,0,0.9)",
                    }}>
                      {Math.floor(rawValue).toLocaleString()}
                    </span>
                    {stat.suffix && (
                      <span style={{ fontSize: "32px", fontWeight: 600, marginLeft: "8px", opacity: 0.8, color: "#00FFCC" }}>
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* FLOOR REFLECTION GLOW */}
              <div style={{
                position: "absolute", bottom: "-30px", left: "0", width: "100%", height: "40px",
                background: `radial-gradient(ellipse, rgba(0, 255, 204, 0.15) 0%, transparent 70%)`,
                filter: "blur(15px)", transform: "rotateX(75deg)"
              }} />

            </div>
          );
        })}
      </div>
      
    </AbsoluteFill>
  );
};

// ============================================================================
// 2. THE TEST WRAPPER 
// ============================================================================
export const Scene = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", overflow: "hidden" }}>
      <Img 
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3, filter: "grayscale(50%)" }} 
      />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 300px rgba(0,0,0,1)" }} />

      <GlassStatGrid 
        start={15} 
        end={200} 
        stats={[
          { label: "WARRANTY EXPOSURE", value: 17190, prefix: "$", suffix: "M" },
          { label: "RECALLED VEHICLES", value: 135000 },
          { label: "EARLY FAILURE RATE", value: 98, suffix: "%" }
        ]} 
      />
    </AbsoluteFill>
  );
};