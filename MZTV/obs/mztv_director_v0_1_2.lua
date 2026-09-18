-- MZTV Director v0.1.2
-- A conservative OBS Lua layout director for two existing sources.
-- Load via OBS: Tools -> Scripts -> + -> select this file.
--
-- Compatibility note:
-- OBS alignment enum constants are not assumed. This version relies on
-- existing/default scene-item alignment and only changes position, bounds,
-- visibility, and bounds type.

obs = obslua

primary_name = ""
secondary_name = ""
canvas_w = 1920
canvas_h = 1080
run_director = false
micro_motion = true
intensity = 35
min_hold = 15
max_hold = 45

elapsed = 0.0
next_change = 20.0
phase = 0.0
current_layout = "FULL"
rng_seeded = false
primary_base_x = 0
primary_base_y = 0

function script_description()
    return [[
<h2>MZTV DIRECTOR v0.1.2</h2>
<p>Experimental layout conductor for MZTV.</p>
<p>Select a <b>Primary</b> and optional <b>Secondary</b> source that already exist in the current OBS scene.</p>
<p>The script can cut between full-frame, split, picture-in-picture, and detail layouts, with optional subtle motion.</p>
<p><b>Safety:</b> it does not delete scenes or sources.</p>
]]
end

local function seed_rng()
    if not rng_seeded then
        math.randomseed(os.time())
        math.random(); math.random(); math.random()
        rng_seeded = true
    end
end

local function source_list_property(props, key, label)
    local p = obs.obs_properties_add_list(
        props, key, label,
        obs.OBS_COMBO_TYPE_EDITABLE,
        obs.OBS_COMBO_FORMAT_STRING
    )

    local sources = obs.obs_enum_sources()
    if sources ~= nil then
        for _, src in ipairs(sources) do
            local name = obs.obs_source_get_name(src)
            if name ~= nil and name ~= "" then
                obs.obs_property_list_add_string(p, name, name)
            end
        end
        obs.source_list_release(sources)
    end
    return p
end

function script_defaults(settings)
    obs.obs_data_set_default_int(settings, "canvas_w", 1920)
    obs.obs_data_set_default_int(settings, "canvas_h", 1080)
    obs.obs_data_set_default_bool(settings, "micro_motion", true)
    obs.obs_data_set_default_bool(settings, "run_director", false)
    obs.obs_data_set_default_int(settings, "intensity", 35)
    obs.obs_data_set_default_int(settings, "min_hold", 15)
    obs.obs_data_set_default_int(settings, "max_hold", 45)
end

function script_properties()
    local props = obs.obs_properties_create()

    source_list_property(props, "primary_name", "PRIMARY source")
    source_list_property(props, "secondary_name", "SECONDARY source (optional)")

    obs.obs_properties_add_int(props, "canvas_w", "Canvas width", 320, 7680, 1)
    obs.obs_properties_add_int(props, "canvas_h", "Canvas height", 240, 4320, 1)

    obs.obs_properties_add_bool(props, "micro_motion", "Subtle continuous motion")
    obs.obs_properties_add_int_slider(props, "intensity", "Director intensity", 0, 100, 1)
    obs.obs_properties_add_int(props, "min_hold", "Minimum layout hold (sec)", 3, 600, 1)
    obs.obs_properties_add_int(props, "max_hold", "Maximum layout hold (sec)", 3, 1200, 1)

    obs.obs_properties_add_button(props, "full_btn", "FULL FIELD", full_field_clicked)
    obs.obs_properties_add_button(props, "split_btn", "70 / 30 SPLIT", split_clicked)
    obs.obs_properties_add_button(props, "pip_btn", "PROCESS PIP", pip_clicked)
    obs.obs_properties_add_button(props, "detail_btn", "DETAIL CROP", detail_clicked)
    obs.obs_properties_add_button(props, "jump_btn", "RANDOM JUMP CUT", jump_clicked)

    obs.obs_properties_add_bool(props, "run_director", "RUN GENERATIVE DIRECTOR")

    return props
end

function script_update(settings)
    primary_name = obs.obs_data_get_string(settings, "primary_name")
    secondary_name = obs.obs_data_get_string(settings, "secondary_name")
    canvas_w = obs.obs_data_get_int(settings, "canvas_w")
    canvas_h = obs.obs_data_get_int(settings, "canvas_h")
    micro_motion = obs.obs_data_get_bool(settings, "micro_motion")
    run_director = obs.obs_data_get_bool(settings, "run_director")
    intensity = obs.obs_data_get_int(settings, "intensity")
    min_hold = obs.obs_data_get_int(settings, "min_hold")
    max_hold = obs.obs_data_get_int(settings, "max_hold")

    if max_hold < min_hold then
        max_hold = min_hold
    end

    if next_change < 1 then
        next_change = min_hold
    end
end

local function get_current_scene_and_items()
    local scene_source = obs.obs_frontend_get_current_scene()
    if scene_source == nil then
        return nil, nil, nil, nil
    end

    local scene = obs.obs_scene_from_source(scene_source)
    if scene == nil then
        obs.obs_source_release(scene_source)
        return nil, nil, nil, nil
    end

    local pitem = nil
    local sitem = nil

    if primary_name ~= nil and primary_name ~= "" then
        pitem = obs.obs_scene_find_source(scene, primary_name)
    end
    if secondary_name ~= nil and secondary_name ~= "" then
        sitem = obs.obs_scene_find_source(scene, secondary_name)
    end

    return scene_source, scene, pitem, sitem
end

local function release_scene_source(scene_source)
    if scene_source ~= nil then
        obs.obs_source_release(scene_source)
    end
end

local function set_rect(item, x, y, w, h, outer)
    if item == nil then return end

    local pos = obs.vec2()
    pos.x = x
    pos.y = y

    local bounds = obs.vec2()
    bounds.x = w
    bounds.y = h

    if outer then
        obs.obs_sceneitem_set_bounds_type(item, obs.OBS_BOUNDS_SCALE_OUTER)
    else
        obs.obs_sceneitem_set_bounds_type(item, obs.OBS_BOUNDS_SCALE_INNER)
    end

    obs.obs_sceneitem_set_pos(item, pos)
    obs.obs_sceneitem_set_bounds(item, bounds)
    obs.obs_sceneitem_set_visible(item, true)
end

local function hide_item(item)
    if item ~= nil then
        obs.obs_sceneitem_set_visible(item, false)
    end
end

local function apply_full()
    local scene_source, scene, pitem, sitem = get_current_scene_and_items()
    if scene_source == nil then return end

    set_rect(pitem, 0, 0, canvas_w, canvas_h, true)
    primary_base_x = 0
    primary_base_y = 0
    hide_item(sitem)

    current_layout = "FULL"
    release_scene_source(scene_source)
end

local function apply_split()
    local scene_source, scene, pitem, sitem = get_current_scene_and_items()
    if scene_source == nil then return end

    local pw = math.floor(canvas_w * 0.70)
    local sw = canvas_w - pw

    set_rect(pitem, 0, 0, pw, canvas_h, true)
    primary_base_x = 0
    primary_base_y = 0
    set_rect(sitem, pw, 0, sw, canvas_h, true)

    current_layout = "SPLIT"
    release_scene_source(scene_source)
end

local function apply_reverse_split()
    local scene_source, scene, pitem, sitem = get_current_scene_and_items()
    if scene_source == nil then return end

    local sw = math.floor(canvas_w * 0.66)
    local pw = canvas_w - sw

    set_rect(sitem, 0, 0, sw, canvas_h, true)
    set_rect(pitem, sw, 0, pw, canvas_h, true)
    primary_base_x = sw
    primary_base_y = 0

    current_layout = "REVERSE_SPLIT"
    release_scene_source(scene_source)
end

local function apply_pip()
    local scene_source, scene, pitem, sitem = get_current_scene_and_items()
    if scene_source == nil then return end

    set_rect(pitem, 0, 0, canvas_w, canvas_h, true)
    primary_base_x = 0
    primary_base_y = 0

    if sitem ~= nil then
        local w = math.floor(canvas_w * 0.31)
        local h = math.floor(canvas_h * 0.31)
        local margin = math.floor(canvas_w * 0.025)
        set_rect(sitem, canvas_w - w - margin, canvas_h - h - margin, w, h, false)
    end

    current_layout = "PIP"
    release_scene_source(scene_source)
end

local function apply_detail()
    local scene_source, scene, pitem, sitem = get_current_scene_and_items()
    if scene_source == nil then return end

    local overscan = 1.16 + ((intensity / 100.0) * 0.18)
    local w = math.floor(canvas_w * overscan)
    local h = math.floor(canvas_h * overscan)
    local x = math.floor((canvas_w - w) * (0.35 + math.random() * 0.30))
    local y = math.floor((canvas_h - h) * (0.35 + math.random() * 0.30))

    set_rect(pitem, x, y, w, h, true)
    primary_base_x = x
    primary_base_y = y
    hide_item(sitem)

    current_layout = "DETAIL"
    release_scene_source(scene_source)
end

local function random_layout()
    seed_rng()

    local choices = {}
    table.insert(choices, apply_full)
    table.insert(choices, apply_full)
    table.insert(choices, apply_split)
    table.insert(choices, apply_pip)

    if intensity >= 25 then
        table.insert(choices, apply_detail)
    end
    if intensity >= 45 then
        table.insert(choices, apply_reverse_split)
        table.insert(choices, apply_detail)
    end
    if intensity >= 70 then
        table.insert(choices, apply_reverse_split)
        table.insert(choices, apply_detail)
    end

    local fn = choices[math.random(1, #choices)]
    fn()
end

function full_field_clicked(props, prop)
    apply_full()
    return true
end

function split_clicked(props, prop)
    apply_split()
    return true
end

function pip_clicked(props, prop)
    apply_pip()
    return true
end

function detail_clicked(props, prop)
    seed_rng()
    apply_detail()
    return true
end

function jump_clicked(props, prop)
    random_layout()
    return true
end

local function schedule_next_change()
    seed_rng()
    local lo = math.max(3, min_hold)
    local hi = math.max(lo, max_hold)
    next_change = lo + math.random() * (hi - lo)
    elapsed = 0.0
end

local function apply_micro_motion(dt)
    if not micro_motion then return end
    if primary_name == nil or primary_name == "" then return end

    local scene_source, scene, pitem, sitem = get_current_scene_and_items()
    if scene_source == nil then return end

    if pitem ~= nil then
        phase = phase + dt * (0.08 + (intensity / 100.0) * 0.08)

        local pos = obs.vec2()
        local amount = (intensity / 100.0) * 8.0
        pos.x = primary_base_x + math.sin(phase) * amount
        pos.y = primary_base_y + math.cos(phase * 0.73) * amount
        obs.obs_sceneitem_set_pos(pitem, pos)
    end

    release_scene_source(scene_source)
end

function script_tick(seconds)
    if micro_motion and intensity > 0 then
        apply_micro_motion(seconds)
    end

    if not run_director then
        return
    end

    elapsed = elapsed + seconds
    if elapsed >= next_change then
        random_layout()
        schedule_next_change()
    end
end

function script_load(settings)
    seed_rng()
    schedule_next_change()
end
