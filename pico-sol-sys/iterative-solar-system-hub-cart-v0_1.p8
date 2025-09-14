pico-8 cartridge // http://www.pico-8.com
version 43
__lua__
-- solar_system_hub_dualkey.p8
-- hub accepts either ❎(X) or 🅾️(Z) to load

carts={
 {label="v3.3  trails + neon", file="solar_system_builds/solar_system_v3_3_p8.p8"},
 {label="v3.4  pulsating sun", file="solar_system_v3_4.p8"},
 {label="v3.5  glow + orbits", file="solar_system_v3_5.p8"},
 {label="v3.6  labels + trails", file="solar_system_v3.6.p8"},
 {label="v3.7  rings + stars", file="solar_system_v3.7.p8"},
 {label="v3.8  comet + twinkle", file="solar_system_v3.8.p8"},
 {label="v3.9  moons + gradient", file="solar_system_v3.9.p8"},
 {label="v3.10 comet chaos", file="solar_system_v3.10.p8"},
 {label="v3.11 ui distances", file="solar_system_v3.11.p8"},
 {label="v3.12 comet reset + bars", file="solar_system_v3.12.p8"}
}

sel=1
blink=0

function _update60()
  blink+=1
  if btnp(2) then sel=max(1,sel-1) end -- up
  if btnp(3) then sel=min(#carts,sel+1) end -- down
  -- accept either key: ❎ (btn 5, keyboard X) OR 🅾️ (btn 4, keyboard Z)
  if btnp(5) or btnp(4) then
    load(carts[sel].file)
  end
end

function _draw()
  cls(0)
  print("solar system // weekly builds", 20, 10, 11)
  for i=1,#carts do
    local y=22+i*10
    local caret = (i==sel and (blink%30<15) and ">" or " ")
    local col = (i==sel) and 7 or 6
    print(caret.." "..carts[i].label, 28, y, col)
  end
  print("press X (❎) or Z (🅾️) to load", 18, 118, 12)
end
