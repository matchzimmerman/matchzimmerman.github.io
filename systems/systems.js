const menuButton=document.querySelector('.menu-button');
const nav=document.getElementById('site-nav');
if(menuButton&&nav){menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open);});}

const filters=[...document.querySelectorAll('.systems-controls .filter')];
const cards=[...document.querySelectorAll('.system-card')];
filters.forEach(btn=>btn.addEventListener('click',()=>{filters.forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;let visible=0;cards.forEach(card=>{const show=f==='all'||card.dataset.mode===f;card.classList.toggle('hidden',!show);if(show)visible++;});document.getElementById('record-count').textContent=visible;}));

const titleSamples=['SALVATOR MUNDI','INTERCHANGE','THE CARD PLAYERS','NUMBER 17A','SHOT SAGE BLUE MARILYN'];
let titleIndex=0;
setInterval(()=>{const el=document.getElementById('random-title-preview');if(el){titleIndex=(titleIndex+1)%titleSamples.length;el.textContent=titleSamples[titleIndex];}},2200);

function fit(canvas){const r=canvas.getBoundingClientRect();const d=Math.min(window.devicePixelRatio||1,2);const w=Math.max(1,Math.round(r.width*d));const h=Math.max(1,Math.round(r.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}const c=canvas.getContext('2d');c.setTransform(d,0,0,d,0,0);return {c,w:r.width,h:r.height};}
function dot(c,x,y,r=1.5,color='#171714'){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
function animate(){
  const t=performance.now()/1000;
  document.querySelectorAll('.system-visual canvas').forEach(canvas=>{
    const type=canvas.closest('.system-card').dataset.visual;const {c,w,h}=fit(canvas);c.clearRect(0,0,w,h);
    if(type==='linked'){
      c.fillStyle='#ffd1a1';c.fillRect(0,0,w,h);const pts=[[.18,.28],[.34,.66],[.58,.34],[.76,.7],[.83,.23]];const mx=w*(.5+.3*Math.cos(t*.7)),my=h*(.5+.25*Math.sin(t*.95));c.strokeStyle='#111';c.lineWidth=1;pts.forEach(p=>{const x=w*p[0],y=h*p[1];c.beginPath();c.moveTo(x,y);c.lineTo(mx,my);c.stroke();dot(c,x,y,2);});dot(c,mx,my,2);
    }else if(type==='doublegrid'){
      c.fillStyle='#f4f1ea';c.fillRect(0,0,w,h);const gap=Math.max(24,w/13);const ox=w*(.07*Math.cos(t*.65)),oy=h*(.08*Math.sin(t*.8));c.strokeStyle='rgba(23,23,20,.38)';c.lineWidth=.7;for(let x=gap/2;x<w;x+=gap){for(let y=gap/2;y<h;y+=gap){dot(c,x,y,1.5);dot(c,x+ox,y+oy,1.5);c.beginPath();c.moveTo(x,y);c.lineTo(x+ox,y+oy);c.stroke();}}
    }else if(type==='colorfield'){
      const mx=w*(.5+.34*Math.cos(t*.55)),my=h*(.5+.32*Math.sin(t*.7));const r=Math.floor(mx/w*255),g=Math.floor(my/h*255),b=Math.floor((mx/w+my/h)*127);const col='rgb('+r+','+g+','+b+')';c.fillStyle='#ffe5b4';c.fillRect(0,0,w,h);c.strokeStyle=col;c.fillStyle=col;c.lineWidth=.65;const gap=Math.max(28,w/12);for(let x=0;x<=w;x+=gap){for(let y=0;y<=h;y+=gap){dot(c,x,y,1.3,col);c.beginPath();c.moveTo(x,y);c.lineTo(mx,my);c.stroke();}}c.fillStyle='rgba(255,255,255,.88)';c.fillRect(Math.min(mx+8,w-118),Math.max(8,my-34),110,44);c.fillStyle='#111';c.font='8px monospace';c.fillText('RGB '+r+' '+g+' '+b,Math.min(mx+14,w-112),Math.max(21,my-20));c.fillText('X '+Math.round(mx)+'  Y '+Math.round(my),Math.min(mx+14,w-112),Math.max(34,my-7));
    }else if(type==='tiling'){
      c.fillStyle='#f1efe8';c.fillRect(0,0,w,h);const cols=10,rows=6,cw=w/cols,ch=h/rows;for(let yy=0;yy<rows;yy++){for(let xx=0;xx<cols;xx++){const seed=(xx*37+yy*61)%5;c.save();c.translate(xx*cw+cw/2,yy*ch+ch/2);c.rotate(((xx+yy)%4)*Math.PI/2);c.strokeStyle='#171714';c.lineWidth=1.2;if(seed===0)c.strokeRect(-cw*.34,-ch*.34,cw*.68,ch*.68);if(seed===1){c.beginPath();c.moveTo(-cw*.4,0);c.lineTo(cw*.4,0);c.stroke();}if(seed===2){c.beginPath();c.arc(0,0,Math.min(cw,ch)*.32,0,Math.PI*1.5);c.stroke();}if(seed===3){c.beginPath();c.moveTo(-cw*.35,-ch*.35);c.lineTo(cw*.35,ch*.35);c.stroke();}if(seed===4){c.beginPath();c.moveTo(-cw*.35,ch*.28);c.quadraticCurveTo(0,-ch*.42,cw*.35,ch*.28);c.stroke();}c.restore();}}
    }else if(type==='crosses'){
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'hsl('+((t*36)%360)+',78%,56%)');g.addColorStop(1,'hsl('+(((t*52)+150)%360)+',78%,52%)');c.fillStyle=g;c.fillRect(0,0,w,h);c.strokeStyle='#f5f2ea';c.lineWidth=5;const gap=Math.max(55,w/7);for(let x=gap/2;x<w;x+=gap){for(let y=gap/2;y<h;y+=gap){c.save();c.translate(x,y);c.rotate(t*Math.PI/2);c.beginPath();c.moveTo(-12,0);c.lineTo(12,0);c.moveTo(0,-12);c.lineTo(0,12);c.stroke();c.restore();}}
    }else if(type==='version'){
      c.fillStyle='#ffd1a1';c.fillRect(0,0,w,h);const mx=w*(.5+.3*Math.cos(t*.62)),my=h*(.5+.26*Math.sin(t*.77));const gap=Math.max(22,w/18);c.strokeStyle='rgba(0,0,0,.32)';c.lineWidth=.55;for(let x=0;x<w;x+=gap){for(let y=0;y<h;y+=gap){c.beginPath();c.moveTo(x,y);c.lineTo(mx,my);c.stroke();dot(c,x,y,1.3);}}dot(c,mx,my,2);
    }else if(type==='organic'){
      c.fillStyle='#f1efe8';c.fillRect(0,0,w,h);const cols=9,rows=6,cw=w/cols,ch=h/rows;c.strokeStyle='#171714';c.lineWidth=1;for(let yy=0;yy<rows;yy++){for(let xx=0;xx<cols;xx++){const cx=xx*cw,cy=yy*ch;c.beginPath();for(let i=0;i<8;i++){const a=(Math.PI*2*i/8)+((xx*13+yy*7+i*3)%11)*.035;const rr=.22+.12*Math.sin((xx+1)*(yy+2)*(i+1));const px=cx+cw*.5+Math.cos(a)*cw*rr,py=cy+ch*.5+Math.sin(a)*ch*rr;if(i===0)c.moveTo(px,py);else c.lineTo(px,py);}c.closePath();c.stroke();}}
    }
  });
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);