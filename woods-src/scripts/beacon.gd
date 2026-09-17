extends AudioStreamPlayer3D

var playback: AudioStreamGeneratorPlayback
var phase := 0.0
var pulse_phase := 0.0
var agitated := false
var generator: AudioStreamGenerator

func _ready() -> void:
	generator = AudioStreamGenerator.new()
	generator.mix_rate = 22050.0
	generator.buffer_length = 0.5
	stream = generator
	max_distance = 95.0
	unit_size = 8.0
	attenuation_model = AudioStreamPlayer3D.ATTENUATION_INVERSE_DISTANCE
	panning_strength = 1.8

func start_audio() -> void:
	if playing:
		return
	play()
	playback = get_stream_playback() as AudioStreamGeneratorPlayback

func set_agitated(value: bool) -> void:
	agitated = value

func _process(_delta: float) -> void:
	if playback == null:
		return
	var frames := playback.get_frames_available()
	var rate := generator.mix_rate
	for i in frames:
		var pulse_speed := 1.8 if agitated else 1.0
		pulse_phase = fmod(pulse_phase + pulse_speed / rate, 1.0)
		var env := pow(max(0.0, sin(pulse_phase * TAU)), 7.0)
		var hz := 92.0 if agitated else 73.0
		phase = fmod(phase + hz / rate, 1.0)
		var sample := sin(phase * TAU) * 0.12 * env
		sample += sin(phase * TAU * 2.01) * 0.025 * env
		playback.push_frame(Vector2(sample, sample))
