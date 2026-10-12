import { useEffect, useRef } from 'react';

/** A short burst of paper confetti in the course colours. Skipped when reduced motion is on. */
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = (canvas.width = canvas.offsetWidth * dpr);
    const h = (canvas.height = canvas.offsetHeight * dpr);
    const css = getComputedStyle(canvas);
    const colours = ['--course', '--gold', '--good', '--flame', '--course-light'].map(
      (v) => css.getPropertyValue(v).trim() || '#888',
    );
    const bits = Array.from({ length: 90 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.2,
      y: h * 0.35,
      vx: (Math.random() - 0.5) * 14 * dpr,
      vy: (-Math.random() * 14 - 6) * dpr,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      s: (Math.random() * 6 + 5) * dpr,
      c: colours[Math.floor(Math.random() * colours.length)],
    }));
    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);
      for (const b of bits) {
        b.vy += 0.35 * dpr;
        b.vx *= 0.99;
        b.x += b.vx;
        b.y += b.vy;
        b.r += b.vr;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.fillStyle = b.c;
        ctx.globalAlpha = Math.max(0, 1 - frame / 160);
        ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
        ctx.restore();
      }
      if (frame < 160) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
