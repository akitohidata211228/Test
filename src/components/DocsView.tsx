import React, { useRef } from 'react';
import { generateCanvasCursorDataUrl } from './WaterRippleCanvas';

interface DocsViewProps {
  initialEndpointId?: string;
  onGoHome?: () => void;
}

/**
 * Halaman /docs repo dirender UTUH di bawah navbar situs — tanpa strip
 * tambahan dan tanpa header ganda di dalam iframe, supaya terasa satu
 * website. Cursor pointer neo-brutalist biru yang sama disuntikkan ke
 * dokumen iframe (same-origin) saat load.
 */
export const DocsView: React.FC<DocsViewProps> = () => {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const injectCursor = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    try {
      doc.getElementById('lirenxin-custom-canvas-cursor')?.remove();
      const cursorDataUrl = generateCanvasCursorDataUrl();
      if (!cursorDataUrl) return;
      const styleEl = doc.createElement('style');
      styleEl.id = 'lirenxin-custom-canvas-cursor';
      styleEl.innerHTML = `
        *, *::before, *::after {
          cursor: url(${cursorDataUrl}) 3 3, auto !important;
        }
        button, a, input, select, textarea, [role="button"], .cursor-pointer {
          cursor: url(${cursorDataUrl}) 3 3, pointer !important;
        }
      `;
      doc.head.appendChild(styleEl);
    } catch {
      /* same-origin guard: abaikan bila akses diblok */
    }
  };

  return (
    <iframe
      ref={frameRef}
      src="/docs"
      title="LiRénXin API Documentation"
      className="w-full block border-0"
      style={{ height: 'calc(100vh - 68px)', minHeight: 560 }}
      onLoad={injectCursor}
    />
  );
};
