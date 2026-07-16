import { AbsoluteFill } from "remotion";
import React from "react";

export const GlobalFinisher: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill>
      
      {/* THE SUBTLE NORMALIZATION (Pillar 2) */}
      <AbsoluteFill 
        style={{ 
          filter: "contrast(1.03) saturate(0.95) brightness(0.98)" 
        }}
      >
        {children}
      </AbsoluteFill>

      {/* THE STATIC FILM TEXTURE (Pillar 3) */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity: 0.02, 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

    </AbsoluteFill>
  );
};
