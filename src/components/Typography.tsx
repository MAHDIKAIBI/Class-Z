import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import React from 'react';

export const TypographyRouter = ({ textData }: any) => {
  if (!textData || !textData.type || !textData.content) return null;
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.02) * 5;
  const type = textData.type.toLowerCase();
  const content = textData.content;

  if (type === 'warning') {
    return (
      <AbsoluteFill style={{ zIndex: 50, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) translateY(${drift}px)`,
          border: `6px solid #E63946`, padding: '20px 50px',
          boxShadow: `0 0 40px #E63946`, backgroundColor: 'rgba(0,0,0,0.85)',
          animation: frame % 15 < 7 ? 'none' : 'opacity 0.5s'
        }}>
           <h1 style={{ color: 'white', fontFamily: 'Impact', fontSize: '80px', margin: 0, textTransform: 'uppercase' }}>{content}</h1>
        </div>
      </AbsoluteFill>
    );
  }
  
  if (type === 'quote') {
    return (
      <AbsoluteFill style={{ zIndex: 50, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) translateY(${drift}px)`,
          width: '70%', textAlign: 'center'
        }}>
           <h1 style={{ color: '#D4AF37', fontFamily: 'Georgia, serif', fontSize: '72px', fontStyle: 'italic', textShadow: '0 10px 30px rgba(0,0,0,0.9)', margin: 0 }}>"{content}"</h1>
        </div>
      </AbsoluteFill>
    );
  }

  if (type === 'big number' || type === 'price tag') {
    return (
      <AbsoluteFill style={{ zIndex: 50, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: `translate(-50%, -50%) scale(${interpolate(frame, [0, 30], [0.8, 1.0], {extrapolateRight: 'clamp'})})`,
          textAlign: 'center'
        }}>
           <h1 style={{ color: '#00FF41', fontFamily: 'Courier New, monospace', fontSize: '150px', fontWeight: 'bold', textShadow: '0 0 50px #00FF41', margin: 0 }}>{content}</h1>
        </div>
      </AbsoluteFill>
    );
  }

  if (type === 'lower third' || type === 'technical label' || type === 'hud label' || type === 'chapter') {
     return (
       <AbsoluteFill style={{ zIndex: 50, pointerEvents: 'none' }}>
         <div style={{
           position: 'absolute', bottom: '15%', left: '10%',
           borderLeft: '5px solid white', paddingLeft: '20px',
           backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px 30px', backdropFilter: 'blur(5px)'
         }}>
            <h2 style={{ color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '40px', fontWeight: 300, margin: 0, letterSpacing: '4px', textTransform: 'uppercase' }}>{content}</h2>
         </div>
       </AbsoluteFill>
     );
  }
  
  // Default: Hero Title or Fact Card
  return (
    <AbsoluteFill style={{ zIndex: 50, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${interpolate(frame, [0, 60], [0.95, 1.05], {extrapolateRight: 'clamp'})})`,
        width: '80%', textAlign: 'center'
      }}>
         <h1 style={{ color: 'white', fontFamily: 'Impact, sans-serif', fontSize: '110px', textTransform: 'uppercase', textShadow: `0 20px 50px rgba(0,0,0,0.9)`, margin: 0 }}>{content}</h1>
      </div>
    </AbsoluteFill>
  );
};
