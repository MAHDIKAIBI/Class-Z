import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type WordTiming = {
  word: string;
  start: number; // frames relative to chunk/Sequence start
  end: number;
  isHighlight?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE-AWARE ACCENT PALETTE — offset by 5 vs Left so they don't sync
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT_PALETTE = [
  "#FF8C42", // amber
  "#C77DFF", // soft violet
  "#00D4FF", // electric cyan
  "#FF3D71", // hot pink
  "#FFD93D", // warm gold
  "#6BFFA8", // neon lime
  "#FF6B6B", // coral red
  "#FFA07A", // salmon
  "#B5EAD7", // mint
  "#FFE66D", // lemon yellow
];

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION WORDS — deprioritised for stress detection
// ─────────────────────────────────────────────────────────────────────────────
const FUNCTION_WORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being",
  "to","of","and","in","for","on","with","as","at","by","from",
  "or","but","not","it","he","she","they","we","you","i",
  "my","your","his","her","its","our","their","that","this","which",
  "have","has","had","do","does","did","will","would","could","should",
  "may","might","can","up","out","so","if","about","than","then","just",
]);

// ─────────────────────────────────────────────────────────────────────────────
// STRESS DETECTION
// ─────────────────────────────────────────────────────────────────────────────
function findStressedWordIndex(words: WordTiming[]): number {
  if (words.length === 0) return -1;
  if (words.length === 1) return 0;

  let bestIdx = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const clean = w.word.toLowerCase().replace(/[^a-z]/g, "");
    if (FUNCTION_WORDS.has(clean) && words.length > 2) continue;

    const duration = w.end - w.start;
    const charLen  = clean.length;
    const score    = duration * 0.6 + charLen * 4;

    if (score > bestScore) {
      bestScore = score;
      bestIdx   = i;
    }
  }

  return bestIdx >= 0 ? bestIdx : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE FONT SIZE — long words shrink to stay on one line
// ─────────────────────────────────────────────────────────────────────────────
function wordFontSize(word: string): number {
  const len = word.replace(/[^a-zA-Z]/g, "").length;
  if (len > 13) return 54;
  if (len > 10) return 66;
  if (len > 7)  return 78;
  return 90;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — RIGHT ANCHORED
// ─────────────────────────────────────────────────────────────────────────────
const MAX_ROWS = 4;

interface Props {
  script: WordTiming[];
  chunkIndex?: number;
}

export const PremiumRightSpatial: React.FC<Props> = ({ script, chunkIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!script?.length) return null;

  const accentColor = ACCENT_PALETTE[chunkIndex % ACCENT_PALETTE.length];
  const stressedIdx = findStressedWordIndex(script);

  // ── Sliding window: show the last MAX_ROWS triggered words ────────────────
  let latestTriggeredIdx = -1;
  for (let i = 0; i < script.length; i++) {
    if (frame >= script[i].start) latestTriggeredIdx = i;
  }

  if (latestTriggeredIdx < 0) return null;

  const windowEnd   = latestTriggeredIdx;
  const windowStart = Math.max(0, windowEnd - MAX_ROWS + 1);

  return (
    <div
      style={{
        position: "absolute",
        right: "6%",
        top: "50%",
        transform: "translateY(-50%)",
        width: "40%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",   // right-aligned text stack
        gap: "6px",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      {script.map((item, index) => {
        const hasTriggered = frame >= item.start;
        const inWindow     = index >= windowStart && index <= windowEnd;

        if (!hasTriggered || !inWindow) return null;

        const elapsed = Math.max(0, frame - item.start);

        const revealSpring = spring({
          frame: elapsed,
          fps,
          config: { damping: 22, stiffness: 280, mass: 1.0 },
        });

        const opacity = interpolate(revealSpring, [0, 0.35], [0, 1], {
          extrapolateRight: "clamp",
        });
        // Right-side: slide in from the right (positive x = off-screen right)
        const xShift = interpolate(revealSpring, [0, 1], [22, 0]);

        const isStressed = index === stressedIdx;
        const fontSize   = wordFontSize(item.word);

        return (
          <span
            key={index}
            style={{
              display: "block",
              color: isStressed ? accentColor : "#FFFFFF",
              fontSize: `${fontSize}px`,
              fontFamily: '"Inter", "Geist", system-ui, sans-serif',
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "-2.5px",
              whiteSpace: "nowrap",
              textAlign: "right",
              opacity,
              transform: `translateX(${xShift}px)`,
              // Hard drop shadow — pure contrast, zero glow
              textShadow:
                "-2px 3px 0px rgba(0,0,0,1), -5px 7px 18px rgba(0,0,0,0.85)",
            }}
          >
            {item.word}
          </span>
        );
      })}
    </div>
  );
};