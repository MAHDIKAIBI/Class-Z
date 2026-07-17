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

export type RadialDataProps = {
  start: number;
  end: number;
  targetPercentage: number;
  label: string;
  brandColor?: string;
};

export const BiometricScanRing: React.FC<RadialDataProps> = ({ 
  start, 
  end, 
  targetPercentage, 
  label,
  brandColor = "#00FF66" 
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isActive = frame >= start && frame < end;
  const duration = end - start;
  
  // Dynamic entry physics
  const entranceSpring = spring({ 
    frame: isActive ? frame - start : 0, 
    fps, 
    config: { damping: 14, stiffness: duration < 30 ? 250 : 150, mass: 1.2 } 
  });

  // Smooth data counting logic
  const fillProgress = interpolate(
    frame - start,
    [10, duration - 20], // Starts filling slightly after it appears, finishes before it leaves
    [0, targetPercentage],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  const scale = isActive ? interpolate(entranceSpring, [0, 1], [0.8, 1]) : 1;
  const opacity = isActive ? interpolate(entranceSpring, [0, 0.5], [0, 1]) : 0;

  // SVG Circle Math
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (fillProgress / 100) * circumference;

  return (
    <div style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 40,
      opacity,
      transform: `scale(${scale})`
    }}>
      <div style={{
        background: "rgba(10, 10, 15, 0.4)",
        backdropFilter: "blur(40px) saturate(150%)",
        WebkitBackdropFilter: "blur(40px) saturate(150%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6), inset 0 2px 20px rgba(255,255,255,0.05)",
        borderRadius: "40px",
        padding: "60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ position: "relative", width: "320px", height: "320px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          
          {/* Background Track */}
          <svg width="320" height="320" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
            <circle cx="160" cy="160" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="none" />
            
            {/* The Glowing Data Ring */}
            <circle 
              cx="160" 
              cy="160" 
              r={radius} 
              stroke={brandColor} 
              strokeWidth="16" 
              fill="none" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 20px ${brandColor}80)`
              }}
            />
          </svg>

          {/* Center Ticking Number */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ 
                color: "#FFFFFF", 
                fontSize: "84px", 
                fontWeight: 900,
                fontFamily: '"Geist", "Inter", system-ui, sans-serif',
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-2px"
              }}>
                {Math.floor(fillProgress)}
              </span>
              <span style={{ color: brandColor, fontSize: "40px", fontWeight: 700, marginLeft: "4px" }}>%</span>
            </div>
          </div>
        </div>

        <span style={{
          marginTop: "30px",
          color: "rgba(255,255,255,0.6)",
          fontSize: "24px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "4px"
        }}>
          {label}
        </span>
      </div>
    </div>
  );
};

export const Scene = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#020202" }}>
      <Img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2564&auto=format&fit=crop" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
      <BiometricScanRing start={20} end={120} targetPercentage={94} label="Client Conversion" />
    </AbsoluteFill>
  );
};