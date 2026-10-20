/* THE LAST FLIGHT — isolated browser source, no external dependencies.
 * All numerical outputs here are SYNTHETIC; see research.html / README.
 */
(() => {
  'use strict';
  const M=window.MZLastFlight, p=new URLSearchParams(location.search), $=id=>document.getElementById(id);
  const obs=p.get('obs')==='1'; if(obs)document.body.classList.add('obs');
  const STORAGE='mztv-earhart-v01-run';
  const defaults=M.DEFAULTS, config=Object.assign({},defaults);
  let saved=null;try{saved=JSON.parse(localStorage.getItem(STORAGE)||'null')}catch(_e){}
  const explicitDate=Date.parse(p.get('start')||'');
  const sourceSeed=Number(p.get('seed'));
  let run={seed:p.has('seed')&&Number.isFinite(sourceSeed)?(sourceSeed|0):saved?.seed??19370702,
    start:Number.isFinite(explicitDate)?explicitDate:saved?.start??Date.now(),
    offset:p.has('start')?0:saved?.offset??0};
  // An OBS / shared URL always plays at x1. A clock session is LOCAL by default.
  if(p.get('fresh')==='1'){run={seed:19370702,start:Date.now(),offset:0};}
  const base=M.ensemble(run.seed,192,defaults);
  let branch=null,scene='field',audioState=null,elapsed=0,epoch=-1,lastEpoch=-1,viewSize={w:0,h:0,dpr:1},lastStats=null;
  function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(run))}catch(_e){}}
  if(!p.has('start'))persist();
  $('run-number').textContent=`SEED / ${run.seed}`;
  $('time-source').textContent=p.has('start')?'CLOCK / SHARED UTC ANCHOR':'CLOCK / LOCAL SESSION';
  function sessionHours(){return Math.max(0,((Date.now()-run.start)/3600000)+run.offset);}
  function fmt(n){return String(n).padStart(2,'0')}
  function hms(hours){const seconds=Math.max(0,Math.floor(hours*3600));return `${fmt(Math.floor(seconds/3600))}:${fmt(Math.floor(seconds%3600/60))}:${fmt(seconds%60)}`;}
  function flash(msg){const e=$('toast');e.textContent=msg;e.style.display='block';clearTimeout(flash.timer);flash.timer=setTimeout(()=>{e.style.display='none'},3500)}
  const controls=['airspeed','fuelStart','burn','wind','nav'];
  function refreshControl(){for(const name of controls){const val=Number($(name).value);config[name]=val;
    let unit=name==='airspeed'?' KT':name==='fuelStart'?' GAL':name==='burn'?' GAL/H':name==='wind'?' KT':'°';
    $(name+'-out').textContent=(name==='wind'&&val>0?'+':'')+(name==='nav'?val.toFixed(1):val)+unit;
  }}
  controls.forEach(name=>$(name).addEventListener('input',()=>{refreshControl();$('branch-status').textContent='Inputs edited. RUN COUNTERFACTUAL to calculate this separate experiment.';}));
  refreshControl();
  $('reset-params').addEventListener('click',()=>{for(const name of controls)$(name).value=defaults[name];refreshControl();branch=null;$('branch-status').textContent='Model restored. Broadcast baseline unchanged.';});
  $('run-branch').addEventListener('click',()=>{refreshControl();branch=M.ensemble((run.seed^0x5EED)>>>0,192,config);let st=M.stats(branch);$('branch-status').textContent=`Counterfactual loaded · 192 synthetic trials · ${st.nearHowland} pass within 25 km of Howland; ${st.nearNiku} endpoints within 50 km of Nikumaroro. NOT posterior probabilities.`;flash('COUNTERFACTUAL GENERATED / BASELINE UNCHANGED');});
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{scene=b.dataset.scene;document.querySelectorAll('.tab').forEach(t=>{t.classList.toggle('active',t===b);t.setAttribute('aria-pressed',t===b?'true':'false')});$('map-view').textContent='VIEW / '+scene.toUpperCase();}));
  function download(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2500)}
  function csvQuote(v){return '"'+String(v).replace(/"/g,'""')+'"'}
  $('export').addEventListener('click',()=>{const shown=base.slice(0,Math.min(192,(Math.min(23,Math.floor(sessionHours()/2))+1)*8));
    const rows=[['type','model_version','session_seed','trial_seed','airspeed_kt_assumed','fuel_departure_gal_assumed','burn_gph_assumed','wind_north_kt_assumed','nav_sigma_deg_assumed','flight_end_hr','end_lat','end_lon_east_unwrapped','min_dist_howland_km','end_dist_nikumaroro_km','near_howland_25km','end_near_niku_50km','evidence_status'].join(',')];
    for(const t of shown){rows.push(['SYNTHETIC',M.MODEL_VERSION,run.seed,t.seed,t.config.airspeed,t.config.fuelStart,t.config.burn,t.config.wind,t.config.nav,t.end.t.toFixed(3),t.end.lat.toFixed(6),t.end.lon.toFixed(6),t.minHowlandKm.toFixed(3),t.nikuKm.toFixed(3),t.nearHowland,t.nearNiku,'NOT_VALIDATED_NOT_HISTORICAL_EVIDENCE'].map(csvQuote).join(','))}
    if(branch)for(const t of branch){rows.push(['COUNTERFACTUAL',M.MODEL_VERSION,run.seed,t.seed,t.config.airspeed,t.config.fuelStart,t.config.burn,t.config.wind,t.config.nav,t.end.t.toFixed(3),t.end.lat.toFixed(6),t.end.lon.toFixed(6),t.minHowlandKm.toFixed(3),t.nikuKm.toFixed(3),t.nearHowland,t.nearNiku,'NOT_VALIDATED_NOT_HISTORICAL_EVIDENCE'].map(csvQuote).join(','))}
    download(`MZTV-last-flight-${run.seed}-synthetic.csv`,rows.join('\r\n')+'\r\n','text/csv');flash('SYNTHETIC TRIAL CSV EXPORTED');});
  $('advance').addEventListener('click',()=>{run.offset+=2;persist();flash('+2 HOURS / LOCAL SIMULATION PREVIEW')});
  $('restart').addEventListener('click',()=>{run={seed:(run.seed+1)|0,start:Date.now(),offset:0};persist();location.href=location.pathname+'?seed='+run.seed+'&fresh=0&start='+encodeURIComponent(new Date(run.start).toISOString())});
  $('share').addEventListener('click',async()=>{const effective=new Date(Date.now()-sessionHours()*3600000).toISOString();const u=new URL(location.href);u.search='';u.searchParams.set('seed',run.seed);u.searchParams.set('start',effective);let ok=false;try{await navigator.clipboard.writeText(u.href);ok=true}catch(e){window.prompt('Copy reproducible run URL',u.href)}flash(ok?'RUN URL COPIED / SAME SEED + SHARED TIME':'RUN URL GENERATED');});

  function menuOpen(open){$('switchboard').classList.toggle('hidden',!open);if(open)$('switchboard').focus()}
  $('menu-toggle').addEventListener('click',()=>menuOpen($('switchboard').classList.contains('hidden')));
  $('close-menu').addEventListener('click',()=>menuOpen(false));
  function switchKey(k){if(k==='0'){menuOpen(false);return;}if(k==='1')$('wind').value=Math.min(25,Number($('wind').value)+10);
    else if(k==='2')$('nav').value=Math.min(10,Number($('nav').value)+2);
    else if(k==='3')$('fuelStart').value=Math.max(750,Number($('fuelStart').value)-100);
    else if(k==='4'){flash(`SYNTHETIC TELEMETRY / ${$('airtime').textContent} ELAPSED · ${$('fuel').textContent} GAL`);return;}
    else return;refreshControl();$('run-branch').click();flash(`SWITCHBOARD ${k} / LOCAL COUNTERFACTUAL`);}
  document.querySelectorAll('[data-key]').forEach(b=>b.addEventListener('click',()=>switchKey(b.dataset.key)));
  document.addEventListener('keydown',e=>{if(e.key==='*'){menuOpen($('switchboard').classList.contains('hidden'));e.preventDefault()}
    else if(e.key==='Escape')menuOpen(false);else if(!$('switchboard').classList.contains('hidden')&&/^[01234]$/.test(e.key))switchKey(e.key)});

  function audioStart(){try{const ctx=new(window.AudioContext||window.webkitAudioContext)(),volume=ctx.createGain();volume.gain.value=.11;volume.connect(ctx.destination);
    const osc1=ctx.createOscillator(),osc2=ctx.createOscillator(),g1=ctx.createGain(),g2=ctx.createGain();osc1.type='sawtooth';osc2.type='triangle';osc1.frequency.value=64;osc2.frequency.value=96;g1.gain.value=.22;g2.gain.value=.12;osc1.connect(g1).connect(volume);osc2.connect(g2).connect(volume);osc1.start();osc2.start();
    // Deterministic browser-owned static-like noise; this does not reproduce actual transmissions.
    const length=ctx.sampleRate*2,data=ctx.createBuffer(1,length,ctx.sampleRate),channel=data.getChannelData(0);let rng=M.seedRng(run.seed);for(let i=0;i<length;i++)channel[i]=(rng()*2-1)*.2;const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),ng=ctx.createGain();noise.buffer=data;noise.loop=true;filter.type='bandpass';filter.frequency.value=1400;filter.Q.value=.35;ng.gain.value=.03;noise.connect(filter).connect(ng).connect(volume);noise.start();audioState={ctx,volume,osc1,osc2,noise};$('audio').textContent='■ STOP AUDIO';flash('GENERATED ENGINE + RADIO TEXTURE / NOT ARCHIVAL AUDIO');
  }catch(e){flash('AUDIO UNAVAILABLE IN THIS BROWSER')}}
  $('audio').addEventListener('click',()=>{if(audioState){audioState.ctx.close();audioState=null;$('audio').textContent='♪ ENABLE AUDIO';}else audioStart()});
  // OBS Browser Sources may permit autoplay. Ordinary browsers may block it until a click.
  if(obs&&p.get('audio')==='1')setTimeout(()=>{if(!audioState)audioStart();audioState?.ctx.resume().catch(()=>{});},650);
  let lastVoiceEpoch=-1;
  function occasionalPrompt(hours){
    if(!audioState||hours<2/3||!('speechSynthesis' in window))return;
    const slot=Math.floor(hours/(2/3));
    if(slot===lastVoiceEpoch)return;
    lastVoiceEpoch=slot;
    try{const msg=new SpeechSynthesisUtterance('press star for a list of interaction options.');msg.rate=.88;msg.volume=.55;window.speechSynthesis.speak(msg)}catch(_e){}
  }

  const canvas=$('field'),ctx=canvas.getContext('2d',{alpha:false});
  function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);if(rect.width===0||rect.height===0)return;const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}viewSize={w:rect.width,h:rect.height,dpr};ctx.setTransform(dpr,0,0,dpr,0,0)}
  function scale(p){const {w,h}=viewSize;return {x:((p.lon-142.5)/(193.5-142.5))*w,y:((10.8-p.lat)/(10.8+16.2))*h}}
  function strokePoints(points,color,width=1,alpha=1,tMax=Infinity){ctx.save();ctx.beginPath();let first=true;for(const p of points){if(p.t>tMax)break;const s=scale(p);if(first){ctx.moveTo(s.x,s.y);first=false}else ctx.lineTo(s.x,s.y)}ctx.lineWidth=width;ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.stroke();ctx.restore()}
  function ring(point,r,col,opacity=1){const s=scale(point);ctx.save();ctx.strokeStyle=col;ctx.globalAlpha=opacity;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(s.x,s.y,r,0,Math.PI*2);ctx.stroke();ctx.restore()}
  function dot(point,r,col){const s=scale(point);ctx.beginPath();ctx.arc(s.x,s.y,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill()}
  function text(txt,x,y,col='#b7bfb8',font='10px monospace',align='left'){ctx.fillStyle=col;ctx.font=font;ctx.textAlign=align;ctx.fillText(txt,x,y)}
  function baseField(now){const {w,h}=viewSize;const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#12333b');grad.addColorStop(.54,'#102c37');grad.addColorStop(1,'#0a202b');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
    // The flowing contour mesh is procedural graphic notation, NOT historical bathymetry.
    ctx.save();for(let j=0;j<25;j++){ctx.beginPath();for(let x=-5;x<w+7;x+=9){const y=(j+1)*h/27+15*Math.sin(x*.007+j*.9+now*.000016)+7*Math.cos(x*.017+j*.7);if(x===-5)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.strokeStyle=j%4===0?'#2c5359':'#25464e';ctx.globalAlpha=j%4===0?.27:.13;ctx.lineWidth=.8;ctx.stroke()}ctx.restore();
    ctx.save();ctx.lineWidth=.55;ctx.strokeStyle='#3d6269';ctx.globalAlpha=.4;for(let lon=145;lon<195;lon+=5){const x=scale({lon,lat:0}).x;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();text(`${lon>180?'W '+(360-lon):'E '+lon}°`,x+5,h-43,'#63858a','9px monospace')}for(let lat=-15;lat<=10;lat+=5){const y=scale({lon:150,lat}).y;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();text(`${Math.abs(lat)}°${lat>=0?'N':'S'}`,9,y-5,'#63858a','9px monospace')}ctx.restore();
    const baseLine=[M.LAE,M.HOWLAND];ctx.save();ctx.setLineDash([4,7]);strokePoints([{...M.LAE,t:0},{...M.HOWLAND,t:1}],'#5d9b9d',1,.65);ctx.restore();
    dot(M.LAE,4,'#f5e4bd');dot(M.HOWLAND,4,'#f5e4bd');dot(M.NIKUMARORO,3,'#b7bcae');
    ring(M.HOWLAND,11,'#e7bb7c',.6);ring(M.NIKUMARORO,7,'#769fa3',.45);
    const l=scale(M.LAE),hP=scale(M.HOWLAND),n=scale(M.NIKUMARORO);
    text('LAE',l.x+10,l.y-13,'#f3d8a0','bold 10px monospace');text('HOWLAND',hP.x+8,hP.y-17,'#f3d8a0','bold 10px monospace');text('NIKUMARORO',n.x+9,n.y+22,'#8dbfc0','9px monospace');
    text('P A C I F I C   O C E A N',w*.36,h*.58,'#32606a',`${Math.max(11,Math.min(16,w/64))}px monospace`);
  }
  function planeIcon(pt,heading,now){const {x,y}=scale(pt);if(x<0||x>viewSize.w||y<0||y>viewSize.h)return;ctx.save();ctx.translate(x,y);ctx.rotate((heading-90)*Math.PI/180);ctx.shadowColor='#edb86b';ctx.shadowBlur=22;ctx.fillStyle='#ffca7e';ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-8,-2);ctx.lineTo(-13,-13);ctx.lineTo(-18,-13);ctx.lineTo(-15,-1.5);ctx.lineTo(-23,-1.5);ctx.lineTo(-26,-5);ctx.lineTo(-28,-5);ctx.lineTo(-26,0);ctx.lineTo(-28,5);ctx.lineTo(-26,5);ctx.lineTo(-23,1.5);ctx.lineTo(-15,1.5);ctx.lineTo(-18,13);ctx.lineTo(-13,13);ctx.lineTo(-8,2);ctx.closePath();ctx.fill();ctx.restore();ring(pt,23+Math.sin(now*.003)*2,'#edb86b',.8);}
  function renderInstrument(trial,st,now){const {w,h}=viewSize;ctx.fillStyle='#0d2730';ctx.fillRect(0,0,w,h);const midX=w*.5,midY=h*.49,r=Math.min(h*.34,w*.28);ctx.save();ctx.strokeStyle='#325761';ctx.lineWidth=1;for(let k=1;k<=5;k++){ctx.beginPath();ctx.arc(midX,midY,r*k/5,0,Math.PI*2);ctx.stroke()}ctx.beginPath();ctx.moveTo(midX-r*1.15,midY);ctx.lineTo(midX+r*1.15,midY);ctx.moveTo(midX,midY-r*1.15);ctx.lineTo(midX,midY+r*1.15);ctx.stroke();ctx.restore();const heading=st.heading||79,angle=(heading-90)*Math.PI/180;ctx.save();ctx.translate(midX,midY);ctx.rotate(angle);ctx.strokeStyle='#edb86b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-r*.45,0);ctx.lineTo(r*.72,0);ctx.lineTo(r*.53,-8);ctx.moveTo(r*.72,0);ctx.lineTo(r*.53,8);ctx.stroke();ctx.restore();text('SIMULATED HEADING',midX,midY+r+34,'#80b7b7','11px monospace','center');text(String(Math.round(heading)).padStart(3,'0')+'°',midX,midY+r+67,'#edb86b','bold 28px monospace','center');text('FUEL GAUGE / ESTIMATED',20,h*.33,'#8aaeb0','10px monospace');ctx.strokeStyle='#365860';ctx.strokeRect(20,h*.36,Math.min(150,w*.22),12);ctx.fillStyle='#edb86b';ctx.fillRect(20,h*.36,Math.min(150,w*.22)*Math.max(0,st.fuel/trial.fuel0),12);text(`${Math.round(st.fuel)} / ${Math.round(trial.fuel0)} GAL`,20,h*.36+30,'#e3ddd0','11px monospace');text('ELECTRA 10E / SURROGATE',w-20,h*.33,'#8aaeb0','10px monospace','right');text('NO REAL-TIME TELEMETRY',w-20,h*.37,'#e9bd7e','11px monospace','right');ctx.save();for(let i=0;i<28;i++){let x=20+i*(w-40)/27,bar=30+32*Math.sin(i*.5+now*.001);ctx.fillStyle=i%3?'#3a7577':'#b8a474';ctx.globalAlpha=.5;ctx.fillRect(x,h*.8-bar,2,bar)}ctx.restore();}
  function draw(now){resize();const {w,h}=viewSize;if(w<1)return;const tHours=Math.min(48,sessionHours()),currentEpoch=Math.min(23,Math.floor(tHours/2));const live=tHours>=48?24:(tHours%2)/2*24;const idx=currentEpoch*8;const selected=base[idx];const st=M.interpolate(selected,live),limited=base.slice(0,Math.min(192,(currentEpoch+1)*8));
    if(scene==='instrument'){renderInstrument(selected,st,now)}else{
      baseField(now);
      if(scene==='density'){
        for(const tr of limited){ctx.save();ctx.globalAlpha=.12;const p0=scale(tr.end),r=21;const g=ctx.createRadialGradient(p0.x,p0.y,0,p0.x,p0.y,r);g.addColorStop(0,'#f4b868');g.addColorStop(1,'#f4b86800');ctx.fillStyle=g;ctx.fillRect(p0.x-r,p0.y-r,2*r,2*r);ctx.restore();dot(tr.end,2,'#e9b879')}
        text('ENDPOINT OCCURRENCE / SYNTHETIC SAMPLE',17,h*.22,'#edb86b','10px monospace');
      }else{
        for(let i=0;i<limited.length;i++){if(i===idx)continue;strokePoints(limited[i].points,'#72b4bf',.6,.16)}
        if(branch){ctx.save();ctx.setLineDash([3,5]);for(let i=0;i<Math.min(24,branch.length);i++)strokePoints(branch[i].points,'#f1795f',1,.3);ctx.restore()}
        strokePoints(selected.points,'#e5b56e',2,.26,Infinity);strokePoints(selected.points,'#ffc477',2.4,.95,live);planeIcon(st,st.heading,now);
        const active=scale(st);if(active.x<w-110)text(`T+${live.toFixed(1)}H`,active.x+32,active.y-12,'#f2c782','10px monospace');
      }
    }
    const done=live>=selected.end.t-1e-7;
    const phase=done?'FUEL EXHAUSTED (MODEL)':live>=18?'STYLIZED LOP SEARCH':'EN ROUTE / OPEN LOOP';
    $('clock').innerHTML=hms(tHours).replace(/:/g,'<span>:</span>');$('progress-fill').style.width=(100*tHours/48)+'%';$('epoch-label').textContent=`SCENARIO ${fmt(currentEpoch+1)} / 24 · ${Math.round(100*tHours/48)}% COMPLETE`;
    $('airtime').textContent=`${fmt(Math.floor(Math.min(live,selected.end.t)))}:${fmt(Math.floor((Math.min(live,selected.end.t)%1)*60))}`;
    $('fuel').textContent=Math.round(st.fuel).toLocaleString('en-US');$('groundspeed').textContent=done?'0':Math.round(st.speed).toString();$('distance').textContent=(M.distKm(st,M.HOWLAND)/1.852).toFixed(0);
    $('flight-phase').textContent=phase;
    $('flight-description').textContent=done?'Simulation terminates at modeled fuel exhaustion.':live>=18?'Hypothetical 157°/337° search legs, not evidence of actual crew decisions.':'Aircraft uses an uncorrected planned course with synthetic wind and heading uncertainty.';
    $('field-coordinates').textContent=`LAT ${Math.abs(st.lat).toFixed(2)}°${st.lat>=0?'N':'S'} / LON ${(st.lon>180?360-st.lon:st.lon).toFixed(2)}°${st.lon>180?'W':'E'}`;
    $('narrative').textContent=done?`Scenario ${fmt(currentEpoch+1)} reached modeled fuel exhaustion at T+${selected.end.t.toFixed(1)} hours. Endpoint ${Math.round(M.distKm(selected.end,M.HOWLAND))} km from Howland. This is a synthetic location, NOT wreckage evidence.`:live>=18?`Scenario ${fmt(currentEpoch+1)} entered an illustrative search along a 157°/337° line. The crew's actual decisions and route after the final radio messages remain unknown.`:`Scenario ${fmt(currentEpoch+1)} is flying an open-loop reference bearing of ${selected.cruiseBearing.toFixed(1)}°, altered by assumed wind and synthetic navigation error. This is not a recorded Earhart trajectory.`;
    if(currentEpoch!==lastEpoch){lastEpoch=currentEpoch;const s=M.stats(limited);lastStats=s;$('samples').textContent=s.trials;$('near').textContent=s.nearHowland;$('niku').textContent=s.nearNiku;$('samples-label').textContent=`${s.trials} / 192 TRIALS RELEASED`;}
    occasionalPrompt(tHours);
    if(audioState){const f=st.fuel>0?1:.14;audioState.osc1.frequency.setTargetAtTime(64*f, audioState.ctx.currentTime,.2);audioState.osc2.frequency.setTargetAtTime(96*f,audioState.ctx.currentTime,.2);audioState.volume.gain.setTargetAtTime(st.fuel>0?.1:.018,audioState.ctx.currentTime,.3);}
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();