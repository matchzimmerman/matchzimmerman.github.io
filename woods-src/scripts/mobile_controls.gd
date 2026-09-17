extends Control

signal move_changed(value: Vector2)
signal look_delta(value: Vector2)
signal flashlight_pressed

var move_touch := -1
var look_touch := -1
var move_origin := Vector2.ZERO
var move_position := Vector2.ZERO
var joystick_radius := 72.0

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	var light_button := Button.new()
	light_button.text = "LIGHT"
	light_button.focus_mode = Control.FOCUS_NONE
	light_button.mouse_filter = Control.MOUSE_FILTER_STOP
	light_button.anchor_left = 0.82
	light_button.anchor_top = 0.76
	light_button.anchor_right = 0.98
	light_button.anchor_bottom = 0.94
	light_button.modulate = Color(1, 1, 1, 0.72)
	light_button.pressed.connect(func(): flashlight_pressed.emit())
	add_child(light_button)

func _input(event: InputEvent) -> void:
	if not visible:
		return
	if event is InputEventScreenTouch:
		if event.position.x > size.x * 0.78 and event.position.y > size.y * 0.70:
			return
		if event.pressed:
			if event.position.x < size.x * 0.5 and event.position.y > size.y * 0.28 and move_touch == -1:
				move_touch = event.index
				move_origin = event.position
				move_position = event.position
				move_changed.emit(Vector2.ZERO)
				queue_redraw()
			elif look_touch == -1:
				look_touch = event.index
		else:
			if event.index == move_touch:
				move_touch = -1
				move_changed.emit(Vector2.ZERO)
				queue_redraw()
			elif event.index == look_touch:
				look_touch = -1
	elif event is InputEventScreenDrag:
		if event.index == move_touch:
			var drag := event.position - move_origin
			if drag.length() > joystick_radius:
				drag = drag.normalized() * joystick_radius
			move_position = move_origin + drag
			var normalized := drag / joystick_radius
			move_changed.emit(Vector2(normalized.x, -normalized.y))
			queue_redraw()
		elif event.index == look_touch:
			look_delta.emit(event.relative)

func _draw() -> void:
	if move_touch != -1:
		draw_circle(move_origin, joystick_radius, Color(1, 1, 1, 0.08))
		draw_arc(move_origin, joystick_radius, 0.0, TAU, 48, Color(1, 1, 1, 0.25), 2.0)
		draw_circle(move_position, 24.0, Color(1, 1, 1, 0.26))
