import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { SmartAudio } from './SmartAudio';
import { useDynamicSfx } from './useDynamicSfx';

interface Props {
    word: string;
    globalIndex: number;
    durationFrames: number;
    category?: string;
}

export const AnimatedWord: React.FC<Props> = ({ word, globalIndex, durationFrames, category }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Color logic
    let numColor = "#FFFFFF";
    if (category === "Danger") numColor = "#FF4D4D";
    else if (category === "Success") numColor = "#5CFF7A";
    else if (category === "Luxury") numColor = "#FFD54A";

    // Size logic
    let fontSize = "190px";
    if (word.length <= 4) fontSize = "240px";
    else if (word.length >= 10) fontSize = "140px";

    const glow = "0px 8px 30px rgba(0,0,0,.45)";

    // Use dynamic SFX but force 'impact' type
    const sfxPath = useDynamicSfx('impact', globalIndex);

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

    const opacity = frame >= 0 ? 1 : 0; // Instant in, no fade out, hard cut at durationFrames

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            {sfxPath && <SmartAudio src={sfxPath} durationFrames={durationFrames} />}
            <div style={{
                position: 'absolute',
                top: '42%',
                transform: `translateY(-50%) translate(${shakeX}px, ${shakeY}px) scale(${scale})`,
                opacity: opacity,
                filter: `blur(${blurAmount}px)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
            }}>
                <span style={{
                    fontFamily: '"Anton", sans-serif',
                    fontSize: fontSize,
                    fontWeight: 400,
                    color: numColor,
                    textShadow: glow,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    maxWidth: '75vw',
                    whiteSpace: 'nowrap',
                    textOverflow: 'clip'
                }}>
                    {word}
                </span>
            </div>
        </AbsoluteFill>
    );
};
