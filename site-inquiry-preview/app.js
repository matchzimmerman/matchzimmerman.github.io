(function(){
"use strict";
const menu=document.querySelector("[data-menu]"),nav=document.querySelector("[data-nav]");
if(menu&&nav){menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));menu.textContent=open?"CLOSE":"MENU";});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.textContent="MENU";}));}
document.querySelectorAll("[data-launch]").forEach(btn=>btn.addEventListener("click",()=>{
const wrap=btn.closest(".image");if(!wrap)return;
const url=btn.getAttribute("data-src");
if(!url||!/^https:\/\/www\.matchzimmerman\.com\/MZTV\/sources\//.test(url))return;
const iframe=document.createElement("iframe");
iframe.src=url;iframe.title=btn.getAttribute("data-title")||"Interactive MZTV preview";
iframe.loading="lazy";iframe.allow="autoplay";iframe.setAttribute("sandbox","allow-scripts allow-same-origin allow-pointer-lock allow-popups");
iframe.style.cssText="width:100%;height:100%;position:absolute;inset:0;border:0;background:#19231c";
wrap.innerHTML="";wrap.appendChild(iframe);
}));
const host=document.querySelector("[data-twitch-player]");
if(host&&window.location.protocol==="https:"){
const script=document.createElement("script");script.src="https://player.twitch.tv/js/embed/v1.js";script.async=true;
script.onload=()=>{
 if(!window.Twitch?.Player)return;
 try{const player=new Twitch.Player(host.id,{channel:"matchzimmerman",width:"100%",height:"100%",autoplay:false,muted:true,parent:[location.hostname]});
 const indicator=document.querySelector("[data-live]");
 if(indicator){player.addEventListener(Twitch.Player.ONLINE,()=>{indicator.classList.add("online");indicator.querySelector("[data-status]").textContent="LIVE";});
 player.addEventListener(Twitch.Player.OFFLINE,()=>{indicator.classList.remove("online");indicator.querySelector("[data-status]").textContent="OFFLINE";});}
 }catch(e){}
};document.head.appendChild(script);
}
})();