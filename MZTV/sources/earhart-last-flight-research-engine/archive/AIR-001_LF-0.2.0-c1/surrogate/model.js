/* MZTV / THE LAST FLIGHT / experimental seeded kinematic flight model
 * NO empirical weighting; NOT a validated Lockheed 10E digital twin.
 * A model is a question, not evidence of where the airplane ended up.
 */
(function (global) {
  'use strict';
  const LAE = Object.freeze({ lat:-6.732, lon:146.996, name:'LAE' });
  // Unwrapped longitude avoids crossing the International Date Line in map projections.
  const HOWLAND = Object.freeze({ lat:0.8067, lon:183.3833, name:'HOWLAND' });
  const NIKUMARORO = Object.freeze({ lat:-4.6667, lon:185.4667, name:'NIKUMARORO' });
  const DEFAULTS = Object.freeze({ airspeed:124, fuelStart:1070, burn:49, wind:0, nav:3 });
  const MODEL_VERSION = '0.1.0';
  const KM_PER_NM=1.852;
  function seedRng(seed) {
    let a=(seed|0)>>>0;
    return function () { a+=0x6D2B79F5; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
  }
  function gauss(rng){return Math.sqrt(-2*Math.log(Math.max(1e-12,rng())))*Math.cos(2*Math.PI*rng());}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function rad(v){return v*Math.PI/180;}
  function wrap360(v){return ((v%360)+360)%360;}
  function distKm(a,b){let mean=rad((a.lat+b.lat)/2);return Math.hypot((b.lat-a.lat)*111.195,(b.lon-a.lon)*111.195*Math.cos(mean));}
  function bearing(a,b){let mean=rad((a.lat+b.lat)/2);return wrap360(Math.atan2((b.lon-a.lon)*Math.cos(mean),b.lat-a.lat)*180/Math.PI);}
  function coords(p,bearingDeg,distanceKm){let r=rad(bearingDeg);let lat=p.lat+Math.cos(r)*distanceKm/111.195;let lon=p.lon+Math.sin(r)*distanceKm/(111.195*Math.cos(rad((p.lat+lat)/2)));return {lat,lon};}
  function clone(p){return {lat:p.lat,lon:p.lon};}
  function normalizedConfig(input){const p=Object.assign({},DEFAULTS,input||{}); return {airspeed:clamp(Number(p.airspeed)||124,80,180),fuelStart:clamp(Number(p.fuelStart)||1070,100,1151),burn:clamp(Number(p.burn)||49,15,100),wind:clamp(Number(p.wind)||0,-45,45),nav:clamp(Number(p.nav)||0,0,20)};}
  function simulate(seed,input){
    const c=normalizedConfig(input),rng=seedRng(seed),points=[],dt=0.12;
    // The model uses synthetic variation; its parameters are illustrative distributions, not sourced priors.
    const speed=clamp(c.airspeed+gauss(rng)*3,75,185),fuel0=clamp(c.fuelStart+gauss(rng)*20,100,1151);
    const consumption=clamp(c.burn+gauss(rng)*1.7,15,100),endurance=fuel0/consumption;
    const fixedBias=gauss(rng)*c.nav,windN=c.wind+gauss(rng)*2,windE=gauss(rng)*4;
    const cruiseBearing=bearing(LAE,HOWLAND),minHowland={km:Infinity,t:0};
    let pos=clone(LAE),t=0,heading=cruiseBearing,fuel=fuel0,search=false;
    points.push({t,lat:pos.lat,lon:pos.lon,heading,speed,fuel});
    while(t<Math.min(27,endurance)-1e-8){
      let h=Math.min(dt,Math.min(27,endurance)-t);
      if(h<1e-5)break;
      // An open-loop assumed bearing; NO simulated pilot has access to actual position.
      // After 18 h, oscillate on a stylized 157/337 line-of-position search pattern.
      search=t>=18;
      heading=search?(Math.floor((t-18)/1.65)%2?157:337):cruiseBearing+fixedBias+0.65*Math.sin(t*0.55+seed*0.01);
      let moved=coords(pos,heading,speed*KM_PER_NM*h);
      moved.lat+=(windN*KM_PER_NM*h)/111.195;
      moved.lon+=(windE*KM_PER_NM*h)/(111.195*Math.cos(rad(moved.lat)));
      pos=moved;t+=h;fuel=Math.max(0,fuel0-consumption*t);
      let d=distKm(pos,HOWLAND);if(d<minHowland.km){minHowland.km=d;minHowland.t=t;}
      points.push({t,lat:pos.lat,lon:pos.lon,heading:wrap360(heading),speed:Math.hypot(speed+windE,windN),fuel});
    }
    const end=points[points.length-1];
    return {seed,config:c,points,end,endurance,cruiseBearing,fixedBias,windN,windE,fuel0,consumption,
      minHowlandKm:minHowland.km,minHowlandHour:minHowland.t,
      nearHowland:minHowland.km<=25,nearNiku:distKm(end,NIKUMARORO)<=50,
      nikuKm:distKm(end,NIKUMARORO)};
  }
  function interpolate(trial,t){const a=trial.points;if(t<=0)return a[0];if(t>=a[a.length-1].t)return a[a.length-1];const i=Math.min(a.length-2,Math.floor(t/0.12));const p=a[i],q=a[i+1];const f=clamp((t-p.t)/(q.t-p.t),0,1);return {t,lat:p.lat+(q.lat-p.lat)*f,lon:p.lon+(q.lon-p.lon)*f,heading:p.heading,speed:p.speed,fuel:p.fuel+(q.fuel-p.fuel)*f};}
  function ensemble(seed,count,config){return Array.from({length:count},(_,i)=>simulate(((seed|0)+i*65537)>>>0,config));}
  function stats(trials){return {trials:trials.length,nearHowland:trials.filter(t=>t.nearHowland).length,nearNiku:trials.filter(t=>t.nearNiku).length};}
  global.MZLastFlight={LAE,HOWLAND,NIKUMARORO,DEFAULTS,MODEL_VERSION,seedRng,distKm,bearing,simulate,interpolate,ensemble,stats,normalizedConfig};
})(typeof window!=='undefined'?window:globalThis);