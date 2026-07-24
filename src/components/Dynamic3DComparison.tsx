import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  interpolate, 
  Easing,
  spring,
  Img
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import React from "react";

// ============================================================================
// 1. THE VAULT COMPONENT (100% Adaptable 3D Data Engine)
// ============================================================================

export type Bar3DItem = {
  title: string;
  subtitle: string;
  value: number;
  color: string;
  imageUrl?: string;
  start: number;
  end: number;
};

export type Comparison3DProps = {
  unit: string;
  itemA: Bar3DItem;
  itemB: Bar3DItem;
};

export const Dynamic3DComparison: React.FC<Comparison3DProps> = ({ unit, itemA, itemB }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig(); 

  // Core Math: Find the max value so the 3D bars scale perfectly inside the camera view
  const MAX_3D_HEIGHT = 24; 
  const maxValue = Math.max(itemA.value, itemB.value);
  const targetHeightA = (itemA.value / maxValue) * MAX_3D_HEIGHT;
  const targetHeightB = (itemB.value / maxValue) * MAX_3D_HEIGHT;

  // ==========================================================================
  // ITEM A (LEFT) MATH
  // ==========================================================================
  const isActiveA = frame >= itemA.start && frame < itemA.end;
  const durationA = itemA.end - itemA.start;

  const springA = spring({ 
    frame: isActiveA ? frame - itemA.start : 0, 
    fps, 
    config: { damping: 18, stiffness: 120 } 
  });

  const heightA = interpolate(springA, [0, 1], [0.1, targetHeightA]);
  const opacityA = isActiveA ? interpolate(springA, [0, 0.3], [0, 1]) : 0;
  
  const displayValueA = interpolate(
    frame - itemA.start,
    [10, Math.max(11, durationA - 30)],
    [0, itemA.value],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // ==========================================================================
  // ITEM B (RIGHT) MATH
  // ==========================================================================
  const isActiveB = frame >= itemB.start && frame < itemB.end;
  const durationB = itemB.end - itemB.start;

  const springB = spring({ 
    frame: isActiveB ? frame - itemB.start : 0, 
    fps, 
    config: { damping: 18, stiffness: 120 } 
  });

  const heightB = interpolate(springB, [0, 1], [0.1, targetHeightB]);
  const opacityB = isActiveB ? interpolate(springB, [0, 0.3], [0, 1]) : 0;

  const displayValueB = interpolate(
    frame - itemB.start,
    [10, Math.max(11, durationB - 30)],
    [0, itemB.value],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // ==========================================================================
  // CINEMATICS
  // ==========================================================================
  const cameraZ = interpolate(frame, [0, 200], [48, 38], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "transparent", justifyContent: "center", alignItems: "center" }}>
      
      {/* 3D RENDER ENGINE (Background) */}
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 5, cameraZ], fov: 45 }}
        style={{ position: "absolute", zIndex: 0 }}
      >
        <ambientLight intensity={0.2} />
        <spotLight position={[0, 30, 20]} intensity={2.5} color="#ffffff" penumbra={1} />
        <gridHelper args={[150, 60, "#1a1a1a", "#050505"]} position={[0, -10, 0]} />

        {/* Item A 3D Bar */}
        <mesh position={[-4, -10 + heightA / 2, 0]}>
          <boxGeometry args={[3, Math.max(0.1, heightA), 3]} />
          <meshStandardMaterial 
            color={itemA.color} 
            emissive={itemA.color} 
            emissiveIntensity={0.6} 
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Item B 3D Bar */}
        <mesh position={[4, -10 + heightB / 2, 0]}>
          <boxGeometry args={[3, Math.max(0.1, heightB), 3]} />
          <meshStandardMaterial 
            color={itemB.color} 
            emissive={itemB.color} 
            emissiveIntensity={0.6}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </ThreeCanvas>

      {/* PREMIUM GLASSMORPHISM HUD (Foreground) */}
      <div 
        style={{ 
          position: "absolute", 
          bottom: "10%", 
          display: "flex", 
          gap: "40px",
          zIndex: 10 
        }}
      >
        {/* Item A Data Card */}
        <div style={{
          background: "linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
          backdropFilter: "blur(40px) saturate(150%) brightness(1.2)",
          WebkitBackdropFilter: "blur(24px) saturate(120%)",
          border: `1px solid ${itemA.color}40`,
          borderRadius: "20px",
          padding: "30px 40px",
          boxShadow: `0 25px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`,
          opacity: opacityA,
          transform: `translateY(${interpolate(opacityA, [0, 1], [30, 0])}px)`,
          fontFamily: '"Geist", "Inter", system-ui, sans-serif',
          minWidth: "320px",
          flexShrink: 0
        }}>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", fontWeight: 600 }}>{itemA.subtitle}</p>
          <h2 style={{ color: "white", margin: "8px 0 20px 0", fontSize: "24px", fontWeight: "700", letterSpacing: "-0.5px" }}>{itemA.title}</h2>

          {itemA.imageUrl && (
            <div style={{ width: "100%", height: "140px", borderRadius: "12px", overflow: "hidden", marginBottom: "20px", border: `1px solid ${itemA.color}40`, position: "relative" }}>
               <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(10,10,12,0.9), transparent)`, zIndex: 1 }} />
               <Img src={itemA.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ color: itemA.color, fontSize: "56px", fontWeight: "800", fontVariantNumeric: "tabular-nums", textShadow: `0 0 30px ${itemA.color}60`, lineHeight: 1 }}>
              {Math.floor(displayValueA).toLocaleString()}
            </span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "20px", fontWeight: "600" }}>{unit}</span>
          </div>
        </div>

        {/* Item B Data Card */}
        <div style={{
          background: "linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
          backdropFilter: "blur(40px) saturate(150%) brightness(1.2)",
          WebkitBackdropFilter: "blur(24px) saturate(120%)",
          border: `1px solid ${itemB.color}40`,
          borderRadius: "20px",
          padding: "30px 40px",
          boxShadow: `0 25px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`,
          opacity: opacityB,
          transform: `translateY(${interpolate(opacityB, [0, 1], [30, 0])}px)`,
          fontFamily: '"Geist", "Inter", system-ui, sans-serif',
          minWidth: "320px",
          flexShrink: 0
        }}>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", fontWeight: 600 }}>{itemB.subtitle}</p>
          <h2 style={{ color: "white", margin: "8px 0 20px 0", fontSize: "24px", fontWeight: "700", letterSpacing: "-0.5px" }}>{itemB.title}</h2>

          {itemB.imageUrl && (
            <div style={{ width: "100%", height: "140px", borderRadius: "12px", overflow: "hidden", marginBottom: "20px", border: `1px solid ${itemB.color}40`, position: "relative" }}>
               <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(10,10,12,0.9), transparent)`, zIndex: 1 }} />
               <Img src={itemB.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ color: itemB.color, fontSize: "56px", fontWeight: "800", fontVariantNumeric: "tabular-nums", textShadow: `0 0 30px ${itemB.color}60`, lineHeight: 1 }}>
              {Math.floor(displayValueB).toLocaleString()}
            </span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "20px", fontWeight: "600" }}>{unit}</span>
          </div>
        </div>
      </div>

    </AbsoluteFill>
  );
};

// ============================================================================
// 2. THE TEST WRAPPER 
// ============================================================================

export const Scene = () => {
  return (
    <Dynamic3DComparison 
      unit="HP"
      itemA={{
        subtitle: "Challenger",
        title: "BMW E30 M3",
        value: 192,
        color: "#ff1a40",
        start: 15,
        end: 150
      }}
      itemB={{
        subtitle: "Competitor",
        title: "MERCEDES 190E",
        value: 232,
        color: "#00e6b8",
        start: 60,
        end: 150
      }}
    />
  );
};