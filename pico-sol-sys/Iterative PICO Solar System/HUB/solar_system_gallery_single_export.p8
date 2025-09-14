pico-8 cartridge // http://www.pico-8.com
version 42
__lua__
-- solar_system_gallery_single_export.p8
-- one-cart gallery of all builds (v3.3..v3.12) for web export
-- design: single engine + per-version config flags; no load()

--------------- core state ---------------
mode="menu"  -- "menu" | "play"
sel=1
t=0

-- globals populated by apply_cfg()
CFG=nil

-- data containers used by engine
sun={}
planets={}
stars_far={}
stars_near={}
trails={}        -- planet trails
comet=nil        -- comet state
orbit_pulse=0

--------------- util ---------------
function rndr(a,b) return a+rnd(b-a) end
function clamp(x,a,b) return max(a,min(b,x)) end

function print_shadow(s,x,y,c)
  print(s,x+1,y+1,0)
  print(s,x,y,c)
end

--------------- version table ---------------
-- each entry describes a "build" feel; the engine uses flags
versions={
 -- v3.3: trails + neon ui
 {name="v3.3  trails + neon", trails="basic", sun_pulse=false, orbit_pulse=false, center_labels=false, rings=false, stars=0, comet=0, moons=false, ui_distance=false, ui_speedbars=false, comet_highlight=false},
 -- v3.4: pulsating sun + smoother trail fade
 {name="v3.4  pulse sun", trails="fade", sun_pulse=true,  orbit_pulse=false, center_labels=false, rings=false, stars=0, comet=0, moons=false, ui_distance=false, ui_speedbars=false, comet_highlight=false},
 -- v3.5: planet glow + fading orbits
 {name="v3.5  glow + orbit lines", trails="fade", sun_pulse=true, orbit_pulse=true, center_labels=false, rings=false, stars=0, comet=0, moons=false, ui_distance=false, ui_speedbars=false, comet_highlight=false},
 -- v3.6: labels at center + softer trails
 {name="v3.6  labels + soft trails", trails="fade", sun_pulse=true, orbit_pulse=true, center_labels=true, rings=false, stars=0, comet=0, moons=false, ui_distance=false, ui_speedbars=false, comet_highlight=false},
 -- v3.7: saturn rings + parallax stars
 {name="v3.7  rings + parallax", trails="fade", sun_pulse=true, orbit_pulse=true, center_labels=true, rings=true, stars=1, comet=0, moons=false, ui_distance=false, ui_speedbars=false, comet_highlight=false},
 -- v3.8: comet + twinkle
 {name="v3.8  comet + twinkle", trails="fade", sun_pulse=true, orbit_pulse=true, center_labels=true, rings=true, stars=2, comet=1, moons=false, ui_distance=false, ui_speedbars=false, comet_highlight=false},
 -- v3.9: moons + gradient tail
 {name="v3.9  moons + gradient tail", trails="fade", sun_pulse=true, orbit_pulse=true, center_labels=true, rings=true, stars=2, comet=2, moons=true, ui_distance=false, ui_speedbars=false, comet_highlight=false},
 -- v3.10: random comet + proximity glow + layered stars
 {name="v3.10 comet chaos + glow", trails="fade", sun_pulse=true, orbit_pulse=true, center_labels=true, rings=true, stars=2, comet=3, moons=true, ui_distance=false, ui_speedbars=false, comet_highlight=true},
 -- v3.11: UI distances + smoother motion
 {name="v3.11 ui distances + smooth", trails="fade", sun_pulse=true, orbit_pulse=true, center_labels=false, rings=true, stars=2, comet=3, moons=true, ui_distance=true, ui_speedbars=false, comet_highlight=true},
 -- v3.12: comet reset + speed bars
 {name="v3.12 comet reset + bars", trails="fade", sun_pulse=true, orbit_pulse=true, center_labels=false, rings=true, stars=2, comet=4, moons=true, ui_distance=true, ui_speedbars=true, comet_highlight=true}
}

--------------- config application ---------------
function apply_cfg(idx)
  CFG=versions[idx]
  -- reset engine state
  sun = {x=64,y=64,r=8, base_color=10, glow_color=9, pulse=0}
  planets = {
    {name="Mercury", dist=15, size=1, speed=0.03, angle=0, color=7},
    {name="Venus",   dist=22, size=2, speed=0.02, angle=0, color=9},
    {name="Earth",   dist=30, size=2, speed=0.018,angle=0, color=12},
    {name="Mars",    dist=38, size=2, speed=0.015,angle=0, color=8},
    {name="Jupiter", dist=50, size=4, speed=0.01, angle=0, color=6, moons=3},
    {name="Saturn",  dist=60, size=3, speed=0.008,angle=0, color=11, rings=true, moons=2},
    {name="Uranus",  dist=68, size=3, speed=0.006,angle=0, color=13},
    {name="Neptune", dist=76, size=3, speed=0.004,angle=0, color=1}
  }
  trails = {}
  stars_far,stars_near = {},{}
  if CFG.stars>=1 then
    for i=1,20 do add(stars_far,{x=flr(rnd(128)),y=flr(rnd(128)),speed=0.1,c=5}) end
  end
  if CFG.stars>=2 then
    for i=1,20 do add(stars_near,{x=flr(rnd(128)),y=flr(rnd(128)),speed=0.3,c=7}) end
  end
  orbit_pulse=0
  if CFG.comet>0 then
    comet={x=-20,y=40,dx=0.5,dy=0.2,color=7,trail={},trail_length=40}
  else
    comet=nil
  end
  t=0
end

--------------- input helpers ---------------
function any_key()
  for i=0,5 do if(btnp(i)) return true end end
  return false
end

--------------- lifecycle ---------------
function _init()
  apply_cfg(sel)
  mode="menu"
  menuitem(1,"back to menu",function() mode="menu" end)
end

function _update60()
  if mode=="menu" then
    if btnp(2) then sel=max(1,sel-1) end
    if btnp(3) then sel=min(#versions,sel+1) end
    if btnp(5) then
      apply_cfg(sel)
      mode="play"
    end
    return
  end

  -- play mode
  t+=1/60

  -- input: comet reset in v3.12 config
  if comet and CFG.comet>=4 and btnp(4) then reset_comet() end

  -- update systems (1x cap implied by fixed timestep)
  update_sun()
  update_stars(stars_far)
  update_stars(stars_near)
  update_planets()
  if comet then update_comet() end
  orbit_pulse += 0.02
end

function _draw()
  cls(0)
  if mode=="menu" then
    draw_menu()
    return
  end

  -- scene
  draw_starfield(stars_far)
  draw_starfield(stars_near)
  draw_sun()
  if CFG.orbit_pulse then draw_orbits() end
  if CFG.trails~="none" then draw_planet_trails() end
  for p in all(planets) do draw_planet(p) end
  if comet then draw_comet() end
  draw_ui()
end

--------------- menu ---------------
function draw_menu()
  rectfill(0,0,33,127,1)
  line(33,0,33,127,11)
  print_shadow("solar",3,4,11)
  print_shadow("system",3,12,11)
  print_shadow("gallery",3,20,10)
  print_shadow("❎ play",3,108,12)

  print("select a build",40,6,6)
  for k=1,#versions do
    local y=14+k*10
    local caret = k==sel and ">" or " "
    local col = k==sel and 7 or 6
    print(caret.." "..versions[k].name,40,y,col)
  end
  print("↑/↓ choose   ❎ start",40,118,5)
end

--------------- updates ---------------
function update_sun()
  if CFG.sun_pulse then
    sun.pulse += 0.05
  end
end

function update_stars(layer)
  for s in all(layer) do
    s.x += s.speed*0.05
    if s.x>128 then s.x=0 end
  end
end

function update_planets()
  for p in all(planets) do
    local speed = CFG.name=="v3.11 ui distances + smooth" or CFG.name=="v3.12 comet reset + bars" and p.speed*0.98 or p.speed
    p.angle = (p.angle + speed)
    p.x = sun.x + cos(p.angle)*p.dist
    p.y = sun.y + sin(p.angle)*p.dist

    if CFG.trails=="basic" then
      add_trail_point(p.x,p.y,p.color,10)
    elseif CFG.trails=="fade" then
      add_trail_point(p.x,p.y,p.color,25)
    end
  end
end

--------------- trails ---------------
function add_trail_point(x,y,c,maxlen)
  add(trails,{x=x,y=y,c=c,life=1})
  if #trails> (CFG.trails=="basic" and 100 or 150) then
    deli(trails,1)
  end
end

function draw_planet_trails()
  for t in all(trails) do
    local col=t.c
    pset(t.x,t.y,col)
  end
end

--------------- comet ---------------
function update_comet()
  comet.x += comet.dx
  comet.y += comet.dy

  -- trail storage
  add(comet.trail,{x=comet.x,y=comet.y})
  if #comet.trail > comet.trail_length then
    deli(comet.trail,1)
  end

  -- respawn logic per version
  if comet.x>140 or comet.y>140 then
    reset_comet()
  end
end

function reset_comet()
  comet.x=-20
  comet.y=flr(rnd(128))
  -- behaviors
  if CFG.comet>=3 then
    comet.dx = 0.4 + rnd(0.3)
    comet.dy = -0.1 + rnd(0.4)
  else
    comet.dx = 0.5
    comet.dy = 0.2
  end
  comet.trail={}
end

function draw_comet()
  -- head
  circfill(comet.x,comet.y,2,7)
  -- tail by version
  if CFG.comet==1 then
    for i=1,#comet.trail do
      local n=comet.trail[i]
      pset(n.x,n.y,7)
    end
  elseif CFG.comet>=2 then
    for i=1,#comet.trail do
      local n=comet.trail[i]
      local fade=i/#comet.trail
      local col = (fade>0.5) and 7 or 12 -- white->blue
      pset(n.x,n.y,col)
    end
  end
end

--------------- drawing helpers ---------------
function draw_sun()
  if CFG.sun_pulse then
    local pulse = 1+sin(sun.pulse)*1.5
    circfill(sun.x,sun.y,sun.r+pulse,9)
  end
  circfill(sun.x,sun.y,sun.r,10)
end

function draw_orbits()
  local step = 5 + flr((0.5+0.5*sin(orbit_pulse))*2)
  for p in all(planets) do
    circ(sun.x,sun.y,p.dist,step)
  end
end

function planet_near_sun(p)
  local dx,dy=p.x-sun.x,p.y-sun.y
  return (dx*dx+dy*dy) < (sun.r+3)^2
end

function comet_near_planet(p)
  if not comet or not CFG.comet_highlight then return false end
  local dx,dy=p.x-comet.x,p.y-comet.y
  return (dx*dx+dy*dy) < 100
end

function draw_moons(p)
  if not CFG.moons or not p.moons then return end
  for i=1,p.moons do
    local a=p.angle+i*0.5
    pset(p.x+cos(a)*(p.size+3+i), p.y+sin(a)*(p.size+3+i),7)
  end
end

function draw_planet(p)
  -- optional name label near screen center
  if CFG.center_labels then
    local dx,dy=p.x-64,p.y-64
    if (dx*dx+dy*dy) < 20*20 then
      print(p.name,p.x+4,p.y-4,p.color)
    end
  end

  -- glow near sun
  if planet_near_sun(p) then
    circfill(p.x,p.y,p.size+1,7)
  end

  -- saturn rings
  if CFG.rings and p.rings then
    for r=1,2 do circ(p.x,p.y,p.size+2+r, 5+r%2) end
  end

  -- comet proximity highlight
  local col = comet_near_planet(p) and 7 or p.color
  circfill(p.x,p.y,p.size,col)

  draw_moons(p)
end

--------------- UI ---------------
function draw_ui()
  -- neon-left text UI
  rectfill(0,0,30,127,0)
  line(30,0,30,127,11)
  print_shadow("solar",2,4,11)
  print_shadow("system",2,12,11)
  print_shadow("v:",2,20,10)
  print(versions[sel].name,2,28,7)

  local y=42
  for p in all(planets) do
    print(p.name,2,y,p.color) y+=6
    if CFG.ui_speedbars then
      local bar_len=p.speed*400
      rectfill(2,y,2+bar_len,y+1,p.color)
      y+=4
    end
    if CFG.ui_distance then
      print("d:"..flr(p.dist),2,y,6) y+=6
    end
  end

  if CFG.comet>=4 then
    print("o: reset comet",2,120,12)
  end
end
