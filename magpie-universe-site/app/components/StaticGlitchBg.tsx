'use client';
import { useEffect, useRef } from "react";

/**
 * CRT-ish static + horizontal jitter lines.
 * Paints immediately on first frame; no scroll trigger.
 */
export default function StaticGlitchBg() {
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const raf = useRef<number|undefined>();

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const size = () => {
      c.width  = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
    };
    size();

    // pre-build noise tile
    const TILE = 160;
    const tile = document.createElement("canvas");
    tile.width = TILE; tile.height = TILE;
    const tctx = tile.getContext("2d")!;
    const img = tctx.createImageData(TILE, TILE);
    for (let i=0; i<img.data.length; i+=4) {
      const n = (Math.random()*60)|0; // dark specks
      img.data[i]=n; img.data[i+1]=n; img.data[i+2]=n; img.data[i+3]=40; // alpha
    }
    tctx.putImageData(img,0,0);

    const draw = () => {
      // paper tint base (matches rust theme; kept very light)
      ctx.fillStyle = "rgba(253, 228, 204, 0.9)"; // rust-100
      ctx.fillRect(0,0,c.width,c.height);

      // subtle vignette
      const g = ctx.createRadialGradient(c.width*0.5,c.height*0.45,0, c.width*0.5,c.height*0.45, Math.max(c.width,c.height)*0.75);
      g.addColorStop(0,"rgba(139,75,32,0.0)");    // rust-700
      g.addColorStop(1,"rgba(55,30,14,0.18)");    // rust-900
      ctx.fillStyle = g;
      ctx.fillRect(0,0,c.width,c.height);

      // tile noise
      for(let y=0;y<c.height;y+=TILE){
        for(let x=0;x<c.width;x+=TILE){
          ctx.drawImage(tile,x,y);
        }
      }

      // horizontal glitch bands
      ctx.save();
      const bands = 8;
      for(let i=0;i<bands;i++){
        const y = Math.random()*c.height;
        const h = 3*dpr + Math.random()*3*dpr;
        const shift = (Math.random()*6 - 3) * dpr;
        ctx.globalAlpha = 0.08 + Math.random()*0.06;
        ctx.drawImage(c, 0, y, c.width, h, shift, y, c.width, h);
      }
      ctx.restore();

      // faint scanlines
      ctx.fillStyle = "rgba(55,30,14,0.06)";
      for(let y=0; y<c.height; y+=3*dpr){
        ctx.fillRect(0,y,c.width,1*dpr);
      }

      raf.current = requestAnimationFrame(draw);
    };

    // immediate paint (double RAF avoids Safari first-paint laziness)
    requestAnimationFrame(()=>requestAnimationFrame(draw));
    const onResize = () => { size(); };
    window.addEventListener("resize", onResize);
    return () => { if(raf.current) cancelAnimationFrame(raf.current); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 [transform:translateZ(0)]"
      aria-hidden="true"
    />
  );
}
