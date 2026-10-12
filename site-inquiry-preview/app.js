(function(){
"use strict";
var menu=document.querySelector("[data-menu]"),nav=document.querySelector("[data-nav]");
if(menu&&nav){menu.addEventListener("click",function(){var open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));menu.textContent=open?"CLOSE −":"MENU +";});nav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.textContent="MENU +";});});}
var tabs=Array.from(document.querySelectorAll("[data-lens]")),panels=Array.from(document.querySelectorAll("[data-lens-panel]"));
function chooseLens(id){tabs.forEach(function(t){var selected=t.dataset.lens===id;t.setAttribute("aria-selected",String(selected));t.tabIndex=selected?0:-1;});panels.forEach(function(p){p.hidden=p.dataset.lensPanel!==id;});}
tabs.forEach(function(t,i){t.addEventListener("click",function(){chooseLens(t.dataset.lens);});t.addEventListener("keydown",function(e){if(e.key!=="ArrowRight"&&e.key!=="ArrowLeft")return;e.preventDefault();var next=(i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;tabs[next].focus();chooseLens(tabs[next].dataset.lens);});});if(tabs.length)chooseLens(tabs.find(function(t){return t.getAttribute("aria-selected")==="true";})?.dataset.lens||tabs[0].dataset.lens);
var filters=Array.from(document.querySelectorAll("[data-filter]")),rows=Array.from(document.querySelectorAll("[data-record]")),count=document.querySelector("[data-record-count]");
filters.forEach(function(f){f.addEventListener("click",function(){var category=f.dataset.filter,visible=0;filters.forEach(function(x){x.setAttribute("aria-pressed",String(x===f));});rows.forEach(function(x){var show=category==="all"||x.dataset.record===category;x.classList.toggle("hidden",!show);if(show)visible++;});if(count)count.textContent=visible+" VERIFIED ENTRY POINT"+(visible===1?"":"S")+" SHOWN";});});
var sourceNodes=Array.from(document.querySelectorAll("[data-source]")),description=document.querySelector("[data-source-description]"),sourceLink=document.querySelector("[data-source-link]");
var sources={
"plant":{desc:"48 PLANT developed a camera crew within its botanical broadcast. The initial version is still preserved in the specimen source and README.",url:"https://github.com/matchzimmerman/matchzimmerman.github.io/blob/main/MZTV/sources/48-plant-001/README.md",name:"48 PLANT README ↗"},
"mzcam":{desc:"MZCam was extracted into MZTV/lib/mzcam.js as a shared camera, flight, framing and direction system. The module README identifies its original host and subsequent use.",url:"https://github.com/matchzimmerman/matchzimmerman.github.io/blob/main/MZTV/lib/README.md",name:"MZCam module record ↗"},
"trackside":{desc:"TRACKSIDE uses MZCam with actual 2025 Silverstone racing data; its project README documents the camera logic and data-driven race replay.",url:"https://github.com/matchzimmerman/matchzimmerman.github.io/blob/main/MZTV/sources/bit-field-028-trackside/README.md",name:"TRACKSIDE source notes ↗"},
"sheepdog":{desc:"SHEEPDOG imports shared camera, herd and Galway geography modules, demonstrating a new simulation using an existing camera infrastructure.",url:"https://github.com/matchzimmerman/matchzimmerman.github.io/blob/main/MZTV/sources/bit-field-029-sheepdog/README.md",name:"SHEEPDOG source notes ↗"}
};
sourceNodes.forEach(function(n){n.addEventListener("click",function(){var s=sources[n.dataset.source];if(!s||!description||!sourceLink)return;description.textContent=s.desc;sourceLink.href=s.url;sourceLink.textContent=s.name;sourceNodes.forEach(function(x){x.setAttribute("aria-pressed",String(n===x));});});});
function setBroadcastState(state){
var status=document.querySelector("[data-broadcast-status]"),label=document.querySelector("[data-broadcast-label]"),slot=document.querySelector("[data-player-slot]"),poster=document.querySelector("[data-offline-poster]");
if(!status||!label||!poster||!slot)return;
status.classList.toggle("online",state==="online");
label.textContent=state==="online"?"LIVE NOW":state==="offline"?"OFF AIR / ARCHIVE AVAILABLE":"PLAYER STATUS UNAVAILABLE";
var show=state!=="online";poster.classList.toggle("visible",show);poster.setAttribute("aria-hidden",String(!show));slot.hidden=show;
}
var player=document.querySelector("[data-player-slot]");
if(player){
var ready=false,playerScript=document.createElement("script");
playerScript.src="https://player.twitch.tv/js/embed/v1.js";playerScript.async=true;
playerScript.onload=function(){
 if(!window.Twitch||!Twitch.Player){setBroadcastState("unknown");return;}
 try{
  var instance=new Twitch.Player(player.id,{channel:"matchzimmerman",height:"100%",width:"100%",autoplay:false,muted:true,parent:[location.hostname]});
  instance.addEventListener(Twitch.Player.ONLINE,function(){ready=true;setBroadcastState("online");});
  instance.addEventListener(Twitch.Player.OFFLINE,function(){ready=true;setBroadcastState("offline");});
  setTimeout(function(){if(!ready)setBroadcastState("unknown");},10000);
 }catch(e){setBroadcastState("unknown");}
};
playerScript.onerror=function(){setBroadcastState("unknown");};document.head.appendChild(playerScript);
}
})();