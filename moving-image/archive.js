const menuButton=document.querySelector('.menu-button');
const nav=document.querySelector('.site-nav');
menuButton?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');}));

const videos=[
{id:'MZ-MI-019',vimeo:'1177786005',date:'2026-07-01',year:'2026',title:'Field Station: Magpie | Tuttle Gallery Exhibition | Walkthrough with Voice Over',class:'artifact',field:'PLACE + FICTION',project:'FIELD STATION: MAGPIE',tags:['MAGPIE','EXHIBITION','DOCUMENTATION','SPECULATIVE FICTION'],description:'Exhibition documentation from the first FIELD STATION: MAGPIE presentation at Tuttle Gallery. The installation assembled paintings, archival documents, portraits, recovered objects, and signal-based sculptural elements into a fragmentary future archive set within the project’s world of 2147.'},
{id:'MZ-MI-018',vimeo:'871499148',date:'2023-09-15',year:'2023',title:'09-15-2023-loop-mz-installation-virtual-tour',class:'artifact',field:'IMAGE + MOTION',project:'INSTALLATION DOCUMENTATION',tags:['INSTALLATION','DOCUMENTATION','VIRTUAL TOUR'],description:'Virtual-tour documentation of a Match Zimmerman installation, preserved here as an archival record of the work in space.'},
{id:'MZ-MI-017',vimeo:'123541585',date:'2015-03-01',year:'2015',title:'Impression / Vision Performance | Kinect + Max/MSP/Jitter + Dance',class:'work',field:'IMAGE + MOTION',project:'IMPRESSION / VISION',tags:['IMPRESSION / VISION','KINECT','MAX/MSP/JITTER','DANCE'],description:'Performance of Impression / Vision at Muhlenberg College’s 20th Anniversary Dance Concert. Visuals by Match Zimmerman use Kinect and Max/MSP/Jitter; choreography is by Kara Senich Zimmerman.'},
{id:'MZ-MI-016',vimeo:'70642402',date:'2013-07-01',year:'2013',title:'Max / MSP / Jitter | Rollie “Solitude” | Audio Visualizer',class:'experiment',field:'SOUND + IMAGE',project:'AUDIOVISUAL STUDIES',tags:['MAX/MSP/JITTER','AUDIO-REACTIVE','VISUALIZER'],description:'An audio-reactive Max/MSP/Jitter visualization built around Rollie’s “Solitude,” treating sound as control data for a moving visual field.'},
{id:'MZ-MI-015',vimeo:'62636945',date:'2013-03-01',year:'2013',title:'Impression / Vision Rehearsal | Kara Senich Zimmerman + Match Zimmerman',class:'study',field:'IMAGE + MOTION',project:'IMPRESSION / VISION',tags:['IMPRESSION / VISION','KINECT','DANCE','REHEARSAL'],description:'Rehearsal documentation for Impression / Vision, combining dance, Kinect capture, and responsive Max/MSP/Jitter visuals during development of the performance system.'},
{id:'MZ-MI-014',vimeo:'60593490',date:'2013-02-01',year:'2013',title:'Abstract Tidal Study 01 (Chroma Key Effect)',class:'study',field:'IMAGE + MOTION',project:'TIDAL STUDIES',tags:['TIDAL','CHROMA KEY','COLLABORATION'],description:'A study of tidal motion using original footage by Adam Reynolds, processed as an abstract moving-image experiment.'},
{id:'MZ-MI-013',vimeo:'60329277',date:'2013-02-01',year:'2013',title:'Kinect + Max/MSP/Jitter (Wireframe Datamosh Delay)',class:'experiment',field:'IMAGE + MOTION',project:'KINECT / JITTER STUDIES',tags:['KINECT','MAX/MSP/JITTER','DATAMOSH','DEPTH'],description:'A Kinect and Max/MSP/Jitter experiment in which an export accident produced an unintended datamosh effect, turning technical failure into part of the visual system.'},
{id:'MZ-MI-012',vimeo:'59443590',date:'2013-02-01',year:'2013',title:'Kinect + Max/MSP/Jitter (Kinect Cat)',class:'experiment',field:'IMAGE + MOTION',project:'KINECT / JITTER STUDIES',tags:['KINECT','MAX/MSP/JITTER','DEPTH'],description:'A compact depth-camera experiment using Kinect input inside Max/MSP/Jitter, with a cat becoming the live subject and visual material.'},
{id:'MZ-MI-011',vimeo:'58650683',date:'2013-01-01',year:'2013',title:'Max/MSP/Jitter (Bouncing Vocals)',class:'experiment',field:'SOUND + IMAGE',project:'AUDIOVISUAL STUDIES',tags:['MAX/MSP/JITTER','VOICE','AUDIO-REACTIVE'],description:'An audiovisual Max/MSP/Jitter experiment connecting vocal sound with animated movement and responsive image behavior.'},
{id:'MZ-MI-010',vimeo:'58035983',date:'2013-01-01',year:'2013',title:'Kinect + Max/MSP/Jitter (Multicolor Wireframe Effect)',class:'experiment',field:'IMAGE + MOTION',project:'KINECT / JITTER STUDIES',tags:['KINECT','MAX/MSP/JITTER','DEPTH','INTERACTION'],description:'A live-video experiment using Kinect depth data and Max/MSP/Jitter. Viewer proximity affects the rate of color change, tying bodily distance directly to the visual response.'},
{id:'MZ-MI-009',vimeo:'12112814',date:'2010-05-01',year:'2010',title:'Empty Used Car Lot // A Video Loop',class:'work',field:'IMAGE + MOTION',project:'VIDEO LOOPS',tags:['VIDEO LOOP'],description:'A loop-based moving-image work centered on the vacancy and visual rhythm of an empty used-car lot.'},
{id:'MZ-MI-008',vimeo:'4798039',date:'2009-05-01',year:'2009',title:'Navigating a Forest by Moonlight (Proof 01) // A Processing Sketch Video Loop',class:'study',field:'IMAGE + MOTION',project:'PROCESSING STUDIES',tags:['PROCESSING','VIDEO LOOP','PROOF'],description:'A Processing-based proof and video-loop study exploring simulated navigation through a forest-like field by moonlight.'},
{id:'MZ-MI-007',vimeo:'4686435',date:'2009-05-01',year:'2009',title:'Up For Air // A Video Loop',class:'work',field:'IMAGE + MOTION',project:'VIDEO LOOPS',tags:['VIDEO LOOP'],description:'An early short-form video loop using repetition and cyclical duration as the structure of the moving image.'},
{id:'MZ-MI-006',vimeo:'3337007',date:'2009-02-01',year:'2009',title:'“Post/Pre” Video Promo 01 (No and the Big Deals)',class:'work',field:'IMAGE + MOTION',project:'NO AND THE BIG DEALS',tags:['ANIMATION','MUSIC','PROMO','NO AND THE BIG DEALS'],description:'Animated orb experiments developed into an online video promo for No and the Big Deals’ debut album, translating an existing visual study into a music-release artifact.'},
{id:'MZ-MI-005',vimeo:'2162048',date:'2008-11-01',year:'2008',title:'Irish Mass Lights // A Video Loop',class:'work',field:'IMAGE + MOTION',project:'VIDEO LOOPS',tags:['VIDEO LOOP','LIGHT'],description:'An early video loop built around recorded light, ambient movement, and repetition.'},
{id:'MZ-MI-004',vimeo:'2162033',date:'2008-11-01',year:'2008',title:'Talking Heads Projection // A Video Installation',class:'work',field:'IMAGE + MOTION',project:'TALKING HEADS',tags:['VIDEO INSTALLATION','PROJECTION','VIDEO LOOP'],description:'A projected installation version of the Talking Heads material, shifting the repeating moving image from a screen-based loop into spatial presentation.'},
{id:'MZ-MI-003',vimeo:'2162022',date:'2008-11-01',year:'2008',title:'Talking Heads // A Video Loop',class:'work',field:'IMAGE + MOTION',project:'TALKING HEADS',tags:['VIDEO LOOP'],description:'An early repeating moving-image work using talking-head footage as looped visual material.'},
{id:'MZ-MI-002',vimeo:'1680746',date:'2008-09-01',year:'2008',title:'Sink Double // A Video Loop',class:'work',field:'IMAGE + MOTION',project:'VIDEO LOOPS',tags:['VIDEO LOOP'],description:'An early video-loop work built from a doubled sink image and repeated domestic visual material.'},
{id:'MZ-MI-001',vimeo:'1681084',date:'2005-01-01',year:'2005',title:'Outback Sunrise // A Video Loop',class:'work',field:'IMAGE + MOTION',project:'VIDEO LOOPS',tags:['VIDEO LOOP','AUSTRALIA'],description:'Digital video shot in the Australian Outback in 2005 and presented as a repeating moving-image work.'}
];

const grid=document.getElementById('video-grid');
const count=document.getElementById('record-count');
const dialog=document.getElementById('video-dialog');
const dialogContent=document.getElementById('video-dialog-content');
const filters=[...document.querySelectorAll('.filter')];
let activeFilter='all';

function sourceUrl(v){return 'https://vimeo.com/'+v.vimeo;}
function embedUrl(v){return 'https://player.vimeo.com/video/'+v.vimeo+'?autoplay=1&title=0&byline=0&portrait=0';}
function fallbackThumb(v){return 'https://vumbnail.com/'+v.vimeo+'.jpg';}
function visibleVideos(){return videos.filter(v=>activeFilter==='all'||v.class===activeFilter).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));}

function render(){
  const visible=visibleVideos();
  count.textContent=String(videos.length);
  grid.replaceChildren();
  visible.forEach(v=>{
    const article=document.createElement('article');
    article.className='video-card';
    article.dataset.class=v.class;
    const button=document.createElement('button');
    button.type='button';
    button.className='video-open';
    button.setAttribute('aria-label','Open '+v.title);
    const thumb=document.createElement('div');
    thumb.className='video-thumb';
    const img=document.createElement('img');
    img.loading='lazy';
    img.decoding='async';
    img.alt='';
    img.src=v.thumbnail||fallbackThumb(v);
    const play=document.createElement('span');
    play.className='video-play';
    play.textContent='PLAY';
    thumb.append(img,play);
    const copy=document.createElement('div');
    copy.className='video-copy';
    const idline=document.createElement('div');
    idline.className='video-idline';
    idline.innerHTML='<span>'+v.id+'</span><span>'+v.year+'</span>';
    const title=document.createElement('h3');
    title.textContent=v.title;
    const meta=document.createElement('div');
    meta.className='video-meta';
    meta.innerHTML='<span>'+v.class.toUpperCase()+'</span><span>'+v.field+'</span>';
    copy.append(idline,title,meta);
    button.append(thumb,copy);
    button.addEventListener('click',()=>openVideo(v));
    article.append(button);
    grid.append(article);
  });
}

function openVideo(v){
  if(!dialog||!dialogContent)return;
  const tags=v.tags.map(tag=>'<span>'+tag+'</span>').join('');
  dialogContent.innerHTML=
    '<div class="video-dialog-body">'+
      '<div class="video-dialog-kicker">'+v.id+' / '+v.year+' / '+v.class.toUpperCase()+' / '+v.field+'</div>'+
      '<h2 id="video-title">'+v.title+'</h2>'+
      '<div class="video-player"><iframe src="'+embedUrl(v)+'" title="'+v.title.replace(/"/g,'&quot;')+'" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe></div>'+
      '<div class="video-record">'+
        '<div><p class="video-description">'+v.description+'</p><div class="video-tags">'+tags+'</div><a class="video-source" href="'+sourceUrl(v)+'" target="_blank" rel="noopener">OPEN ORIGINAL ON VIMEO ↗</a></div>'+
        '<dl class="video-facts">'+
          '<div><dt>ID</dt><dd>'+v.id+'</dd></div>'+
          '<div><dt>Class</dt><dd>'+v.class+'</dd></div>'+
          '<div><dt>Field</dt><dd>'+v.field+'</dd></div>'+
          '<div><dt>Project</dt><dd>'+v.project+'</dd></div>'+
          '<div><dt>Year</dt><dd>'+v.year+'</dd></div>'+
          '<div><dt>Source</dt><dd>Vimeo / '+v.vimeo+'</dd></div>'+
        '</dl>'+
      '</div>'+
    '</div>';
  dialog.showModal();
}

dialog?.addEventListener('close',()=>{dialogContent.replaceChildren();});
dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});

filters.forEach(button=>button.addEventListener('click',()=>{
  activeFilter=button.dataset.filter;
  filters.forEach(b=>b.classList.toggle('active',b===button));
  render();
}));

async function enrichVimeo(v){
  const endpoint='https://vimeo.com/api/oembed.json?url='+encodeURIComponent(sourceUrl(v))+'&width=960';
  try{
    const response=await fetch(endpoint,{mode:'cors'});
    if(!response.ok)return;
    const data=await response.json();
    if(data.thumbnail_url)v.thumbnail=data.thumbnail_url;
  }catch(_){}
}

render();
Promise.all(videos.map(enrichVimeo)).then(render);