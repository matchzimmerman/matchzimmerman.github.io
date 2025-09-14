pico-8 cartridge // http://www.pico-8.com
version 42
__lua__
-- solar_system_v3.4.p8
-- changelog: pulsating sun + smoother trail fade

function _init()
    sun = {x=64, y=64, r=8, base_color=10, glow_color=9, pulse=0}
    planets = {
        {name="Mercury", dist=15, size=1, speed=0.03, angle=0, color=7},
        {name="Venus", dist=22, size=2, speed=0.02, angle=0, color=9},
        {name="Earth", dist=30, size=2, speed=0.018, angle=0, color=12},
        {name="Mars", dist=38, size=2, speed=0.015, angle=0, color=8},
        {name="Jupiter", dist=50, size=4, speed=0.01, angle=0, color=6},
        {name="Saturn", dist=60, size=3, speed=0.008, angle=0, color=11},
        {name="Uranus", dist=68, size=3, speed=0.006, angle=0, color=13},
        {name="Neptune", dist=76, size=3, speed=0.004, angle=0, color=1}
    }
    trails = {}
    trail_length = 20
end

function update_planets()
    for p in all(planets) do
        p.angle += p.speed
        local x = sun.x + cos(p.angle)*p.dist
        local y = sun.y + sin(p.angle)*p.dist
        add_trail(x, y, p.color)
        p.x = x
        p.y = y
    end
end

function add_trail(x, y, c)
    add(trails, {x=x, y=y, c=c, life=trail_length})
    if #trails > 150 then
        deli(trails,1)
    end
end

function draw_trails()
    for t in all(trails) do
        circfill(t.x, t.y, 1, t.c)
        t.life -= 1
        if t.life <= 0 then
            del(trails, t)
        end
    end
end

function update_sun()
    sun.pulse += 0.05
end

function draw_sun()
    local pulse_size = 1 + sin(sun.pulse)*1.5
    circfill(sun.x, sun.y, sun.r + pulse_size, sun.glow_color)
    circfill(sun.x, sun.y, sun.r, sun.base_color)
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

function _update60()
    update_planets()
    update_sun()
end

function _draw()
    cls()
    draw_sun()
    draw_trails()
    for p in all(planets) do
        circfill(p.x, p.y, p.size, p.color)
    end
    draw_ui()
end
