extends CharacterBody3D

var camera: Camera3D
var flashlight: SpotLight3D
var enabled := false
var touch_move := Vector2.ZERO
var queued_touch_look := Vector2.ZERO
var pitch := 0.0
var speed := 4.2
var look_sensitivity := 0.0025
var gamepad_look_speed := 2.2
var flashlight_on := true
var horror_flicker_time := 0.0
var bob_phase := 0.0
var base_camera_y := 1.55

func _ready() -> void:
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.34
	capsule.height = 1.8
	collision.shape = capsule
	collision.position.y = 0.9
	add_child(collision)

	camera = Camera3D.new()
	camera.position = Vector3(0.0, base_camera_y, 0.0)
	camera.current = true
	add_child(camera)

	flashlight = SpotLight3D.new()
	flashlight.light_color = Color(0.91, 0.88, 0.78)
	flashlight.light_energy = 5.2
	flashlight.spot_range = 28.0
	flashlight.spot_angle = 24.0
	flashlight.spot_angle_attenuation = 0.9
	flashlight.shadow_enabled = false
	camera.add_child(flashlight)

func set_enabled(value: bool) -> void:
	enabled = value

func set_touch_move(value: Vector2) -> void:
	touch_move = value.limit_length(1.0)

func add_touch_look(delta: Vector2) -> void:
	queued_touch_look += delta

func toggle_flashlight() -> void:
	flashlight_on = not flashlight_on
	flashlight.visible = flashlight_on

func trigger_horror_flicker(duration := 2.4) -> void:
	horror_flicker_time = max(horror_flicker_time, duration)

func _unhandled_input(event: InputEvent) -> void:
	if not enabled:
		return
	if event is InputEventMouseButton and event.pressed:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	elif event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		_apply_look(event.relative)
	elif event is InputEventKey and event.pressed:
		if event.keycode == KEY_ESCAPE:
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		elif event.keycode == KEY_F:
			toggle_flashlight()

func _physics_process(delta: float) -> void:
	if not enabled:
		return

	if queued_touch_look.length_squared() > 0.0:
		_apply_look(queued_touch_look)
		queued_touch_look = Vector2.ZERO

	var joy_look := Vector2(Input.get_joy_axis(0, JOY_AXIS_RIGHT_X), Input.get_joy_axis(0, JOY_AXIS_RIGHT_Y))
	if joy_look.length() > 0.15:
		rotate_y(-joy_look.x * gamepad_look_speed * delta)
		pitch = clamp(pitch - joy_look.y * gamepad_look_speed * delta, -1.35, 1.35)
		camera.rotation.x = pitch

	var keyboard := Vector2.ZERO
	if Input.is_key_pressed(KEY_A): keyboard.x -= 1.0
	if Input.is_key_pressed(KEY_D): keyboard.x += 1.0
	if Input.is_key_pressed(KEY_W): keyboard.y += 1.0
	if Input.is_key_pressed(KEY_S): keyboard.y -= 1.0

	var joy_move := Vector2(Input.get_joy_axis(0, JOY_AXIS_LEFT_X), -Input.get_joy_axis(0, JOY_AXIS_LEFT_Y))
	if joy_move.length() < 0.15:
		joy_move = Vector2.ZERO

	var move_input := keyboard
	if joy_move.length() > move_input.length(): move_input = joy_move
	if touch_move.length() > move_input.length(): move_input = touch_move
	move_input = move_input.limit_length(1.0)

	var forward := -global_transform.basis.z
	var right := global_transform.basis.x
	var desired := right * move_input.x + forward * move_input.y
	desired.y = 0.0
	if desired.length_squared() > 0.001:
		desired = desired.normalized()
		velocity.x = desired.x * speed
		velocity.z = desired.z * speed
	else:
		velocity.x = move_toward(velocity.x, 0.0, speed * 8.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, speed * 8.0 * delta)

	if not is_on_floor():
		velocity.y -= 18.0 * delta
	else:
		velocity.y = -0.2

	move_and_slide()

	var horizontal_speed := Vector2(velocity.x, velocity.z).length()
	if horizontal_speed > 0.3 and is_on_floor():
		bob_phase += delta * 9.5
		camera.position.y = base_camera_y + sin(bob_phase) * 0.025
	else:
		camera.position.y = lerp(camera.position.y, base_camera_y, min(delta * 8.0, 1.0))

	if horror_flicker_time > 0.0:
		horror_flicker_time -= delta
		var flash_gate := sin(Time.get_ticks_msec() * 0.035) + sin(Time.get_ticks_msec() * 0.013)
		flashlight.visible = flashlight_on and flash_gate > -0.15
	elif flashlight.visible != flashlight_on:
		flashlight.visible = flashlight_on

func _apply_look(delta_pixels: Vector2) -> void:
	rotate_y(-delta_pixels.x * look_sensitivity)
	pitch = clamp(pitch - delta_pixels.y * look_sensitivity, -1.35, 1.35)
	camera.rotation.x = pitch
