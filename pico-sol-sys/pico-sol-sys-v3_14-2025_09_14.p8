pico-8 cartridge // http://www.pico-8.com
version 43
__lua__
//pico-8 cartridge // http://www.pico-8.com
//version 42
//__lua__
-- solar system (v3.14) - 2025-09-14
-- "dynamic starfield & comet glow"
-- controls:
-- 🅾️(z): neon palette toggle
-- ❎(x): toggle labels
-- ヌ●➡️/ヌ●⧗ : time speed (capped at 1x)
-- ヌ●…/ヌ●★ : tilt adjustment

-----------------------
-- build metadata
-----------------------
build_date="2025-09-14"
build_tag ="v3.14"

-----------------------
-- globals
-----------------------
cx,cy=64,64
time=0
dt_scale=1      -- capped at 1.0 max
tilt=0.35
show_labels=true
neon=false

-----------------------
-- palette helpers
-----------------------
function pal_neon(on)
 if on then
  pal(7,14,1)  -- white ヌ●★ pink
  pal(6,12,1)  -- gray ヌ●★ cyan
  pal(11,11,1) -- yellow stays
  pal(10,11,1) -- green ヌ●★ yellow
  pal(8,13,1)  -- red ヌ●★ orange
 else
  pal() -- reset
 end
end

-----------------------
-- math helpers
-----------------------
function clamp(x,a,b) return max(a,min(b,x)) end
function lerp(a,b,t) return a+(b-a)*t end

-----------------------
-- dynamic starfield
-----------------------
stars={}
function make_stars(n)
 stars={}
 for i=1,n do
  add(stars,{
    x=rnd(128),
    y=rnd(128),
    layer=flr(rnd(3))+1,
    drift=rnd(0.05),
    tw=rnd(1)
  })
 end
end

function update_stars()
 for s in all(stars) do
  s.x=(s.x+s.drift)%128
 end
end

function draw_stars()
 for s in all(stars) do
  local tw = 0.5+0.5*sin(time*0.02 + s.tw*3.14)
  local c = 5 + s.layer
  if tw>0.6 then
    pset(s.x,s.y,c)
  else
    pset(s.x,s.y,1)
  end
 end
end

-----------------------
-- body model
-----------------------
bodies={
 {name="sol",a=0,r=7,col=8,speed=0,ph=0},
 {name="ter",a=26,r=2,col=12,speed=0.014,ph=0.9},
 {name="mar",a=33,r=2,col=9, speed=0.011,ph=0.2},
 {name="sat",a=50,r=4,col=11,speed=0.008,ph=0.6,ring=true,ring_r1=6,ring_r2=11,ring_col=6}
}

for b in all(bodies) do
 b.tr={}
end

-----------------------
-- comet with glow
-----------------------
comet={
 a=74, b=36, r=1, col=7,
 speed=0.03, ph=0,
 tr={}
}

function reset_comet()
 comet.ph=0
 comet.tr={}
end

-----------------------
-- drawing helpers
-----------------------
function world_pos(a,angle,phase)
 local ang = angle+phase
 local x = cx + a*cos(ang)
 local y = cy + a*sin(ang)*(1-tilt)
 return x,y
end

function push_trail(tr,x,y,maxn)
 add(tr,{x=x,y=y})
 if #tr>maxn then deli(tr,1) end
end

function draw_trail(tr,c)
 local n=#tr
 for i=1,n-1 do
  local a=i/n
  local col=(a>0.8) and c or 5
  line(tr[i].x,tr[i].y,tr[i+1].x,tr[i+1].y,col)
 end
end

function draw_orbit(a,c)
 local pulse = neon and (0.5+0.5*sin(time*0.03)) or 1
 for t=0,1,0.01 do
  local x=cx+a*cos(t*6.283)
  local y=cy+a*sin(t*6.283)*(1-tilt)
  if t%0.02<0.01 then
    pset(x,y,(pulse>0.8) and c or 5)
  end
 end
end

-----------------------
-- comet glow
-----------------------
function draw_comet_glow(x,y)
 circ(x,y,3,6) -- soft halo
end

-----------------------
-- ui
-----------------------
function hud()
 print("\#6solar system  "..build_tag.."  "..build_date,2,2,11)
 print("ヌ●➡️/ヌ●⧗ time  ヌ●…/ヌ●★ tilt  z neon  x labels",2,116,5)
end

-----------------------
-- init/update/draw
-----------------------
function _init()
 make_stars(64)
end

function handle_input()
 if btnp(4) then neon=not neon end
 if btnp(5) then show_labels=not show_labels end
 if btn(2) then dt_scale=clamp(dt_scale+0.02,0.2,1.0) end
 if btn(3) then dt_scale=clamp(dt_scale-0.02,0.2,1.0) end
 if btn(0) then tilt=clamp(tilt+0.01,0,0.85) end
 if btn(1) then tilt=clamp(tilt-0.01,0,0.85) end
end

function _update60()
 handle_input()
 time+=0.5*dt_scale
 update_stars()

 for b in all(bodies) do
  local x,y=world_pos(b.a,time*b.speed,b.ph)
  push_trail(b.tr,x,y,32)
 end

 local ang = time*comet.speed + comet.ph
 local x = cx + comet.a*cos(ang)
 local y = cy + comet.b*sin(ang)*(1-tilt)
 push_trail(comet.tr,x,y,48)
end

function _draw()
 cls(0)
 pal_neon(neon)
 draw_stars()

 for b in all(bodies) do
  if b.a>0 then draw_orbit(b.a,1) end
 end

 -- sun
 local sun=bodies[1]
 circfill(cx,cy,sun.r,sun.col)

 -- planets
 for i=2,#bodies do
  local b=bodies[i]
  local x,y=world_pos(b.a,time*b.speed,b.ph)
  draw_trail(b.tr,6)
  circfill(x,y,b.r,b.col)
  if show_labels then print(b.name,x+4,y-3,7) end
 end

 -- comet
 local cx1=comet.tr[#comet.tr] and comet.tr[#comet.tr].x or cx
 local cy1=comet.tr[#comet.tr] and comet.tr[#comet.tr].y or cy
 draw_comet_glow(cx1,cy1)
 draw_trail(comet.tr,7)
 circfill(cx1,cy1,comet.r,7)
 if show_labels then print("com",cx1+3,cy1-3,6) end

 hud()
 pal()
end
__gfx__
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00700700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00077000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00077000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00700700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
