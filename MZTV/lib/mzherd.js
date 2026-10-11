/* MZHERD v0.1.1 — deterministic autonomous flock and dog. No camera/DOM dependency. */
(function(root){
'use strict';
const V=(x=0,z=0)=>({x,z}),add=(a,b)=>V(a.x+b.x,a.z+b.z),sub=(a,b)=>V(a.x-b.x,a.z-b.z),mul=(a,k)=>V(a.x*k,a.z*k),len=a=>Math.hypot(a.x,a.z),norm=a=>mul(a,1/(len(a)||1)),dist=(a,b)=>len(sub(a,b)),clamp=(a,l,h)=>Math.min(h,Math.max(l,a));
const FIELD={xMin:-108,xMax:108,zMin:-68,zMax:68,dividerX:0,gateHalf:12,targetX:19};
function random(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
function event(w,type,message){w.events.push({t:+w.t.toFixed(2),type,message});if(w.events.length>100)w.events.shift();}
function create(seed=29,count=16){const rnd=random(seed),sheep=[];for(let i=0;i<count;i++){const a=rnd()*Math.PI*2,r=5+Math.sqrt(rnd())*23;sheep.push({id:i,p:V(-48+Math.cos(a)*r,Math.sin(a)*r*.95),v:V(),heading:0,in:false});}
return{version:1,seed,count,sheep,t:0,commanded:false,result:null,phase:'READY',target:'NORTH FIELD',hold:0,events:[],stepCount:0,stats:{crossings:0,splits:0,recoveries:0,commands:0,completedAt:null},dog:{p:V(-88,20),v:V(),heading:0,phase:'IDLE',focus:null,aim:V(-62,0),timeInPhase:0}};}
function state(w){let c=V();for(const s of w.sheep)c=add(c,s.p);c=mul(c,1/w.count);let spread=0,max=0,outlier=null;for(const s of w.sheep){const d=dist(s.p,c);spread+=d*d;if(d>max){max=d;outlier=s;}}return{center:c,spread:Math.sqrt(spread/w.count),max,outlier,countIn:w.sheep.filter(s=>s.in).length};}
function command(w,target='NORTH FIELD'){if(w.result)return false;if(!w.commanded){w.commanded=true;w.phase='RUNNING';w.target=target;w.stats.commands++;event(w,'COMMAND','GATHER TO '+target);phase(w,'FLANK','seeking pressure position');}return true;}
function phase(w,p,reason){const d=w.dog;if(d.phase===p)return;d.phase=p;d.timeInPhase=0;if(p==='COLLECT')w.stats.recoveries++;event(w,'DOG',p+(reason?' · '+reason:''));}
function edge(p,v,r){const x=p.x,z=p.z;p.x=clamp(p.x,FIELD.xMin+r,FIELD.xMax-r);p.z=clamp(p.z,FIELD.zMin+r,FIELD.zMax-r);if(p.x!==x)v.x*=-.18;if(p.z!==z)v.z*=-.18;}
function divider(p,old,v,r){if(Math.abs(p.z)>=FIELD.gateHalf-r*.25||Math.abs(old.z)>=FIELD.gateHalf-r*.25){if(old.x<0&&p.x>=-r){p.x=-r;v.x=Math.min(0,v.x)*.12;}else if(old.x>0&&p.x<=r){p.x=r;v.x=Math.max(0,v.x)*.12;}}}
function dogStep(w,dt,st){
const d=w.dog,c=st.center,goal=c.x< -7?V(0,0):V(51,0),drive=norm(sub(goal,c));
let aim;
if(st.max>18&&st.outlier&&st.outlier.p.x<FIELD.targetX){
const stray=st.outlier;aim=add(stray.p,mul(norm(sub(stray.p,c)),14));d.focus=stray.id;phase(w,'COLLECT','stray '+(stray.id+1));
}else{
d.focus=null;aim=sub(c,mul(drive,18+clamp(st.spread*.22,0,4)));aim.z+=clamp(-c.z*.13,-4,4);phase(w,'DRIVE',c.x< -7?'toward gate':'toward field');
}
aim.x=clamp(aim.x,FIELD.xMin+4,FIELD.xMax-4);aim.z=clamp(aim.z,FIELD.zMin+4,FIELD.zMax-4);
if(d.p.x*aim.x<0&&Math.abs(d.p.x)>1.8){if(Math.abs(d.p.z)>6.5)aim=V(d.p.x<0?-6:6,0);else aim=V(d.p.x<0?8:-8,0);}
d.aim=aim;const diff=sub(aim,d.p),r=len(diff),speed=r<5?.6+r*.96:r<15?7.6:10.7,want=mul(norm(diff),speed),turn=clamp(dt*3.3,0,1);
d.v=add(mul(d.v,1-turn),mul(want,turn));if(r<1.1)d.v=mul(d.v,.7);const old=V(d.p.x,d.p.z);d.p=add(d.p,mul(d.v,dt));divider(d.p,old,d.v,2);edge(d.p,d.v,2);
if(len(d.v)>.15)d.heading=Math.atan2(d.v.z,d.v.x);
}
function sheepStep(w,dt){
const old=w.sheep.map(s=>V(s.p.x,s.p.z)),updates=[];
for(const s of w.sheep){
let cohesion=V(),separation=V(),n=0;
for(const o of w.sheep){if(o===s)continue;const dv=sub(s.p,o.p),dd=len(dv);if(dd<30){cohesion=add(cohesion,o.p);n++;}if(dd<6.5&&dd>.0001)separation=add(separation,mul(dv,(6.5-dd)/(dd*6.5)));}
if(n)cohesion=sub(mul(cohesion,1/n),s.p);
const fromDog=sub(s.p,w.dog.p),dd=len(fromDog),pressure=clamp((33-dd)/23,0,1),fear=mul(norm(fromDog),pressure*pressure*15.8);
const wander=V(Math.sin(w.t*.73+s.id*4.73)*.36,Math.cos(w.t*.51+s.id*7.13)*.36);
let acc=add(add(mul(cohesion,.18),mul(separation,12)),add(fear,wander));acc=add(acc,mul(s.v,-1.9));if(len(acc)>24)acc=mul(acc,24/len(acc));
let velocity=add(s.v,mul(acc,dt)),speed=pressure>.35?6.4:3.1;if(len(velocity)>speed)velocity=mul(norm(velocity),speed);updates.push(velocity);
}
w.sheep.forEach((s,i)=>{s.v=updates[i];s.p=add(s.p,mul(s.v,dt));divider(s.p,old[i],s.v,1.4);edge(s.p,s.v,1.4);if(len(s.v)>.08)s.heading=Math.atan2(s.v.z,s.v.x);
const was=s.in;s.in=s.p.x>FIELD.targetX;if(s.in&&!was){w.stats.crossings++;event(w,'CROSSING','sheep '+String(s.id+1).padStart(2,'0')+' entered field');}else if(!s.in&&was)event(w,'ESCAPE','sheep '+String(s.id+1).padStart(2,'0')+' left field');});
}
function step(w,dt=1/30){dt=clamp(Number.isFinite(dt)?dt:0,0,.05);if(!dt||w.result)return w;w.t+=dt;w.stepCount++;if(!w.commanded)return w;let st=state(w);dogStep(w,dt,st);sheepStep(w,dt);st=state(w);
const split=st.max>24;if(split&&!w._split){w.stats.splits++;event(w,'FLOCK','flock dispersed');}w._split=split;
if(st.countIn===w.count){w.hold+=dt;if(w.hold>=1.8){w.phase='COMPLETE';w.result='SUCCESS';w.stats.completedAt=+w.t.toFixed(2);phase(w,'COMPLETE','all sheep delivered');event(w,'RESULT','ALL '+w.count+' SHEEP IN FIELD');}}else w.hold=0;
if(w.t>390&&!w.result){w.phase='TIMEOUT';w.result='TIMEOUT';event(w,'RESULT','TIMEOUT · '+st.countIn+'/'+w.count+' delivered');}return w;}
function snapshot(w){return JSON.parse(JSON.stringify(w));}
function restore(data){if(!data||data.version!==1||!Array.isArray(data.sheep)||!data.dog||!Number.isFinite(data.t))throw Error('Invalid MZHERD snapshot');return snapshot(data);}
root.MZHerd={version:'0.1.1',FIELD,create,command,step,state,snapshot,restore,vec:V,dist};
})(typeof window!=='undefined'?window:globalThis);
