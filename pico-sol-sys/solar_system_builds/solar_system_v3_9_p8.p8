pico-8 cartridge // http://www.pico-8.com
version 42
__lua__
-- solar_system_v3.9.p8
-- moons for jupiter/saturn, orbit glow, comet trail gradient

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
    stars = {}
    for i=1,40 do
        add(stars, {x=flr(rnd(128)), y=flr(rnd(128)), speed=0.2+rnd(0.4), c=5+rnd(2), twinkle=rnd(1)})
    end
    orbit_pulse = 0
end

function _update60()
    update_planets()
    update_sun()
    update_stars()
    update_comet()
    orbit_pulse += 0.02
end

function update_planets()
    for p in all(planets) do
        p.angle += p.speed
        p.x = sun.x + cos(p.angle)*p.dist
        p.y = sun.y + sin(p.angle)*p.dist
        add_trail(p.x, p.y, p.color, trails, 150)
    end
end

function update_sun()
    sun.pulse += 0.05
end

function update_stars()
    for s in all(stars) do
        s.x += s.speed*0.05
        s.twinkle += 0.02
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
    end
end

function add_comet_trail(x, y, container, max_len)
    add(container, {x=x, y=y, t=0})
    if #container > max_len then
        deli(container,1)
    end
end

function add_trail(x, y, c, container, max_len)
    add(container, {x=x, y=y, c=c, alpha=1})
    if #container > max_len then
        deli(container,1)
    end
end

function draw_trails(container)
    for t in all(container) do
        circfill(t.x, t.y, 1, t.c)
        t.alpha -= 0.02
        if t.alpha <= 0 then
            del(container, t)
        end
    end
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
    for p in all(planets) do
        circ(sun.x, sun.y, p.dist, step)
    end
end

function draw_moons(p)
    if not p.moons then return end
    for i=1,p.moons do
        local moon_angle = p.angle + (i*0.5)
        local moon_x = p.x + cos(moon_angle)*(p.size+3+i)
        local moon_y = p.y + sin(moon_angle)*(p.size+3+i)
        pset(moon_x, moon_y, 7)
    end
end

function draw_planet(p)
    if p.rings then
        for r=1,2 do
            circ(p.x, p.y, p.size+2+r, 5+r%2)
        end
    end
    circfill(p.x, p.y, p.size, p.color)
    draw_moons(p)
end

function draw_comet()
    circfill(comet.x, comet.y, 2, 7)
    draw_comet_trail(comet.trail)
end

function draw_stars()
    for s in all(stars) do
        local twinkle_brightness = s.c + flr(sin(s.twinkle)*2)
        pset(s.x, s.y, twinkle_brightness)
    end
end

function draw_ui()
    rectfill(0, 0, 30, 127, 0)
    line(30, 0, 30, 127, 8)
    local y = 4
    for p in all(planets) do
        print(p.name, 2, y, p.color)
        y += 8
    end
    print("comet", 2, y, 7)
end

function _draw()
    cls()
    draw_stars()
    draw_sun()
    draw_orbits()
    draw_trails(trails)
    for p in all(planets) do
        draw_planet(p)
    end
    draw_comet()
    draw_ui()
end
