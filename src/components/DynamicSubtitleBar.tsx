import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export interface WordTiming {
  word: string;
  start_ms: number;
  end_ms: number;
}

export interface DynamicSubtitleBarProps {
  words: WordTiming[];
  sceneStartMs?: number;
  highlightColor?: string;
  fontSize?: number;
}

/**
 * DynamicSubtitleBar — Sleek Natural Spacing Karaoke Captions
 * 1. Normal sentence word spacing (tight, clean, no awkward wide gaps).
 * 2. Read words = BLACK (#000000).
 * 3. Active spoken word = BLACK with Yellow highlighter pill (#FACC15).
 * 4. Coming words = GREY (#94A3B8).
 * 5. 100% Locked baseline: Zero text jitter, zero jumping.
 */
export const DynamicSubtitleBar: React.FC<DynamicSubtitleBarProps> = ({
  words = [],
  sceneStartMs = 0,
  highlightColor = '#FACC15',
  fontSize = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!words || words.length === 0) return null;

  const currentMs = sceneStartMs + (frame / fps) * 1000;

  // Active word index from WhisperX milliseconds
  const activeWordIdx = words.findIndex(
    (w) => currentMs >= w.start_ms && currentMs <= w.end_ms
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '5%',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '6px 18px',
        backgroundColor: '#FFFFFF',
        borderRadius: 9999,
        border: '3px solid #000000',
        boxShadow: '3px 3px 0px #000000',
        zIndex: 80,
        pointerEvents: 'none',
      }}
    >
      {words.map((w, idx) => {
        const isActive = idx === activeWordIdx;
        const isPast = activeWordIdx !== -1 ? idx < activeWordIdx : currentMs > w.end_ms;

        // User Law:
        // - Read words = BLACK (#000000)
        // - Active word = BLACK (#000000) on Yellow
        // - Coming words = GREY (#94A3B8)
        const textColor = isPast || isActive ? '#000000' : '#94A3B8';
        const bgColor = isActive ? highlightColor : 'transparent';

        return (
          <span
            key={`${w.word}-${idx}`}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
              fontWeight: 900,
              fontSize,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              padding: '2px 8px',
              borderRadius: 6,
              transform: 'none',
              color: textColor,
              backgroundColor: bgColor,
              transition: 'background-color 0.15s ease, color 0.15s ease',
              lineHeight: 1.1,
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};
