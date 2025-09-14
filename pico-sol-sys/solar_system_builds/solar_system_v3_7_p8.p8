pico-8 cartridge // http://www.pico-8.com
version 42
__lua__
-- solar_system_v3.7.p8
-- changelog: saturn rings + parallax starfield

function _init()
    sun = {x=64, y=64, r=8, base_color=10, glow_color=9, pulse=0}
    planets = {
        {name="Mercury", dist=15, size=1, speed=0.03, angle=0, color=7},
        {name="Venus", dist=22, size=2, speed=0.02, angle=0, color=9},
        {name="Earth", dist=30, size=2, speed=0.018, angle=0, color=12},
        {name="Mars", dist=38, size=2, speed=0.015, angle=0, color=8},
        {name="Jupiter", dist=50, size=4, speed=0.01, angle=0, color=6},
        {name="Saturn", dist=60, size=3, speed=0.008, angle=0, color=11, rings=true},
        {name="Uranus", dist=68, size=3, speed=0.006, angle=0, color=13},
        {name="Neptune", dist=76, size=3, speed=0.004, angle=0, color=1}
    }
    trails = {}
    trail_length = 25
    orbit_pulse = 0
    stars = {}
    for i=1,40 do
        add(stars, {x=flr(rnd(128)), y=flr(rnd(128)), speed=0.2+rnd(0.4), c=5+rnd(2)})
    end
end

function _update60()
    update_planets()
    update_sun()
    update_stars()
    orbit_pulse += 0.02
end

function update_planets()
    for p in all(planets) do
        p.angle += p.speed
        p.x = sun.x + cos(p.angle) * p.dist
        p.y = sun.y + sin(p.angle) * p.dist
        add_trail(p.x, p.y, p.color)
    end
end

function update_sun()
    sun.pulse += 0.05
end

function update_stars()
    for s in all(stars) do
        s.x += s.speed * 0.05
        if s.x > 128 then s.x = 0 end
    end
end

function add_trail(x, y, c)
    add(trails, {x=x, y=y, c=c, alpha=1})
    if #trails > 150 then
        deli(trails,1)
    end
end

function draw_trails()
    for t in all(trails) do
        circfill(t.x, t.y, 1, t.c)
        t.alpha -= 0.03
        if t.alpha <= 0 then
            del(trails, t)
        end
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

function draw_planet(p)
    local dist_from_center = sqrt((p.x-64)^2 + (p.y-64)^2)
    if dist_from_center < 20 then
        print(p.name, p.x + 4, p.y - 4, p.color)
    end
    local dist_from_sun = sqrt((p.x-sun.x)^2 + (p.y-sun.y)^2)
    if dist_from_sun < sun.r + 3 then
        circfill(p.x, p.y, p.size+1, 7)
    end
    if p.rings then
        for r=1,2 do
            circ(p.x, p.y, p.size+2+r, 5+r%2)
        end
    end
    circfill(p.x, p.y, p.size, p.color)
end

function draw_stars()
    for s in all(stars) do
        pset(s.x, s.y, s.c)
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
end

function _draw()
    cls()
    draw_stars()
    draw_sun()
    draw_orbits()
    draw_trails()
    for p in all(planets) do
        draw_planet(p)
    end
    draw_ui()
end
