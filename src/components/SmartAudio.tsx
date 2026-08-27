import React from 'react';
import { Audio, useCurrentFrame, interpolate, staticFile } from 'remotion';

interface Props {
    src: string;
    durationFrames: number;
    baseVolume?: number;
    playbackRate?: number;
    fadeInFrames?: number; // optional: ramp up from 0 → baseVolume over N frames
}

export const SmartAudio: React.FC<Props> = ({
    src,
    durationFrames,
    baseVolume = 0.35,
    playbackRate = 1.0,
    fadeInFrames = 0,
}) => {
    const frame = useCurrentFrame();

    const volume = fadeInFrames > 0
        ? interpolate(
            frame,
            [0, fadeInFrames, durationFrames - 15, durationFrames],
            [0, baseVolume, baseVolume, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          )
        : interpolate(
            frame,
            [durationFrames - 15, durationFrames],
            [baseVolume, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

    return (
        <Audio
            src={staticFile(src)}
            volume={volume}
            playbackRate={playbackRate}
            onError={(e) => console.log('Media playback error caught on Audio:', e)}
        />
    );
};

