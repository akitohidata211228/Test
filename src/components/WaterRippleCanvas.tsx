import React, { useEffect, useRef } from 'react';

// Colors strictly matching user request:
// "beda beda warna biru merah kuning pink hijau"
const RIPPLE_COLORS = [
  { name: 'biru', hex: '#1E5CD9', rgb: '30, 92, 217' },
  { name: 'merah', hex: '#FF2A55', rgb: '255, 42, 85' },
  { name: 'kuning', hex: '#FFE600', rgb: '255, 230, 0' },
  { name: 'pink', hex: '#FF2D95', rgb: '255, 45, 149' },
  { name: 'hijau', hex: '#10B981', rgb: '16, 185, 129' },
];

interface Ripple {
  x: number;
  y: number;
  color: typeof RIPPLE_COLORS[0];
  startTime: number;
  duration: number;
  maxRadius: number;
}

/**
 * Procedurally draws the custom neo-brutalist cartoon pointer arrow
 * strictly via HTML5 Canvas (No static images used, exactly as instructed).
 * Symmetrically divided dual-tone blue with bold rounded black outline.
 */
function generateCanvasCursorDataUrl(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 44;
  canvas.height = 44;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const scale = 1.05;
  const ox = 3;
  const oy = 3;

  // Precise vertices matching user's custom pointer image (image_e27cb5c9.png)
  // Symmetrical along diagonal x = y axis
  const rawPoints: [number, number][] = [
    [3.5, 3.5],   // Tip
    [13.5, 33.5], // Left wing bottom
    [18.5, 26],   // Inner left crotch
    [25.5, 33],   // Stem bottom-left
    [33, 25.5],   // Stem bottom-right
    [26, 18.5],   // Inner right crotch
    [33.5, 13.5], // Right wing tip
  ];

  const pts = rawPoints.map(([x, y]) => [ox + x * scale, oy + y * scale]);

  // 1. Draw base filled shape (Vibrant Sky Blue - lower-right half)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = '#2DA6F7';
  ctx.fill();

  // 2. Clip to arrow shape and draw the lighter cyan highlight on top-left half
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 44);
  ctx.lineTo(pts[3][0], pts[3][1]); // Stem bottom-left
  ctx.lineTo(pts[4][0], pts[4][1]); // Stem bottom-right
  ctx.lineTo(pts[0][0], pts[0][1]); // Tip
  ctx.closePath();
  ctx.fillStyle = '#7FE0FF';
  ctx.fill();
  ctx.restore();

  // 3. Draw heavy cartoon black border with rounded corners
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3.8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL('image/png');
}

export const WaterRippleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const colorIndexRef = useRef<number>(0);

  // 1. Inject Canvas-generated Cursor into DOM without any external image
  useEffect(() => {
    const cursorDataUrl = generateCanvasCursorDataUrl();
    if (!cursorDataUrl) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'lirenxin-custom-canvas-cursor';
    styleEl.innerHTML = `
      *, *::before, *::after {
        cursor: url(${cursorDataUrl}) 3 3, auto !important;
      }
      button, a, input, select, textarea, [role="button"], .cursor-pointer {
        cursor: url(${cursorDataUrl}) 3 3, pointer !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      const existing = document.getElementById('lirenxin-custom-canvas-cursor');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  // 2. Setup Fullscreen Water Ripple Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Animation Loop for Single Water Ripple Wave
    const render = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const activeRipples: Ripple[] = [];

      for (let i = 0; i < ripplesRef.current.length; i++) {
        const r = ripplesRef.current[i];
        const elapsed = now - r.startTime;
        const progress = Math.min(1, elapsed / r.duration);

        if (progress < 1) {
          activeRipples.push(r);

          // Slow, smooth water ripple expansion easing
          const easeOut = 1 - Math.pow(1 - progress, 2.8);
          const currentRadius = Math.max(1, r.maxRadius * easeOut);
          const alpha = Math.max(0, 1 - progress);

          // EXACTLY ONE single circle expanding smoothly from small to large
          ctx.save();
          ctx.beginPath();
          ctx.arc(r.x, r.y, currentRadius, 0, Math.PI * 2);

          // Gentle translucent inner water pool tint
          ctx.fillStyle = `rgba(${r.color.rgb}, ${0.07 * alpha})`;
          ctx.fill();

          // Single distinct water ripple circle stroke
          ctx.strokeStyle = `rgba(${r.color.rgb}, ${0.8 * alpha})`;
          ctx.lineWidth = Math.max(1.2, 3.2 * (1 - progress * 0.5));
          ctx.stroke();
          ctx.restore();
        }
      }

      ripplesRef.current = activeRipples;

      if (activeRipples.length > 0) {
        animFrameIdRef.current = requestAnimationFrame(render);
      } else {
        animFrameIdRef.current = null;
      }
    };

    // Global Click/Pointerdown handler
    const handleClick = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }

      // Pick next color in sequence (biru, merah, kuning, pink, hijau)
      const color = RIPPLE_COLORS[colorIndexRef.current % RIPPLE_COLORS.length];
      colorIndexRef.current += 1;

      // Create new ripple: single circle, slow and smooth water expansion
      const newRipple: Ripple = {
        x: clientX,
        y: clientY,
        color,
        startTime: performance.now(),
        duration: 1050, // 1050ms for slow and graceful liquid wave propagation
        maxRadius: 65,  // Single water droplet circle radius
      };

      ripplesRef.current.push(newRipple);

      if (!animFrameIdRef.current) {
        animFrameIdRef.current = requestAnimationFrame(render);
      }
    };

    window.addEventListener('pointerdown', handleClick, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handleClick);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[99999] select-none"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
};
