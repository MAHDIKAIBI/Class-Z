import React from 'react';
import { 
  AbsoluteFill, 
  Img, 
  OffthreadVideo, 
  staticFile as remotionStaticFile 
} from 'remotion';

import { DynamicSubtitleBar } from './DynamicSubtitleBar';
import { PaperTextureWrapper } from './PaperTextureWrapper';

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const resolveMedia = (path: string) => {
  if (!path || typeof path !== 'string') return TRANSPARENT_PIXEL;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.replace(/^\/?public\//, '');
  if (cleanPath.trim() === '' || cleanPath.endsWith('/')) return TRANSPARENT_PIXEL;
  return remotionStaticFile(cleanPath);
};

export interface StickmanStageProps {
  scene: any;
  durationInFrames: number;
  index?: number;
}

/**
 * StickmanStage — 100% Locked & Static 2K Hand-Drawn Cinematic Stage
 * - Zero zoom, zero drift (Rock-solid camera locked to the drawing)
 * - 2K Pristine Rendering with OffthreadVideo compliance
 * - Pure clean visual: Zero badges, zero floating stickers
 * - Retention-focused karaoke subtitles at bottom
 * - Subtle tactile paper texture
 */
export const StickmanStage: React.FC<StickmanStageProps> = ({ scene, durationInFrames, index = 0 }) => {
  // 1. Resolve media source
  const rawSrc = scene.image_url || scene.media_paths?.[0] || scene.visual_asset || '';
  const mediaSrc = resolveMedia(rawSrc);
  const isVideo = typeof rawSrc === 'string' && (rawSrc.endsWith('.mp4') || rawSrc.endsWith('.webm') || rawSrc.endsWith('.mov'));

  return (
    <PaperTextureWrapper>
      <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
        {/* 2K Main Stage Viewport — 100% Locked & Centered */}
        <AbsoluteFill
          style={{
            transform: 'scale(1.0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isVideo ? (
            <OffthreadVideo
              src={mediaSrc}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              muted
            />
          ) : (
            <Img
              src={mediaSrc}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </AbsoluteFill>

        {/* Retention-Optimized Subtitles (if word timestamps are passed) */}
        {scene.words && scene.words.length > 0 && (
          <DynamicSubtitleBar
            words={scene.words}
            sceneStartMs={scene.timing?.start_ms || 0}
            highlightColor="#F59E0B"
          />
        )}
      </AbsoluteFill>
    </PaperTextureWrapper>
  );
};
