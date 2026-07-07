import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import React from 'react';

// 1. Particle Systems
const ParticleSystem = ({ preset, energy }: { preset: string, energy: number }) => {
    if (preset === 'none') return null;
    const frame = useCurrentFrame();
    const count = energy > 7 ? 40 : 20;

    return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 80, pointerEvents: 'none' }}>
            {Array.from({ length: count }).map((_, i) => {
                const driftY = (frame * (0.5 + (i % 3) * 0.2) + (i * 100)) % 1100;
                const driftX = Math.sin(frame * 0.02 + i) * 30 + (i * 120);

                if (preset === 'ash') {
                    return <div key={i} style={{ position: 'absolute', width: '4px', height: '4px', backgroundColor: '#333', top: `${1080 - driftY}px`, left: `${driftX}px`, filter: 'blur(1px)' }} />;
                }
                if (preset === 'money') {
                    return <div key={i} style={{ position: 'absolute', width: '30px', height: '15px', backgroundColor: '#2E8B57', border: '1px solid #00FF00', top: `${1080 - driftY}px`, left: `${driftX}px`, transform: `rotate(${frame + i * 20}deg)`, opacity: 0.8 }} />;
                }
                if (preset === 'digital_rain') {
                    const y = (frame * (5 + i%5) + i * 50) % 1100;
                    return <div key={i} style={{ position: 'absolute', width: '2px', height: '20px', backgroundColor: '#0F0', top: `${y}px`, left: `${(i * 40) % 1920}px`, opacity: 0.5 }} />;
                }
                if (preset === 'glass') {
                    return <div key={i} style={{ position: 'absolute', width: '10px', height: '10px', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '15px solid rgba(255,255,255,0.6)', top: `${1080 - driftY}px`, left: `${driftX}px`, transform: `rotate(${frame * 2 + i * 10}deg)` }} />;
                }
                
                // Default Dust
                return <div key={i} style={{ position: 'absolute', width: i % 2 === 0 ? '6px' : '4px', height: i % 2 === 0 ? '6px' : '4px', backgroundColor: '#D4AF37', borderRadius: '50%', top: `${1080 - driftY}px`, left: `${driftX}px`, boxShadow: '0 0 8px #D4AF37', mixBlendMode: 'screen' }} />;
            })}
        </div>
    );
};

// 2. Lighting & Lens Systems
const LensDirector = ({ lighting }: { lighting: string }) => {
    if (lighting === 'none') return null;
    const frame = useCurrentFrame();
    
    if (lighting === 'neon_rim') {
        return <AbsoluteFill style={{ boxShadow: 'inset 0 0 150px rgba(0, 255, 255, 0.2)', zIndex: 75, pointerEvents: 'none', mixBlendMode: 'screen' }} />;
    }
    if (lighting === 'harsh_contrast') {
        return <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 40, pointerEvents: 'none', mixBlendMode: 'multiply' }} />;
    }
    if (lighting === 'volumetric_rays') {
        const rotation = (frame * 0.1) % 360;
        return (
            <AbsoluteFill style={{ zIndex: 85, pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.3, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50%', left: '50%', width: '200%', height: '200%', background: 'conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.8) 10deg, rgba(255,255,255,0) 20deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,0.8) 190deg, rgba(255,255,255,0) 200deg)', transform: `translate(-50%, -50%) rotate(${rotation}deg)`, filter: 'blur(20px)' }} />
            </AbsoluteFill>
        );
    }
    
    // soft_glow
    return <AbsoluteFill style={{ background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 100%)', zIndex: 85, pointerEvents: 'none' }} />;
};

// 3. Event System (Burst / Flashes)
const EventDirector = ({ events, frame, fps }: { events: any[], frame: number, fps: number }) => {
    if (!events || events.length === 0) return null;
    return (
        <>
            {events.map((evt, idx) => {
                const triggerFrame = Math.round((evt.trigger_ms || 0) / 1000 * fps);
                const p = Math.max(0, frame - triggerFrame);
                if (p === 0 || p > 30) return null;
                
                const opacity = interpolate(p, [0, 15, 30], [0, 0.8, 0]);
                
                if (evt.type === 'light_sweep') {
                    const sweepX = interpolate(p, [0, 30], [-1920, 1920]);
                    return <AbsoluteFill key={idx} style={{ zIndex: 90, pointerEvents: 'none', mixBlendMode: 'overlay', background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)`, transform: `translateX(${sweepX}px)`, opacity }} />;
                }
                
                if (evt.type === 'dust_burst') {
                    const scale = interpolate(p, [0, 30], [1, 3]);
                    return (
                        <AbsoluteFill key={idx} style={{ zIndex: 60, pointerEvents: 'none', justifyContent: 'center', alignItems: 'center' }}>
                           <div style={{ width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, transparent 70%)', transform: `scale(${scale})`, opacity, filter: 'blur(20px)', mixBlendMode: 'screen' }} />
                        </AbsoluteFill>
                    );
                }
                return null;
            })}
        </>
    );
};

// 4. Main Effects Director
export const EffectsDirector = ({ variants, events }: any) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (!variants) return null;

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            
            {/* Midground Lighting (z:40-85) */}
            <LensDirector lighting={variants.lighting} />

            {/* Foreground Particles (z:80) */}
            <ParticleSystem preset={variants.particles} energy={variants.energy} />
            
            {/* Event Flashes & Bursts */}
            <EventDirector events={events || []} frame={frame} fps={fps} />
        </AbsoluteFill>
    );
};

// Legacy Effects Components for backward compatibility with Layouts.tsx
export const VolumetricDust = () => <ParticleSystem preset="dust" energy={5} />;
export const FilmGrain = () => <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.1)', mixBlendMode: 'multiply', pointerEvents: 'none' }} />;
export const HeavySmoke = () => <ParticleSystem preset="ash" energy={8} />;
export const LensFlare = () => <LensDirector lighting="volumetric_rays" />;
export const WindowLight = () => <LensDirector lighting="soft_glow" />;
export const EdgeGlow = () => <LensDirector lighting="neon_rim" />;
export const LightRays = () => <LensDirector lighting="volumetric_rays" />;
export const GlassReflection = () => <ParticleSystem preset="glass" energy={5} />;
export const DustBurst = () => <ParticleSystem preset="dust" energy={10} />;
