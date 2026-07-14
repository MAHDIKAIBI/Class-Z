import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { HeroType } from './HeroDetector';
import { SmartAudio } from './SmartAudio';
import { useDynamicSfx } from './useDynamicSfx';

interface Props {
    numericValue: number;
    type: HeroType;
    durationFrames: number;
    globalIndex: number;
}

export const AnimatedNumber: React.FC<Props> = ({ numericValue, type, durationFrames, globalIndex }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    let numColor = "#FFFFFF";
    let suffixColor = "#FFFFFF";
    const glow = "0px 8px 30px rgba(0,0,0,.45)";

    if (type === "money") {
        numColor = "#FFD54A"; // Gold
        suffixColor = "#FFD54A";
    } else if (type === "year") {
        numColor = "#FFFFFF";
        suffixColor = "#FFFFFF";
    } else if (type === "hp") {
        numColor = "#FFD700"; // Yellow text
        suffixColor = "#FFD700";
    } else if (type === "percent") {
        numColor = "#5CFF7A"; // Green
        suffixColor = "#5CFF7A"; 
    } else if (type === "loss") {
        numColor = "#FF4D4D";
        suffixColor = "#FF4D4D";
    } else if (type === "gain") {
        numColor = "#5CFF7A";
        suffixColor = "#5CFF7A";
    }

    const sfxPath = useDynamicSfx(type, globalIndex);

    const countDuration = 12;

    const currentNum = interpolate(frame, [0, countDuration], [0, numericValue], { extrapolateRight: 'clamp' });
    
    // 1. Spring Physics instead of linear interpolation
    const scale = spring({
        frame,
        fps,
        from: 0.8,
        to: 1.0,
        config: {
            damping: 12,
            stiffness: 180,
            mass: 0.8,
        },
    });

    // 2. Motion Blur (high when scale is starting at 0.8, settles to 0 as it hits 1)
    const blurAmount = interpolate(scale, [0.8, 0.95, 1], [10, 0, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // 3. Camera Shake on Impact
    const shakeX = frame === 0 ? 0 : frame === 1 ? -2 : frame === 2 ? 2 : frame === 3 ? -1 : 0;
    const shakeY = frame === 0 ? 0 : frame === 1 ? 1 : frame === 2 ? -1 : frame === 3 ? 1 : 0;

    const opacity = frame >= 0 ? 1 : 0; // Instant in, no fade out, hard cut

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

    const { display, suffix } = formatValue(currentNum);
    const prefix = type === 'money' ? '$' : '';

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', zIndex: 200, pointerEvents: 'none' }}>
            <style>
               {`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');`}
            </style>
            
            {sfxPath && <SmartAudio src={sfxPath} durationFrames={durationFrames} />}

            <div style={{
                position: 'absolute',
                top: '42%',
                transform: `translateY(-50%) translate(${shakeX}px, ${shakeY}px) scale(${scale})`,
                filter: `blur(${blurAmount}px)`,
                fontFamily: '"Anton", sans-serif',
                fontSize: '200px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'center',
                width: '100%',
                textShadow: glow,
                opacity: opacity
            }}>
                {prefix && <span style={{ color: numColor, marginRight: '0' }}>{prefix}</span>}
                <span style={{ color: numColor }}>{display}</span>
                {suffix && <span style={{ color: suffixColor, marginLeft: suffix === '%' ? '0' : '15px' }}>{suffix}</span>}
            </div>
        </AbsoluteFill>
    );
};
