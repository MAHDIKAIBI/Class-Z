import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { HeroType } from './HeroDetector';
import { SmartAudio } from './SmartAudio';
import { useDynamicSfx } from './useDynamicSfx';

interface Props {
    numericValue: number;
    type?: HeroType;
    durationFrames: number;
    globalIndex?: number;
    prefix?: string;
    suffix?: string;
}

export const AnimatedNumber: React.FC<Props> = ({ 
    numericValue, 
    type = 'generic', 
    durationFrames, 
    globalIndex = 0, 
    prefix: prefixOverride, 
    suffix: suffixOverride 
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 1. Old Money Luxury Palette
    let numGradient = "linear-gradient(180deg, #FFFFFF 15%, #E2B714 70%, #AA8529 100%)";
    let accentColor = "#D4AF37"; // Rich Gold
    let categoryBadge = "FINANCIAL DOSSIER // VALUATION PROTOCOL";

    if (type === "money") {
        categoryBadge = "CAPITAL VALUATION // NET ASSETS";
    } else if (type === "year") {
        categoryBadge = "HISTORICAL TIMELINE // CHRONO ARCHIVE";
        numGradient = "linear-gradient(180deg, #FFFFFF 30%, #D4D4D8 100%)";
        accentColor = "#E4E4E7";
    } else if (type === "hp") {
        categoryBadge = "SPECIFICATION // PEAK HORSEPOWER";
    } else if (type === "percent") {
        categoryBadge = "PERFORMANCE METRIC // MARGIN YIELD";
    } else if (type === "loss") {
        categoryBadge = "CRITICAL DEFICIT // CAPITAL LOSS";
        numGradient = "linear-gradient(180deg, #FFFFFF 15%, #EF4444 70%, #991B1B 100%)";
        accentColor = "#EF4444";
    } else if (type === "gain") {
        categoryBadge = "EXPONENTIAL GROWTH // CAPITAL GAIN";
    }

    const sfxPath = useDynamicSfx(type, globalIndex);

    // 2. Majestic Slow Burn Counting
    const countDuration = Math.min(35, durationFrames); 
    const currentNum = interpolate(frame, [0, countDuration], [0, numericValue], { extrapolateRight: 'clamp' });
    
    // 3. Heavy Camera Easing (No Bounce, Zero Jitter)
    const entranceSprg = spring({
        frame,
        fps,
        config: { damping: 200, stiffness: 45, mass: 1.2 },
    });

    const blurAmount = interpolate(frame, [0, 12], [14, 0], { extrapolateRight: 'clamp' });
    const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
    const tracking = interpolate(frame, [0, 150], [0, 10]);

    const formatValue = (num: number) => {
        if (type === 'year') return { display: Math.floor(num).toString(), suffix: "" };
        
        let display = "";
        let suffix = "";
        
        if (numericValue >= 1e9) {
            display = (num / 1e9).toFixed(1).replace(/\.0$/, '');
            suffix = "B";
        } else if (numericValue >= 1e6) {
            display = (num / 1e6).toFixed(1).replace(/\.0$/, '');
            suffix = "M";
        } else if (numericValue >= 1000) {
            display = (num / 1000).toFixed(1).replace(/\.0$/, '');
            suffix = "K";
        } else {
            display = (numericValue % 1 !== 0) ? num.toFixed(1) : Math.floor(num).toString();
        }

        if (type === 'percent') suffix = "%";
        else if (type === 'hp') suffix = " HP";
        else if (type === 'duration') suffix = " SEC";

        return { display, suffix };
    };

    const { display, suffix: computedSuffix } = formatValue(currentNum);
    const suffix = suffixOverride || computedSuffix;
    const prefix = prefixOverride || (type === 'money' ? '$' : '');

    // Generate Dynamic Sparkline Wave points based on current frame and progress
    const progress = Math.min(1, frame / countDuration);
    const wavePoints = Array.from({ length: 16 }).map((_, i) => {
        const x = i * 22;
        const normalizedProgress = (i / 15) <= progress ? 1 : 0.2;
        const y = 30 - Math.sin((i + frame * 0.2) * 0.7) * (10 * normalizedProgress) - (i * 1.2 * normalizedProgress);
        return `${x},${Math.max(4, Math.min(36, y))}`;
    }).join(' ');

    return (
        <AbsoluteFill style={{ 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: 'transparent', // Pure transparent overlay! Never obscuring B-roll!
            zIndex: 200, 
            pointerEvents: 'none', 
            transformStyle: 'preserve-3d', 
            perspective: '1200px' 
        }}>
            {sfxPath && <SmartAudio src={sfxPath} durationFrames={durationFrames} />}

            {/* 4. EXECUTIVE DOSSIER HUD CARD */}
            <div style={{
                position: 'relative',
                transform: `translateZ(120px) scale(${interpolate(entranceSprg, [0, 1], [0.94, 1])})`,
                filter: `blur(${blurAmount}px)`,
                opacity: opacity,
                
                // Gilded Obsidian Glassmorphism
                padding: '38px 72px 34px 72px',
                background: 'linear-gradient(155deg, rgba(8, 10, 14, 0.90) 0%, rgba(2, 3, 5, 0.96) 100%)',
                backdropFilter: 'blur(40px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
                border: `1px solid rgba(212, 175, 55, 0.25)`,
                borderTop: `2px solid ${accentColor}`, 
                boxShadow: `0 50px 120px rgba(0,0,0,0.95), inset 0 2px 25px rgba(212, 175, 55, 0.12)`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '560px'
            }}>
                
                {/* Precision Chamfered Corner Accents */}
                <div style={{ position: 'absolute', top: '8px', left: '8px', width: '12px', height: '12px', borderTop: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}`, opacity: 0.9 }} />
                <div style={{ position: 'absolute', top: '8px', right: '8px', width: '12px', height: '12px', borderTop: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}`, opacity: 0.9 }} />
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '12px', height: '12px', borderBottom: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}`, opacity: 0.9 }} />
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '12px', height: '12px', borderBottom: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}`, opacity: 0.9 }} />

                {/* Top Dossier Protocol Badge */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
                    paddingBottom: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            backgroundColor: accentColor, 
                            boxShadow: `0 0 10px ${accentColor}` 
                        }} />
                        <span style={{ 
                            fontFamily: '"Inter", "SF Pro Display", sans-serif', 
                            fontSize: '11px', 
                            letterSpacing: '3px', 
                            color: 'rgba(255,255,255,0.7)', 
                            fontWeight: 600,
                            textTransform: 'uppercase' 
                        }}>
                            {categoryBadge}
                        </span>
                    </div>
                    <span style={{ 
                        fontFamily: '"Inter", monospace', 
                        fontSize: '10px', 
                        letterSpacing: '2px', 
                        color: `${accentColor}CC`, 
                        fontWeight: 500 
                    }}>
                        SEC.0{globalIndex + 1} // REAL-TIME
                    </span>
                </div>

                {/* Main Hero Number Value */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    justifyContent: 'center',
                    lineHeight: 1
                }}>
                    {prefix && (
                        <span style={{ 
                            fontFamily: '"Playfair Display", "Cinzel", serif',
                            color: accentColor, 
                            fontSize: '90px', 
                            fontWeight: 500,
                            marginRight: '12px',
                            textShadow: '0 8px 30px rgba(0,0,0,0.9)'
                        }}>
                            {prefix}
                        </span>
                    )}
                    <span style={{ 
                        fontFamily: '"Inter", "-apple-system", "SF Pro Display", sans-serif',
                        fontSize: '140px',
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: `${tracking}px`,
                        background: numGradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 15px 40px rgba(0,0,0,1))'
                    }}>
                        {display}
                    </span>
                    {suffix && (
                        <span style={{ 
                            fontFamily: '"Inter", sans-serif',
                            color: accentColor, 
                            opacity: 0.9, 
                            marginLeft: suffix === '%' ? '6px' : '16px', 
                            fontSize: '56px', 
                            fontWeight: 600, 
                            letterSpacing: '1px' 
                        }}>
                            {suffix}
                        </span>
                    )}
                </div>

                {/* Holographic Sparkline Mini-Visualizer */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '14px 0 10px 0' }}>
                    <svg width="330" height="38" style={{ overflow: 'visible' }}>
                        <defs>
                            <linearGradient id="sparklineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="30%" stopColor={accentColor} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={accentColor} stopOpacity="1" />
                            </linearGradient>
                        </defs>
                        <polyline
                            fill="none"
                            stroke="url(#sparklineGrad)"
                            strokeWidth="2"
                            points={wavePoints}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {/* Leading Glow Point */}
                        <circle cx={Math.min(330, progress * 330)} cy="20" r="3.5" fill={accentColor} style={{ filter: `drop-shadow(0 0 6px ${accentColor})` }} />
                    </svg>
                </div>

                {/* Bottom Hairline Telemetry Ribbon */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '10px'
                }}>
                    <span style={{ fontSize: '9px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: '"Inter", sans-serif' }}>
                        CLASSIFICATION: CONFIDENTIAL
                    </span>
                    <span style={{ fontSize: '9px', letterSpacing: '2px', color: 'rgba(212, 175, 55, 0.6)', fontFamily: '"Inter", monospace' }}>
                        VERIFIED BY ALGORITHM
                    </span>
                </div>

                {/* Subtle Animated Gold Floor Laser Glow */}
                <div style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '1px',
                    background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                    boxShadow: `0 0 20px ${accentColor}`
                }} />
            </div>
        </AbsoluteFill>
    );
};
