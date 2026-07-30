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


    </AbsoluteFill>
  );
};
