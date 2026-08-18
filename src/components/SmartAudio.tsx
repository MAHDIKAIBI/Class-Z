import React from 'react';
import { Audio, useCurrentFrame, interpolate, staticFile } from 'remotion';

interface Props {
    src: string;
    durationFrames: number;
    baseVolume?: number;
    playbackRate?: number;
}

export const SmartAudio: React.FC<Props> = ({ src, durationFrames, baseVolume = 0.35, playbackRate = 1.0 }) => {
    const frame = useCurrentFrame();

    // 1. Hollywood Fade-Out: We NEVER fade in, because we need the hard transient 
    // punch of the sound effect (the 'slap'). We only fade out over the last 15 frames 
    // so it smoothly exits before the scene cuts, avoiding harsh digital clicks.
    const volume = interpolate(
        frame,
        [durationFrames - 15, durationFrames],
        [baseVolume, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // 2. We remove the random startFrom. SFX needs to start exactly at 0s to hit the transient.
    return (
        <Audio 
            src={staticFile(src)} 
            volume={volume} 
            playbackRate={playbackRate}
            onError={(e) => console.log("Media playback error caught on Audio:", e)} 
        />
    );
};
