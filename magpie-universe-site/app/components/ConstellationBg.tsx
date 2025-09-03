'use client';

import { useLayoutEffect, useRef } from "react";

export default function ConstellationBg(){
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;

    function sizeCanvas() {
      const r = c.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      c.width = Math.max(1, Math.floor(r.width * dpr));
      c.height = Math.max(1, Math.floor(r.height * dpr));
      return dpr;
    }

    // 1) Ensure sized before creating stars
    const dpr = sizeCanvas();

    // 2) Create stars after sizing so we use canvas width/height
    const STAR_COUNT = 160;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.06 * dpr,
      vy: (Math.random() - 0.5) * 0.06 * dpr,
      r: Math.random() * (1.6 * dpr) + 0.3 * dpr,
    }));

    function draw() {
      ctx.clearRect(0, 0, c.width, c.height);

      // glow points
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0 || s.x > c.width) s.vx *= -1;
        if (s.y < 0 || s.y > c.height) s.vy *= -1;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(55,30,14,0.55)";      // matches rust-900 theme
        ctx.fill();
      }

      // links
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i], b = stars[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 120 * dpr) {
            ctx.strokeStyle = "rgba(55,30,14,0.10)";
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    // 3) Handle resize
    function onResize() {
      const dpr2 = sizeCanvas();
      // keep stars but clamp to bounds
      for (const s of stars) {
        s.x = Math.max(0, Math.min(c.width, s.x));
        s.y = Math.max(0, Math.min(c.height, s.y));
        s.vx = (Math.random() - 0.5) * 0.06 * dpr2;
        s.vy = (Math.random() - 0.5) * 0.06 * dpr2;
        s.r  = Math.max(0.3 * dpr2, Math.min(2.2 * dpr2, s.r));
      }
    }

    window.addEventListener("resize", onResize);

    // 4) Double RAF to force immediate paint on Safari/Chrome with fixed canvases
    requestAnimationFrame(() => requestAnimationFrame(draw));

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-10 [transform:translateZ(0)]"
      aria-hidden="true"
    />
  );
}
