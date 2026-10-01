import React, { useEffect, useRef, useState } from 'react';
import frameList from '../../data/openingFrames.json';

interface ReposeCanvasProps {
  progress?: number; // 0 to 1
  className?: string;
}

export const ReposeCanvas: React.FC<ReposeCanvasProps> = ({ progress = 0, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastDrawnImgRef = useRef<HTMLImageElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Preload all valid frames
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    frameList.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= Math.min(10, frameList.length) && !isLoaded) {
          setIsLoaded(true);
        }
      };
      images.push(img);
    });

    imagesRef.current = images;

    return () => {
      imagesRef.current = [];
    };
  }, []);

  // Sync canvas with scroll progress using requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const render = () => {
      const images = imagesRef.current;
      if (!images || images.length === 0) return;

      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);

      const targetIndex = Math.min(
        images.length - 1,
        Math.max(0, Math.floor(progress * (images.length - 1)))
      );

      // Locate best available frame: exact match or nearest loaded neighbor
      let img = images[targetIndex];
      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let offset = 1; offset < 20; offset++) {
          const prev = images[targetIndex - offset];
          if (prev && prev.complete && prev.naturalWidth > 0) {
            img = prev;
            break;
          }
          const next = images[targetIndex + offset];
          if (next && next.complete && next.naturalWidth > 0) {
            img = next;
            break;
          }
        }
      }

      // Fallback to last successfully drawn frame or first frame
      if (!img || !img.complete || img.naturalWidth === 0) {
        img = lastDrawnImgRef.current || images[0];
      }

      if (img && img.complete && img.naturalWidth > 0) {
        lastDrawnImgRef.current = img;

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = width / height;

        let renderW = width;
        let renderH = height;
        let offsetX = 0;
        let offsetY = 0;

        if (canvasRatio > imgRatio) {
          renderW = width;
          renderH = width / imgRatio;
          offsetY = (height - renderH) / 2;
        } else {
          renderH = height;
          renderW = height * imgRatio;
          offsetX = (width - renderW) / 2;
        }

        // Draw image frame covering viewport
        ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

        // Elegant, subtle cinematic atmospheric tint (NOT pitch black!)
        // Keeps the aerial video crystal-clear while providing contrast for typography
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        grad.addColorStop(0.2, 'rgba(0, 0, 0, 0.2)');
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
        grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
    };

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(render);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [progress, isLoaded]);

  const firstFrameSrc = frameList[0] || '/assets/opening/sequence-01/frame-0001.webp';

  return (
    <div className={`fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0 ${className}`}>
      {/* Initial load fallback image */}
      {!isLoaded && (
        <img
          src={firstFrameSrc}
          alt="Atmospheric Flight"
          className="w-full h-full object-cover"
        />
      )}
      {/* 60fps Living Canvas scrubbing the flight sequence */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
      />
      {/* Subtle global film grain / luxury contrast veil */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />
    </div>
  );
};

