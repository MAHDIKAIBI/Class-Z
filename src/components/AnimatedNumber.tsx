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

    // 1. Apex Cinematic Palette & Glow Hierarchy
    let numColor = "#D4AF37";      // Default Rich Gold
    let brightColor = "#FFDF73";
    let glowColor = "rgba(212, 175, 55, 0.45)";
    let classificationTag = "[RECORD METRIC]";

    if (type === "money" || type === "gain") {
        numColor = "#D4AF37";
        brightColor = "#FFDF73";
        glowColor = "rgba(212, 175, 55, 0.45)";
        classificationTag = "[VALUATION METRIC]";
    } else if (type === "year") {
        numColor = "#FFFFFF";
        brightColor = "#E6EEFF";
        glowColor = "rgba(255, 255, 255, 0.25)";
        classificationTag = "[HISTORICAL TIMELINE]";
    } else if (type === "hp") {
        numColor = "#D4AF37";
        brightColor = "#FFDF73";
        glowColor = "rgba(212, 175, 55, 0.45)";
        classificationTag = "[OUTPUT BENCHMARK]";
    } else if (type === "percent") {
        numColor = "#D4AF37";
        brightColor = "#FFDF73";
        glowColor = "rgba(212, 175, 55, 0.45)";
        classificationTag = "[DOMINANCE INDEX]";
    } else if (type === "loss") {
        numColor = "#FF2A4D";      // Crimson Red
        brightColor = "#FF7388";
        glowColor = "rgba(255, 42, 77, 0.45)";
        classificationTag = "[CRITICAL DEFICIT]";
    }

    const sfxPath = useDynamicSfx(type, globalIndex);

    // 2. Snappy Quartic Ease-Out Landing (Locks in 7 frames - 0.23s)
    // Eliminates counting lag where voiceover says 100 while HUD shows 1.
    const countProgress = Math.min(1, Math.max(0, frame / 7));
    const countEase = 1 - Math.pow(1 - countProgress, 4);
    const currentNum = countProgress >= 1 ? numericValue : numericValue * countEase;

    // 3. Heavy Camera Easing Entrance (No Bounce, Tight Tabular Kerning)
    const entranceSprg = spring({
        frame,
        fps,
        config: { damping: 200, stiffness: 45, mass: 1.2 },
    });

    const blurAmount = interpolate(frame, [0, 8], [12, 0], { extrapolateRight: 'clamp' });
    const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    const entranceScale = interpolate(entranceSprg, [0, 1], [0.94, 1]);
    const entranceY = interpolate(entranceSprg, [0, 1], [15, 0]);

    // 4. Robust Universal Formatter (Supports all metrics: plain 100, $100, 100%, 100 MPH, $100M)
    const formatValue = (num: number) => {
        if (type === 'year') {
            return { display: Math.round(num).toString(), suffix: "" };
        }

        let display = "";
        let computedSuffix = "";

        if (suffixOverride) {
            if (numericValue >= 1e9 && suffixOverride.toUpperCase().startsWith('B')) {
                display = (num / 1e9).toFixed(1).replace(/\.0$/, '');
            } else if (numericValue >= 1e6 && suffixOverride.toUpperCase().startsWith('M')) {
                display = (num / 1e6).toFixed(1).replace(/\.0$/, '');
            } else if (numericValue >= 1000 && suffixOverride.toUpperCase().startsWith('K')) {
                display = (num / 1000).toFixed(1).replace(/\.0$/, '');
            } else {
                display = (numericValue % 1 !== 0) ? num.toFixed(1) : Math.round(num).toLocaleString();
            }
            return { display, suffix: suffixOverride };
        }

        if (numericValue >= 1e9) {
            display = (num / 1e9).toFixed(1).replace(/\.0$/, '');
            computedSuffix = "B";
        } else if (numericValue >= 1e6) {
            display = (num / 1e6).toFixed(1).replace(/\.0$/, '');
            computedSuffix = "M";
        } else if (numericValue >= 1000) {
            display = (num / 1000).toFixed(1).replace(/\.0$/, '');
            computedSuffix = "K";
        } else {
            display = (numericValue % 1 !== 0) ? num.toFixed(1) : Math.round(num).toLocaleString();
        }

        if (type === 'percent') computedSuffix = "%";
        else if (type === 'hp') computedSuffix = " HP";
        else if (type === 'duration') computedSuffix = " SEC";

        return { display, suffix: computedSuffix };
    };

    const { display, suffix: formattedSuffix } = formatValue(currentNum);
    const suffix = suffixOverride !== undefined ? suffixOverride : formattedSuffix;
    const prefix = prefixOverride !== undefined ? prefixOverride : (type === 'money' ? '$' : '');

    return (
        <AbsoluteFill style={{
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent', // Scrim removed: keeps footage crisp and un-dimmed
            zIndex: 200,
            pointerEvents: 'none',
            perspective: '1400px',
            transformStyle: 'preserve-3d'
        }}>
            {sfxPath && <SmartAudio src={sfxPath} durationFrames={durationFrames} />}

            {/* THE 2K APEX DOSSIER METRIC PANEL */}
            <div style={{
                position: 'relative',
                minWidth: '580px',
                maxWidth: '920px',
                padding: '48px 64px 40px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(16, 22, 34, 0.88) 0%, rgba(5, 7, 12, 0.96) 100%)',
                backdropFilter: 'blur(45px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(45px) saturate(1.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: `0 60px 140px rgba(0, 0, 0, 0.95), 0 0 60px ${glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.25)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${entranceScale}) translateY(${entranceY}px)`,
                opacity: opacity,
                filter: `blur(${blurAmount}px)`,
                transformStyle: 'preserve-3d',
            }}>
                {/* 1. Laser Caliper Top Edge */}
                <div style={{
                    position: 'absolute',
                    top: '-1px',
                    left: '10%',
                    right: '10%',
                    height: '2px',
                    background: `linear-gradient(90deg, transparent, ${numColor} 20%, ${brightColor} 50%, ${numColor} 80%, transparent)`,
                    boxShadow: `0 0 20px ${numColor}`,
                }} />

                {/* 2. Precision Corner Brackets */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', width: '14px', height: '14px', borderTop: `2px solid ${numColor}`, borderLeft: `2px solid ${numColor}`, opacity: 0.7 }} />
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '14px', height: '14px', borderTop: `2px solid ${numColor}`, borderRight: `2px solid ${numColor}`, opacity: 0.7 }} />
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '14px', height: '14px', borderBottom: `2px solid ${numColor}`, borderLeft: `2px solid ${numColor}`, opacity: 0.7 }} />
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '14px', height: '14px', borderBottom: `2px solid ${numColor}`, borderRight: `2px solid ${numColor}`, opacity: 0.7 }} />

                {/* 3. Top Classification Tag (Zero Subtitles) */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 800,
                    letterSpacing: '4px',
                    textTransform: 'uppercase',
                    color: numColor,
                    background: `${numColor}18`,
                    border: `1px solid ${numColor}45`,
                    padding: '5px 18px',
                    borderRadius: '6px',
                    boxShadow: `0 0 20px ${glowColor}`,
                    marginBottom: '20px',
                    fontFamily: '"Inter", sans-serif',
                }}>
                    <span>{classificationTag}</span>
                </div>

                {/* 4. Giant Number Readout - Fixed Tabular Kerning, No Tracking Drift */}
                <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'center',
                    gap: '12px',
                    fontVariantNumeric: 'tabular-nums',
                }}>
                    {prefix ? (
                        <span style={{
                            fontSize: '84px',
                            fontWeight: 600,
                            color: 'rgba(255, 255, 255, 0.75)',
                            fontFamily: '"JetBrains Mono", monospace',
                            lineHeight: 1,
                        }}>
                            {prefix}
                        </span>
                    ) : null}

                    <span style={{
                        fontSize: '144px',
                        fontWeight: 900,
                        color: '#FFFFFF',
                        fontFamily: '"Inter", "-apple-system", sans-serif',
                        lineHeight: 0.95,
                        letterSpacing: '-2px',
                        textShadow: '0 10px 40px rgba(0,0,0,0.95), 0 0 50px rgba(255,255,255,0.25)',
                    }}>
                        {display}
                    </span>

                    {suffix ? (
                        <span style={{
                            fontSize: '72px',
                            fontWeight: 800,
                            color: numColor,
                            fontFamily: '"Inter", sans-serif',
                            letterSpacing: '1px',
                            textShadow: `0 0 30px ${glowColor}`,
                            marginLeft: suffix === '%' ? '4px' : '14px',
                        }}>
                            {suffix}
                        </span>
                    ) : null}
                </div>

                {/* 5. 1px Tracing Detail Line */}
                <div style={{
                    marginTop: '22px',
                    width: '60%',
                    height: '1px',
                    background: `linear-gradient(90deg, transparent, ${numColor}, transparent)`,
                    boxShadow: `0 0 15px ${numColor}`,
                    opacity: 0.8,
                }} />
            </div>
        </AbsoluteFill>
    );
};
