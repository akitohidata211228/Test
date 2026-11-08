import React, { useEffect, useRef } from 'react';
import { generateCanvasCursorDataUrl } from './WaterRippleCanvas';

interface DocsViewProps {
  initialEndpointId?: string;
  onGoHome?: () => void;
}

// Logika ripple yang sama persis dengan home (WaterRippleCanvas):
// pointerdown -> lingkaran air melebar (1050ms, radius 65, 5 warna bergilir).
const RIPPLE_INJECTOR = `
(function () {
  if (window.__lirenxinRipple) return;
  window.__lirenxinRipple = true;
  var COLORS = [
    { rgb: '30, 92, 217' },
    { rgb: '255, 42, 85' },
    { rgb: '255, 230, 0' },
    { rgb: '255, 45, 149' },
    { rgb: '16, 185, 129' }
  ];
  var idx = 0;
  var canvas = document.createElement('canvas');
  canvas.id = 'lirenxin-ripple-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999;';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  function resize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  var ripples = [];
  var raf = null;
  function render(now) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    var active = [];
    for (var i = 0; i < ripples.length; i++) {
      var r = ripples[i];
      var p = Math.min(1, (now - r.t) / r.d);
      if (p < 1) {
        active.push(r);
        var e = 1 - Math.pow(1 - p, 2.8);
        var rad = Math.max(1, r.max * e);
        var a = Math.max(0, 1 - p);
        ctx.beginPath();
        ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + r.rgb + ',' + (0.07 * a) + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(' + r.rgb + ',' + (0.8 * a) + ')';
        ctx.lineWidth = Math.max(1.2, 3.2 * (1 - p * 0.5));
        ctx.stroke();
      }
    }
    ripples = active;
    raf = ripples.length ? requestAnimationFrame(render) : null;
  }
  document.addEventListener('pointerdown', function (ev) {
    var c = COLORS[idx++ % COLORS.length];
    ripples.push({ x: ev.clientX, y: ev.clientY, rgb: c.rgb, t: performance.now(), d: 1050, max: 65 });
    if (!raf) raf = requestAnimationFrame(render);
  }, { passive: true });
})();
`;

/**
 * Halaman /docs repo dirender UTUH di bawah navbar situs — satu website.
 * Cursor pointer biru yang sama + animasi gelembung klik (water ripple)
 * disuntikkan ke dokumen iframe (same-origin) setiap kali load.
 */
export const DocsView: React.FC<DocsViewProps> = () => {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
    };
  }, []);

  const injectEffects = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc || !doc.body) return;
    try {
      // 1. Cursor pointer neo-brutalist biru (identik dengan situs utama)
      doc.getElementById('lirenxin-custom-canvas-cursor')?.remove();
      const cursorDataUrl = generateCanvasCursorDataUrl();
      if (cursorDataUrl) {
        const cursorStyle = doc.createElement('style');
        cursorStyle.id = 'lirenxin-custom-canvas-cursor';
        cursorStyle.innerHTML = `
          *, *::before, *::after {
            cursor: url(${cursorDataUrl}) 3 3, auto !important;
          }
          button, a, input, select, textarea, [role="button"], .cursor-pointer {
            cursor: url(${cursorDataUrl}) 3 3, pointer !important;
          }
        `;
        doc.head.appendChild(cursorStyle);
      }

      // 2. Animasi gelembung (water ripple) saat klik di dalam docs
      const rippleScript = doc.createElement('script');
      rippleScript.textContent = RIPPLE_INJECTOR;
      doc.body.appendChild(rippleScript);
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
      onLoad={injectEffects}
    />
  );
};
