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

export const AnimatedNumber: React.FC<Props> = ({ numericValue, type = 'generic', durationFrames, globalIndex = 0, prefix: prefixOverride, suffix: suffixOverride }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 1. Old Money Palette
    let numColor = "#FFFFFF";
    let suffixColor = "rgba(255,255,255,0.6)";

    if (type === "money") {
        numColor = "#D4AF37"; // Rich Gold
        suffixColor = "#D4AF37";
    } else if (type === "year") {
        numColor = "#FFFFFF";
        suffixColor = "rgba(255,255,255,0.6)";
    } else if (type === "hp") {
        numColor = "#D4AF37";
        suffixColor = "#D4AF37";
    } else if (type === "percent") {
        numColor = "#D4AF37"; 
        suffixColor = "#D4AF37"; 
    } else if (type === "loss") {
        numColor = "#C41E3A"; // Crimson Red
        suffixColor = "#C41E3A";
    } else if (type === "gain") {
        numColor = "#D4AF37";
        suffixColor = "#D4AF37";
    }

    const sfxPath = useDynamicSfx(type, globalIndex);

    // 2. Majestic Slow Burn Counting
    const countDuration = 20; 
    const currentNum = interpolate(frame, [0, countDuration], [0, numericValue], { extrapolateRight: 'clamp' });
    
    // 3. Heavy Camera Easing (No Bounce, No Shake)
    const entranceSprg = spring({
        frame,
        fps,
        config: { damping: 200, stiffness: 40 },
    });

    // Slow-Burn Fade & Blur
    const blurAmount = interpolate(frame, [0, 10], [10, 0], { extrapolateRight: 'clamp' });
    const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
    
    // Continuous Tracking Expansion
    const tracking = interpolate(frame, [0, 150], [0, 12]);

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
        else if (type === 'duration') suffix = " Seconds";

        return { display, suffix };
    };

    const { display, suffix: computedSuffix } = formatValue(currentNum);
    const suffix = suffixOverride || computedSuffix;
    const prefix = prefixOverride || (type === 'money' ? '$' : '');

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(20, 20, 30, 0.5)', zIndex: 200, pointerEvents: 'none', transformStyle: 'preserve-3d', perspective: '1000px' }}>
            {sfxPath && <SmartAudio src={sfxPath} durationFrames={durationFrames} />}

            {/* 4. The Dossier Data Callout */}
            <div style={{
                position: 'absolute',
                top: '50%',
                transform: `translateY(-50%) translateZ(100px) scale(${interpolate(entranceSprg, [0, 1], [0.95, 1])})`,
                filter: `blur(${blurAmount}px)`,
                opacity: opacity,
                
                // Dossier Glass Panel Styling
                padding: '40px 90px',
                background: 'linear-gradient(to bottom, rgba(5,7,10,0.85), rgba(0,0,0,0.95))',
                backdropFilter: 'blur(30px) saturate(1.2)',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                borderTop: '2px solid rgba(212, 175, 55, 0.7)', 
                boxShadow: '0 60px 100px rgba(0,0,0,0.9), inset 0 5px 20px rgba(212, 175, 55, 0.1)',
                borderRadius: '8px',
                
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'center',
                
                // Clean Sans-Serif Typography
                fontFamily: '"Inter", "-apple-system", "SF Pro Display", sans-serif',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '150px',
                fontWeight: 600,
                letterSpacing: `${tracking}px`,
                textShadow: '0 10px 40px rgba(0,0,0,1)',
            }}>
                {prefix && <span style={{ color: numColor, opacity: 0.8, marginRight: '15px', fontSize: '0.65em', fontWeight: 400 }}>{prefix}</span>}
                <span style={{ color: numColor }}>{display}</span>
                {suffix && <span style={{ color: suffixColor, opacity: 0.7, marginLeft: suffix === '%' ? '5px' : '20px', fontSize: '0.5em', fontWeight: 400, letterSpacing: 'normal' }}>{suffix}</span>}
                
                {/* 1px Gold Tracing Detail */}
                <div style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '40%',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(212,175,55,1), transparent)',
                    boxShadow: '0 0 15px rgba(212,175,55,1)'
                }} />
                
                {/* Decorative UI Accent Marks */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', width: '6px', height: '6px', borderTop: '1px solid #D4AF37', borderLeft: '1px solid #D4AF37', opacity: 0.5 }} />
                <div style={{ position: 'absolute', top: '10px', right: '10px', width: '6px', height: '6px', borderTop: '1px solid #D4AF37', borderRight: '1px solid #D4AF37', opacity: 0.5 }} />
            </div>
        </AbsoluteFill>
    );
};
