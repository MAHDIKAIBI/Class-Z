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
// 1. THE VAULT COMPONENT (Fully Adaptable Content-Hugging Edition)
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
  const { fps } = useVideoConfig();

  const isActive = frame >= start && frame < end;
  const duration = end - start;

  return (
    <div style={{ 
      position: "absolute", 
      width: "100%", 
      height: "100%", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      zIndex: 40 
    }}>
      {/* 
        Flex container dynamically centers the cards. 
        flexWrap allows them to stack if you push too much data.
      */}
      <div style={{ 
        display: "flex", 
        gap: "24px", 
        maxWidth: "90%", 
        flexWrap: "wrap", 
        justifyContent: "center" 
      }}>
        
        {stats.map((stat, index) => {
          const delay = index * 5; 
          
          const cardSpring = spring({ 
            frame: isActive ? Math.max(0, frame - start - delay) : 0, 
            fps, 
            config: { damping: 24, stiffness: 140, mass: 1 } 
          });

          const rawValue = interpolate(
            Math.max(0, frame - start - delay), 
            [15, duration - 30], 
            [0, stat.value], 
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }
          );

          const scale = isActive ? interpolate(cardSpring, [0, 1], [0.95, 1]) : 1;
          const yShift = isActive ? interpolate(cardSpring, [0, 1], [20, 0]) : 0;
          const blurReveal = isActive ? interpolate(cardSpring, [0, 1], [15, 0]) : 0;
          let opacity = 0;
          
          if (isActive) {
            opacity = interpolate(cardSpring, [0, 0.5], [0, 1]);
          } else if (frame >= end) {
            opacity = 0; 
          }

          const glarePosition = interpolate(
            frame - start - delay,
            [0, 60],
            [-100, 200],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div key={index} style={{
              // REMOVED flex: 1 to prevent forced equal widths
              // Added flexShrink: 0 so cards never crush inward
              flexShrink: 0,
              position: "relative",
              overflow: "hidden",
              background: "linear-gradient(145deg, rgba(20, 20, 22, 0.65) 0%, rgba(10, 10, 12, 0.8) 100%)",
              backdropFilter: "blur(48px) saturate(120%)",
              WebkitBackdropFilter: "blur(48px) saturate(120%)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 20px rgba(255,255,255,0.02)",
              borderRadius: "20px",
              padding: "48px 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start", 
              transform: `scale(${scale}) translateY(${yShift}px)`,
              filter: `blur(${blurReveal}px)`,
              opacity
            }}>
              
              <div style={{
                position: "absolute",
                top: 0,
                left: `${glarePosition}%`,
                width: "50%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
                transform: "skewX(-25deg)",
                pointerEvents: "none"
              }} />

              <div style={{ 
                color: "rgba(255,255,255,0.4)", 
                fontSize: "12px", 
                fontWeight: 600,
                textTransform: "uppercase", 
                letterSpacing: "3px", 
                marginBottom: "12px",
                fontFamily: '"Geist", "Inter", system-ui, sans-serif',
                whiteSpace: "nowrap" // Prevents the label from breaking
              }}>
                {stat.label}
              </div>
              
              <div style={{ 
                display: "flex", 
                alignItems: "baseline", 
                color: "#FFFFFF", 
                fontFamily: '"Geist", "Inter", sans-serif',
                whiteSpace: "nowrap" // CRITICAL FIX: Forces container to expand to fit the entire number
              }}>
                {stat.prefix && (
                  <span style={{ fontSize: "28px", fontWeight: 500, marginRight: "4px", opacity: 0.6 }}>
                    {stat.prefix}
                  </span>
                )}
                <span style={{ 
                  fontSize: "56px", 
                  fontWeight: 500, 
                  fontVariantNumeric: "tabular-nums", 
                  letterSpacing: "-2px",
                  textShadow: "0 0 40px rgba(255,255,255,0.15)"
                }}>
                  {Math.floor(rawValue).toLocaleString()}
                </span>
                {stat.suffix && (
                  <span style={{ fontSize: "28px", fontWeight: 500, marginLeft: "4px", opacity: 0.6 }}>
                    {stat.suffix}
                  </span>
                )}
              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
};

// ============================================================================
// 2. THE TEST WRAPPER 
// ============================================================================

export const Scene = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#020202" }}>
      <Img 
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} 
      />
      <GlassStatGrid 
        start={15} 
        end={160} 
        stats={[
          { label: "Clinic Revenue", value: 184999, prefix: "$" },
          { label: "PMU Client LTV", value: 4199, prefix: "$" },
          { label: "Close Rate", value: 67, suffix: "%" }
        ]} 
      />
    </AbsoluteFill>
  );
};