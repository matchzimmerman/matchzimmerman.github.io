(() => {
  const canvas = document.querySelector('#field');
  const clock = document.querySelector('#clock');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  let w = 0, h = 0, dpr = 1, points = [];

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.floor(innerWidth * dpr);
    h = Math.floor(innerHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    points = Array.from({ length: Math.max(28, Math.floor(innerWidth / 28)) }, (_, i) => ({
      x: (i / Math.max(1, Math.floor(innerWidth / 28) - 1)) * w,
      phase: Math.random() * Math.PI * 2,
      speed: .00016 + Math.random() * .00018,
      amp: (.06 + Math.random() * .18) * h,
      bias: (.32 + Math.random() * .36) * h
    }));
  }

  function draw(t) {
    ctx.fillStyle = '#050706';
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = Math.max(1, dpr);

    for (let layer = 0; layer < 8; layer++) {
      ctx.beginPath();
      points.forEach((p, i) => {
        const local = Math.sin(p.phase + t * p.speed + layer * .43);
        const neighbor = Math.sin((i * .31) + t * .0001 + layer * .26);
        const y = p.bias + local * p.amp * .38 + neighbor * h * .025 + layer * h * .014;
        if (i === 0) ctx.moveTo(p.x, y); else ctx.lineTo(p.x, y);
      });
      ctx.strokeStyle = layer === 3 ? 'rgba(255,104,28,.54)' : `rgba(111,225,187,${.08 + layer * .018})`;
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  }

  function updateClock() {
    if (!clock) return;
    const d = new Date();
    clock.textContent = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} / ${d.toLocaleTimeString('en-US', {hour12:false})}`;
  }

  addEventListener('resize', resize);
  resize();
  updateClock();
  setInterval(updateClock, 1000);
  requestAnimationFrame(draw);
})();
