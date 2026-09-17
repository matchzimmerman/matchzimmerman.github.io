extends Node3D

const PlayerScript = preload("res://scripts/player.gd")
const MobileControlsScript = preload("res://scripts/mobile_controls.gd")
const BeaconScript = preload("res://scripts/beacon.gd")

const WORLD_HALF := 92.0
const TREE_COUNT := 260
const SEED := 170926

var rng := RandomNumberGenerator.new()
var player: CharacterBody3D
var beacon: AudioStreamPlayer3D
var beacon_light: OmniLight3D
var mobile_controls: Control
var desktop_hint: Label
var started := false
var horror_triggered := false
var elapsed := 0.0
var beacon_position := Vector3(34.0, 0.0, -28.0)

func _ready() -> void:
	rng.seed = SEED
	_build_environment()
	_build_ground()
	_build_forest()
	_build_beacon()
	_build_player()
	_build_ui()

func _process(delta: float) -> void:
	if not started or player == null:
		return
	elapsed += delta
	var dist := player.global_position.distance_to(beacon_position)

	if beacon_light:
		if dist < 34.0:
			var irregular := sin(elapsed * 10.7) + sin(elapsed * 27.3) * 0.45 + rng.randf_range(-0.18, 0.18)
			beacon_light.light_energy = max(0.0, 1.8 + irregular * 1.4)
		else:
			beacon_light.light_energy = 0.7 + sin(elapsed * 1.7) * 0.15

	if beacon and beacon.has_method("set_agitated"):
		beacon.set_agitated(dist < 18.0)

	if dist < 13.0 and not horror_triggered:
		horror_triggered = true
		player.trigger_horror_flicker(2.8)
		_show_message("SIGNAL FOUND", 2.2)

func _build_environment() -> void:
	var world_environment := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.002, 0.004, 0.005)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.025, 0.035, 0.042)
	env.ambient_light_energy = 0.34
	env.fog_enabled = true
	env.fog_light_color = Color(0.018, 0.025, 0.028)
	env.fog_light_energy = 0.55
	env.fog_density = 0.034
	world_environment.environment = env
	add_child(world_environment)

	var moon := DirectionalLight3D.new()
	moon.light_color = Color(0.23, 0.31, 0.38)
	moon.light_energy = 0.36
	moon.rotation_degrees = Vector3(-54.0, -32.0, 0.0)
	moon.shadow_enabled = false
	add_child(moon)

func _build_ground() -> void:
	var ground := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(WORLD_HALF * 2.2, WORLD_HALF * 2.2)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.018, 0.025, 0.021)
	mat.roughness = 1.0
	plane.material = mat
	ground.mesh = plane
	add_child(ground)

	var ground_body := StaticBody3D.new()
	var ground_collision := CollisionShape3D.new()
	var ground_shape := BoxShape3D.new()
	ground_shape.size = Vector3(WORLD_HALF * 2.2, 0.2, WORLD_HALF * 2.2)
	ground_collision.shape = ground_shape
	ground_collision.position.y = -0.1
	ground_body.add_child(ground_collision)
	add_child(ground_body)

func _build_forest() -> void:
	var noise := FastNoiseLite.new()
	noise.seed = SEED
	noise.frequency = 0.035

	var trunk_mesh := CylinderMesh.new()
	trunk_mesh.top_radius = 0.24
	trunk_mesh.bottom_radius = 0.34
	trunk_mesh.height = 1.0
	trunk_mesh.radial_segments = 6
	var trunk_mat := StandardMaterial3D.new()
	trunk_mat.albedo_color = Color(0.055, 0.045, 0.038)
	trunk_mat.roughness = 1.0
	trunk_mesh.material = trunk_mat

	var canopy_mesh := CylinderMesh.new()
	canopy_mesh.top_radius = 0.08
	canopy_mesh.bottom_radius = 1.45
	canopy_mesh.height = 1.0
	canopy_mesh.radial_segments = 7
	var canopy_mat := StandardMaterial3D.new()
	canopy_mat.albedo_color = Color(0.025, 0.055, 0.037)
	canopy_mat.roughness = 1.0
	canopy_mesh.material = canopy_mat

	var trunk_multi := MultiMesh.new()
	trunk_multi.transform_format = MultiMesh.TRANSFORM_3D
	trunk_multi.mesh = trunk_mesh
	trunk_multi.instance_count = TREE_COUNT

	var canopy_multi := MultiMesh.new()
	canopy_multi.transform_format = MultiMesh.TRANSFORM_3D
	canopy_multi.mesh = canopy_mesh
	canopy_multi.instance_count = TREE_COUNT

	var positions: Array[Vector3] = []
	var attempts := 0
	while positions.size() < TREE_COUNT and attempts < TREE_COUNT * 20:
		attempts += 1
		var x := rng.randf_range(-WORLD_HALF, WORLD_HALF)
		var z := rng.randf_range(-WORLD_HALF, WORLD_HALF)
		var pos := Vector3(x, 0.0, z)
		if Vector2(x, z).length() < 8.5:
			continue
		if pos.distance_to(beacon_position) < 8.0:
			continue
		var corridor := abs(x * 0.55 + z * 0.35)
		if corridor < 2.4 and rng.randf() < 0.82:
			continue
		var density := (noise.get_noise_2d(x, z) + 1.0) * 0.5
		if rng.randf() > 0.36 + density * 0.58:
			continue
		positions.append(pos)

	for i in TREE_COUNT:
		var pos := positions[i] if i < positions.size() else Vector3(rng.randf_range(-WORLD_HALF, WORLD_HALF), 0, rng.randf_range(-WORLD_HALF, WORLD_HALF))
		var h := rng.randf_range(4.8, 9.8)
		var width := rng.randf_range(0.75, 1.25)
		var yaw := rng.randf_range(-PI, PI)

		var trunk_transform := Transform3D(Basis(Vector3.UP, yaw).scaled(Vector3(width, h, width)), pos + Vector3(0, h * 0.5, 0))
		trunk_multi.set_instance_transform(i, trunk_transform)

		var crown_height := rng.randf_range(3.4, 5.8)
		var crown_width := rng.randf_range(1.4, 2.4)
		var canopy_transform := Transform3D(Basis(Vector3.UP, yaw).scaled(Vector3(crown_width, crown_height, crown_width)), pos + Vector3(0, h + crown_height * 0.34, 0))
		canopy_multi.set_instance_transform(i, canopy_transform)

		if i < 150:
			var body := StaticBody3D.new()
			var collider := CollisionShape3D.new()
			var shape := CylinderShape3D.new()
			shape.radius = 0.32 * width
			shape.height = h
			collider.shape = shape
			collider.position = pos + Vector3(0, h * 0.5, 0)
			body.add_child(collider)
			add_child(body)

	var trunks := MultiMeshInstance3D.new()
	trunks.multimesh = trunk_multi
	add_child(trunks)

	var canopies := MultiMeshInstance3D.new()
	canopies.multimesh = canopy_multi
	add_child(canopies)

	_add_dead_trees()

func _add_dead_trees() -> void:
	for i in 18:
		var mesh_instance := MeshInstance3D.new()
		var mesh := CylinderMesh.new()
		mesh.top_radius = 0.08
		mesh.bottom_radius = 0.18
		mesh.height = rng.randf_range(2.0, 4.5)
		mesh.radial_segments = 5
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color(0.07, 0.065, 0.055)
		mesh.material = mat
		mesh_instance.mesh = mesh
		mesh_instance.position = Vector3(rng.randf_range(-60, 60), mesh.height * 0.5, rng.randf_range(-60, 60))
		mesh_instance.rotation.z = rng.randf_range(-0.18, 0.18)
		add_child(mesh_instance)

func _build_beacon() -> void:
	var marker := MeshInstance3D.new()
	var marker_mesh := CylinderMesh.new()
	marker_mesh.top_radius = 0.35
	marker_mesh.bottom_radius = 0.6
	marker_mesh.height = 2.2
	marker_mesh.radial_segments = 5
	var marker_mat := StandardMaterial3D.new()
	marker_mat.albedo_color = Color(0.16, 0.02, 0.015)
	marker_mat.emission_enabled = true
	marker_mat.emission = Color(0.42, 0.025, 0.012)
	marker_mat.emission_energy_multiplier = 1.4
	marker_mesh.material = marker_mat
	marker.mesh = marker_mesh
	marker.position = beacon_position + Vector3(0, 1.1, 0)
	add_child(marker)

	beacon_light = OmniLight3D.new()
	beacon_light.position = beacon_position + Vector3(0, 1.4, 0)
	beacon_light.light_color = Color(1.0, 0.11, 0.035)
	beacon_light.omni_range = 13.0
	beacon_light.light_energy = 0.7
	beacon_light.shadow_enabled = false
	add_child(beacon_light)

	beacon = AudioStreamPlayer3D.new()
	beacon.set_script(BeaconScript)
	beacon.position = beacon_position + Vector3(0, 1.2, 0)
	add_child(beacon)

func _build_player() -> void:
	player = CharacterBody3D.new()
	player.name = "Player"
	player.set_script(PlayerScript)
	player.position = Vector3(0, 0.05, 0)
	add_child(player)

func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)

	mobile_controls = Control.new()
	mobile_controls.set_script(MobileControlsScript)
	layer.add_child(mobile_controls)
	mobile_controls.visible = false
	mobile_controls.move_changed.connect(player.set_touch_move)
	mobile_controls.look_delta.connect(player.add_touch_look)
	mobile_controls.flashlight_pressed.connect(player.toggle_flashlight)

	desktop_hint = Label.new()
	desktop_hint.text = "WASD / MOUSE   •   F = LIGHT"
	desktop_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desktop_hint.anchor_left = 0.5
	desktop_hint.anchor_right = 0.5
	desktop_hint.anchor_top = 1.0
	desktop_hint.anchor_bottom = 1.0
	desktop_hint.offset_left = -180
	desktop_hint.offset_right = 180
	desktop_hint.offset_top = -48
	desktop_hint.offset_bottom = -18
	desktop_hint.modulate = Color(1, 1, 1, 0.38)
	layer.add_child(desktop_hint)
	desktop_hint.visible = false

	var overlay := ColorRect.new()
	overlay.name = "EntryOverlay"
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.color = Color(0.005, 0.007, 0.008, 0.98)
	layer.add_child(overlay)

	var stack := VBoxContainer.new()
	stack.anchor_left = 0.5
	stack.anchor_right = 0.5
	stack.anchor_top = 0.5
	stack.anchor_bottom = 0.5
	stack.offset_left = -155
	stack.offset_right = 155
	stack.offset_top = -110
	stack.offset_bottom = 110
	stack.add_theme_constant_override("separation", 14)
	overlay.add_child(stack)

	var title := Label.new()
	title.text = "MZ WOODS"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	stack.add_child(title)

	var version := Label.new()
	version.text = "PROTOTYPE 0.01 / SEED %d" % SEED
	version.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	version.modulate = Color(1, 1, 1, 0.42)
	stack.add_child(version)

	var note := Label.new()
	note.text = "walk toward what you hear\nheadphones recommended"
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	note.modulate = Color(1, 1, 1, 0.62)
	stack.add_child(note)

	var enter := Button.new()
	enter.text = "ENTER THE WOODS"
	enter.custom_minimum_size = Vector2(0, 58)
	stack.add_child(enter)

	enter.pressed.connect(func():
		started = true
		player.set_enabled(true)
		if beacon.has_method("start_audio"):
			beacon.start_audio()
		var touch := DisplayServer.is_touchscreen_available()
		mobile_controls.visible = touch
		desktop_hint.visible = not touch
		if not touch:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		overlay.queue_free()
	)

func _show_message(text: String, duration: float) -> void:
	var layer := CanvasLayer.new()
	layer.layer = 20
	add_child(layer)
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	label.add_theme_font_size_override("font_size", 22)
	label.modulate = Color(1, 1, 1, 0.85)
	layer.add_child(label)
	var timer := get_tree().create_timer(duration)
	timer.timeout.connect(layer.queue_free)
