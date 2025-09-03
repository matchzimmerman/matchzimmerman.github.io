'use client';

import { useEffect, useRef } from "react";

export default function ConstellationBg(){
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(()=>{
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    function resize(){
      c.width = window.innerWidth * devicePixelRatio;
      c.height = window.innerHeight * devicePixelRatio;
    }
    function rand(n:number){ return Math.random()*n; }

    const stars = Array.from({length: 150}, ()=> ({
      x: rand(window.innerWidth*devicePixelRatio),
      y: rand(window.innerHeight*devicePixelRatio),
      vx: (Math.random() - 0.5) * 0.05 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.05 * devicePixelRatio,
      r: Math.random()*1.6*devicePixelRatio + 0.2
    }));

    function draw(){
      ctx.clearRect(0,0,c.width,c.height);
      for(const s of stars){
        s.x += s.vx; s.y += s.vy;
        if (s.x<0||s.x>c.width) s.vx*=-1;
        if (s.y<0||s.y>c.height) s.vy*=-1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fill();
      }
      for (let i=0;i<stars.length;i++){
        for (let j=i+1;j<stars.length;j++){
          const a=stars[i], b=stars[j];
          const dx=a.x-b.x, dy=a.y-b.y;
          const d=Math.sqrt(dx*dx+dy*dy);
          if (d < 120*devicePixelRatio){
            ctx.strokeStyle = "rgba(238, 109, 11, 0.44)";
            ctx.lineWidth = 1*devicePixelRatio;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener('resize', resize);
    draw();
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  },[]);

  return <canvas ref={ref} className="fixed inset-0 -z-10"></canvas>
}
