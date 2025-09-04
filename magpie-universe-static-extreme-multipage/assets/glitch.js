// Multi-layer glitch background with adjustable intensity and subtle autotracking
(function(){
  const dpr = Math.max(1, devicePixelRatio || 1);
  const base = document.getElementById('bg-base');
  const fg = document.getElementById('bg-fg');
  const bctx = base.getContext('2d');
  const fctx = fg.getContext('2d');
  const intensity = +document.body.dataset.glitchIntensity || 1; // 0.5 subtle, 1 normal, 2 extreme
  let W=0,H=0;

  function size(){
    W = base.width = Math.floor(innerWidth * dpr);
    H = base.height = Math.floor(innerHeight * dpr);
    fg.width = W; fg.height = H;
  }
  addEventListener('resize', size); size();

  // prebuilt noise tile
  const TILE = 120;
  const tile = document.createElement('canvas');
  tile.width=TILE; tile.height=TILE;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(TILE,TILE);
  for(let i=0;i<img.data.length;i+=4){
    const n = (Math.random()* (50 + 40*intensity))|0;
    img.data[i]=n; img.data[i+1]=n; img.data[i+2]=n; img.data[i+3]= 30 + (intensity*10)|0;
  }
  tctx.putImageData(img,0,0);

  let barY = 0; const barSpeed = dpr*(0.3 + 0.3*intensity);

  function draw(t){
    // base: dark paper + noise
    bctx.fillStyle = "rgba(0,0,0,1)"; bctx.fillRect(0,0,W,H);
    // very dark tint with faint vignette
    const g = bctx.createRadialGradient(W*0.5,H*0.45,0, W*0.5,H*0.45, Math.max(W,H)*0.9);
    g.addColorStop(0,"rgba(0,0,0,0)");
    g.addColorStop(1,"rgba(0,0,0,0.55)");
    bctx.fillStyle=g; bctx.fillRect(0,0,W,H);

    for(let y=0;y<H;y+=TILE){ for(let x=0;x<W;x+=TILE){ bctx.drawImage(tile,x,y); } }

    // scanlines
    bctx.fillStyle = "rgba(0,255,0,0.05)";
    for(let y=0;y<H;y+=3*dpr){ bctx.fillRect(0,y,W,1*dpr); }

    // rolling bar
    barY += barSpeed + Math.sin(t*0.0015)*(0.4*intensity)*dpr;
    if(barY > H+20*dpr) barY = -30*dpr;
    const bh = (3+2*intensity)*dpr;
    const grad = bctx.createLinearGradient(0,barY,0,barY+bh);
    grad.addColorStop(0,"rgba(0,255,120,0.06)");
    grad.addColorStop(0.5,"rgba(0,255,0,0.25)");
    grad.addColorStop(1,"rgba(0,0,0,0.06)");
    bctx.fillStyle = grad; bctx.fillRect(0,barY,W,bh);

    // foreground: copy with glitches
    fctx.clearRect(0,0,W,H);
    fctx.globalCompositeOperation = "source-over";
    fctx.drawImage(base,0,0);

    // horizontal slice shifts
    const slices = Math.floor(2 + 4*intensity);
    fctx.save();
    for(let i=0;i<slices;i++){
      const sy = (Math.random()*H)|0;
      const sh = (2*dpr + Math.random()* (6+6*intensity)*dpr)|0;
      const shift = ((Math.random()* (8+10*intensity) - (4+5*intensity)) * dpr)|0;
      fctx.globalAlpha = 0.08 + Math.random()* (0.1*intensity);
      fctx.drawImage(base, 0, sy, W, sh, shift, sy, W, sh);
    }
    fctx.restore();

    // occasional vertical tear
    if (Math.random() < 0.02*intensity){
      const tx = (Math.random()*W)|0;
      const tw = (2*dpr + Math.random()*(6+6*intensity)*dpr)|0;
      const tshift = ((Math.random()*(10+8*intensity) - (5+4*intensity)) * dpr)|0;
      fctx.globalAlpha = 0.12 + Math.random()*0.15;
      fctx.drawImage(base, tx, 0, tw, H, tx+tshift, 0, tw, H);
      fctx.globalAlpha = 1;
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  // HUD reticle autotracking (subtle)
  const ret = document.querySelector('.reticle');
  let rx = 50, ry = 50; // percents
  let tx = 50, ty = 50;
  function follow(){
    // ease toward target
    rx += (tx - rx) * 0.04;
    ry += (ty - ry) * 0.04;
    if(ret){
      ret.style.setProperty('--rx', rx + '%');
      ret.style.setProperty('--ry', ry + '%');
    }
    requestAnimationFrame(follow);
  }
  follow();
  addEventListener('mousemove', (e)=>{
    const px = e.clientX / innerWidth * 100;
    const py = e.clientY / innerHeight * 100;
    tx = px; ty = py;
  });
})(); 
