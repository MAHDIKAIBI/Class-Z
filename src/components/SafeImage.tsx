import React, { useState, useEffect, useRef } from 'react';
import { delayRender, continueRender } from 'remotion';

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  [key: string]: any;
}

/**
 * SafeImage: Universal resilient image component for Remotion.
 * Bypasses Chromium's fragile HTMLImageElement.prototype.decode() API,
 * which rejects with EncodingError on large 16MP+ or progressive JPEGs on headless Linux.
 * Uses native streaming rasterization with delayRender synchronization and instant fallback.
 */
export const SafeImage: React.FC<SafeImageProps> = ({ src, style, onError, onLoad, ...props }) => {
  const isDataOrEmpty = !src || src.startsWith('data:') || src.trim() === '';
  const [handle] = useState<number | null>(() => {
    if (isDataOrEmpty) return null;
    return delayRender(`SafeImage: ${src}`, { timeoutInMilliseconds: 4000 });
  });
  const [currentSrc, setCurrentSrc] = useState(src || TRANSPARENT_PIXEL);
  const unblocked = useRef(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const unblock = () => {
    if (handle !== null && !unblocked.current) {
      unblocked.current = true;
      continueRender(handle);
    }
  };

  useEffect(() => {
    if (handle === null) return;

    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      unblock();
      return;
    }

    // Safety fallback: unblock fast (1200ms) so frames never lag or freeze
    const timer = setTimeout(() => {
      unblock();
    }, 1200);

    return () => {
      clearTimeout(timer);
      unblock();
    };
  }, [currentSrc, handle]);

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      style={style}
      loading="eager"
      decoding="async"
      onLoad={(e) => {
        unblock();
        if (onLoad) onLoad(e);
      }}
      onError={(e) => {
        console.warn(`[SafeImage] Warning: Failed to load image: ${src}. Falling back to transparent pixel.`);
        setCurrentSrc(TRANSPARENT_PIXEL);
        unblock();
        if (onError) onError(e);
      }}
      {...props}
    />
  );
};

export const Img = SafeImage;
export default SafeImage;
