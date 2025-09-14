pico-8 cartridge // http://www.pico-8.com
version 42
__lua__
-- solar_system_v3.10.p8
-- dynamic comet behavior, planet highlight, parallax starfield

function _init()
    sun = {x=64, y=64, r=8, base_color=10, glow_color=9, pulse=0}
    planets = {
        {name="Mercury", dist=15, size=1, speed=0.03, angle=0, color=7},
        {name="Venus", dist=22, size=2, speed=0.02, angle=0, color=9},
        {name="Earth", dist=30, size=2, speed=0.018, angle=0, color=12},
        {name="Mars", dist=38, size=2, speed=0.015, angle=0, color=8},
        {name="Jupiter", dist=50, size=4, speed=0.01, angle=0, color=6, moons=3},
        {name="Saturn", dist=60, size=3, speed=0.008, angle=0, color=11, rings=true, moons=2},
        {name="Uranus", dist=68, size=3, speed=0.006, angle=0, color=13},
        {name="Neptune", dist=76, size=3, speed=0.004, angle=0, color=1}
    }
    comet = {x=-20, y=40, dx=0.5, dy=0.2, color=7, trail={}, trail_length=40}
    trails = {}
    stars_far = {}
    stars_near = {}
    for i=1,20 do add(stars_far, {x=flr(rnd(128)), y=flr(rnd(128)), speed=0.1, c=5}) end
    for i=1,20 do add(stars_near, {x=flr(rnd(128)), y=flr(rnd(128)), speed=0.3, c=7}) end
    orbit_pulse = 0
end

function _update60()
    update_planets()
    update_sun()
    update_stars(stars_far)
    update_stars(stars_near)
    update_comet()
    orbit_pulse += 0.02
end

function update_planets()
    for p in all(planets) do
        p.angle += p.speed
        p.x = sun.x + cos(p.angle)*p.dist
        p.y = sun.y + sin(p.angle)*p.dist
    end
end

function update_sun() sun.pulse += 0.05 end

function update_stars(layer)
    for s in all(layer) do
        s.x += s.speed*0.05
        if s.x > 128 then s.x = 0 end
    end
end

function update_comet()
    comet.x += comet.dx
    comet.y += comet.dy
    add_comet_trail(comet.x, comet.y, comet.trail, comet.trail_length)
    if comet.x > 140 or comet.y > 140 then
        comet.x = -20
        comet.y = flr(rnd(128))
        comet.dx = 0.4 + rnd(0.3)
        comet.dy = -0.1 + rnd(0.4)
    end
end

function add_comet_trail(x, y, container, max_len)
    add(container, {x=x, y=y, t=0})
    if #container > max_len then deli(container,1) end
end

function draw_comet_trail(container)
    for i,t in pairs(container) do
        local fade = max(0, 1 - (i/#container))
        local col = fade > 0.5 and 7 or 12
        circfill(t.x, t.y, 1, col)
    end
end

function draw_sun()
    local pulse_size = 1 + sin(sun.pulse)*1.5
    circfill(sun.x, sun.y, sun.r + pulse_size, sun.glow_color)
    circfill(sun.x, sun.y, sun.r, sun.base_color)
end

function draw_orbits()
    local alpha = 0.5 + 0.5*sin(orbit_pulse)
    local step = flr(alpha*8)
    for p in all(planets) do circ(sun.x, sun.y, p.dist, step) end
end

function draw_moons(p)
    if not p.moons then return end
    for i=1,p.moons do
        local a = p.angle + (i*0.5)
        pset(p.x + cos(a)*(p.size+3+i), p.y + sin(a)*(p.size+3+i), 7)
    end
end

function comet_proximity_highlight(p)
    local dx,dy = p.x-comet.x, p.y-comet.y
    return (dx*dx+dy*dy) < 100
end

function draw_planet(p)
    local c = comet_proximity_highlight(p) and 7 or p.color
    if p.rings then for r=1,2 do circ(p.x,p.y,p.size+2+r,5+r%2) end end
    circfill(p.x, p.y, p.size, c)
    draw_moons(p)
end

function draw_comet()
    circfill(comet.x, comet.y, 2, 7)
    draw_comet_trail(comet.trail)
end

function draw_starfield(layer) for s in all(layer) do pset(s.x, s.y, s.c) end end

function draw_ui()
    rectfill(0,0,30,127,0)
    line(30,0,30,127,8)
    local y=4
    for p in all(planets) do print(p.name,2,y,p.color) y+=8 end
    print("comet",2,y,7)
end

function _draw()
    cls()
    draw_starfield(stars_far)
    draw_starfield(stars_near)
    draw_sun()
    draw_orbits()
    for p in all(planets) do draw_planet(p) end
    draw_comet()
    draw_ui()
end
