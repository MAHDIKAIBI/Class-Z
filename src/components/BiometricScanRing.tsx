import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
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
  brandColor = "#D4AF37" // Default to Magnates Old Money Rich Gold
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isActive = frame >= start && frame < end;
  const duration = Math.max(1, end - start);
  const localFrame = isActive ? frame - start : 0;
  
  // High-End Over-damped Springs
  const entranceSpring = spring({ 
    frame: localFrame, 
    fps, 
    config: { damping: 200, stiffness: 45, mass: 1.2 } 
  });

  // Smooth cinematic data counting
  const fillProgress = interpolate(
    localFrame,
    [8, Math.max(9, duration - 15)],
    [0, targetPercentage],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.25, 0.1, 0.25, 1) }
  );

  const scale = isActive ? interpolate(entranceSpring, [0, 1], [0.92, 1]) : 1;
  const opacity = isActive ? interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: "clamp" }) : 0;
  const blurAmount = isActive ? interpolate(localFrame, [0, 15], [12, 0], { extrapolateRight: "clamp" }) : 12;

  // Concentric Ring Radii
  const outerRadius = 145;
  const mainRadius = 125;
  const innerRadius = 100;
  const coreRadius = 75;

  const circumference = 2 * Math.PI * mainRadius;
  const strokeDashoffset = circumference - (fillProgress / 100) * circumference;

  // Radar Scanner Sweep angle
  const scanRotation = (localFrame * 2.5) % 360;
  const counterRotation = -(localFrame * 0.8) % 360;
  const pulseGlow = Math.sin(localFrame * 0.1) * 0.2 + 0.8;

  // Generate 72 precision tick marks (every 5 degrees)
  const ticks = Array.from({ length: 72 }).map((_, i) => {
    const angle = i * 5;
    const isMajor = i % 9 === 0; // Every 45 deg
    const isQuarter = i % 18 === 0; // Every 90 deg
    return { angle, isMajor, isQuarter };
  });

  return (
    <AbsoluteFill style={{
      justifyContent: "center",
      alignItems: "center",
      zIndex: 60,
      pointerEvents: "none",
      opacity,
      filter: `blur(${blurAmount}px)`,
      transform: `scale(${scale})`
    }}>
      {/* LUXURY DOSSIER HUD CONTAINER */}
      <div style={{
        position: "relative",
        background: "linear-gradient(145deg, rgba(10, 12, 16, 0.88) 0%, rgba(3, 4, 6, 0.95) 100%)",
        backdropFilter: "blur(40px) saturate(1.4)",
        WebkitBackdropFilter: "blur(40px) saturate(1.4)",
        border: "1px solid rgba(212, 175, 55, 0.2)",
        boxShadow: "0 50px 120px rgba(0,0,0,0.92), inset 0 2px 20px rgba(212, 175, 55, 0.12)",
        borderRadius: "16px",
        padding: "48px 56px 44px 56px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "480px"
      }}>
        
        {/* Precision HUD Corner Brackets */}
        <div style={{ position: "absolute", top: "12px", left: "12px", width: "16px", height: "16px", borderTop: "2px solid #D4AF37", borderLeft: "2px solid #D4AF37", opacity: 0.8 }} />
        <div style={{ position: "absolute", top: "12px", right: "12px", width: "16px", height: "16px", borderTop: "2px solid #D4AF37", borderRight: "2px solid #D4AF37", opacity: 0.8 }} />
        <div style={{ position: "absolute", bottom: "12px", left: "12px", width: "16px", height: "16px", borderBottom: "2px solid #D4AF37", borderLeft: "2px solid #D4AF37", opacity: 0.8 }} />
        <div style={{ position: "absolute", bottom: "12px", right: "12px", width: "16px", height: "16px", borderBottom: "2px solid #D4AF37", borderRight: "2px solid #D4AF37", opacity: 0.8 }} />

        {/* Top Telemetry Header */}
        <div style={{ 
          width: "100%", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "28px",
          borderBottom: "1px solid rgba(212, 175, 55, 0.15)",
          paddingBottom: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ 
              width: "7px", 
              height: "7px", 
              borderRadius: "50%", 
              backgroundColor: "#D4AF37", 
              boxShadow: "0 0 10px #D4AF37",
              opacity: pulseGlow
            }} />
            <span style={{ 
              fontFamily: '"Inter", "SF Pro Display", sans-serif', 
              fontSize: "11px", 
              letterSpacing: "3px", 
              color: "rgba(255,255,255,0.75)", 
              fontWeight: 600,
              textTransform: "uppercase" 
            }}>
              BIOMETRIC PROTOCOL // VERIFIED
            </span>
          </div>
          <span style={{ 
            fontFamily: '"Inter", "SF Pro Display", sans-serif', 
            fontSize: "10px", 
            letterSpacing: "2px", 
            color: "rgba(212, 175, 55, 0.7)", 
            fontWeight: 500 
          }}>
            LATENCY: 0.04ms
          </span>
        </div>

        {/* HUD CIRCULAR RETICLE DISPLAY */}
        <div style={{ position: "relative", width: "340px", height: "340px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          
          <svg width="340" height="340" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id="goldGradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2A8" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#AA8529" />
              </linearGradient>
              <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Outer Tick Marks (72 ticks) */}
            <g transform="translate(170, 170)">
              {ticks.map((t, idx) => (
                <line
                  key={idx}
                  x1="0"
                  y1={-outerRadius}
                  x2="0"
                  y2={-outerRadius + (t.isQuarter ? 10 : t.isMajor ? 7 : 4)}
                  stroke={t.isQuarter ? "#D4AF37" : t.isMajor ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.15)"}
                  strokeWidth={t.isQuarter ? 2 : 1}
                  transform={`rotate(${t.angle})`}
                />
              ))}
            </g>

            {/* 2. Counter-Rotating Dotted Telemetry Track */}
            <circle
              cx="170"
              cy="170"
              r={outerRadius - 16}
              stroke="rgba(212, 175, 55, 0.25)"
              strokeWidth="1"
              strokeDasharray="3, 8"
              fill="none"
              transform={`rotate(${counterRotation} 170 170)`}
            />

            {/* 3. Outer Static Precision Ring */}
            <circle 
              cx="170" 
              cy="170" 
              r={outerRadius} 
              stroke="rgba(212, 175, 55, 0.15)" 
              strokeWidth="1" 
              fill="none" 
            />

            {/* 4. Main Background Inactive Track */}
            <circle 
              cx="170" 
              cy="170" 
              r={mainRadius} 
              stroke="rgba(255, 255, 255, 0.04)" 
              strokeWidth="10" 
              fill="none" 
            />

            {/* 5. Main Active Gold Data Arc */}
            <circle 
              cx="170" 
              cy="170" 
              r={mainRadius} 
              stroke="url(#goldGradientRing)" 
              strokeWidth="10" 
              fill="none" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              filter="url(#goldGlow)"
              transform="rotate(-90 170 170)"
            />

            {/* 6. Inner Thin Compass Reticle */}
            <circle 
              cx="170" 
              cy="170" 
              r={innerRadius} 
              stroke="rgba(212, 175, 55, 0.2)" 
              strokeWidth="1" 
              strokeDasharray="60, 30"
              fill="none" 
              transform={`rotate(${scanRotation} 170 170)`}
            />

            {/* 7. Precision Crosshairs */}
            <line x1="170" y1="50" x2="170" y2="70" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
            <line x1="170" y1="270" x2="170" y2="290" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
            <line x1="50" y1="170" x2="70" y2="170" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
            <line x1="270" y1="170" x2="290" y2="170" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
          </svg>

          {/* Center Holographic Core Readout */}
          <div style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
              <span style={{
                fontFamily: '"Inter", "SF Pro Display", sans-serif',
                fontSize: "68px",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                background: "linear-gradient(180deg, #FFFFFF 20%, #E2B714 80%, #AA8529 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-1px",
                lineHeight: 1
              }}>
                {Math.round(fillProgress)}
              </span>
              <span style={{
                fontFamily: '"Inter", "SF Pro Display", sans-serif',
                fontSize: "28px",
                fontWeight: 600,
                color: "#D4AF37",
                marginLeft: "3px"
              }}>
                %
              </span>
            </div>

            {/* Micro Calibration Indicator */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "8px",
              opacity: 0.6
            }}>
              <span style={{ fontSize: "9px", letterSpacing: "2px", color: "rgba(255,255,255,0.8)", fontFamily: '"Inter", sans-serif' }}>
                INDEX: {Math.round(fillProgress * 8.42)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Label & Classification Banner */}
        <div style={{
          marginTop: "24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <span style={{
            fontFamily: '"Playfair Display", "Cinzel", Georgia, serif',
            fontSize: "20px",
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "3px",
            textTransform: "uppercase",
            textShadow: "0 4px 15px rgba(0,0,0,0.8)"
          }}>
            {label}
          </span>
          <div style={{
            width: "60px",
            height: "1px",
            background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
            marginTop: "8px"
          }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};