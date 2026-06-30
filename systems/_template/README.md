# Replace with system title

## Recovered from

- Conversation:
- Date recovered:
- Recovery agent:

## What the interface does

Describe the visual system, its inputs, its outputs, and the behavior that should remain canonical.

## Approved visual traits

- aspect ratio:
- palette:
- typography:
- motion:
- audio:
- CRT/display treatment:

## Rejected or deprecated traits

Record failed directions so later agents do not repeat them.

## Runtime

```bash
python systems/<system-slug>/src/generator.py \
  --seed 12345 \
  --output /tmp/output.mp4 \
  --thumbnail /tmp/output.jpg
```

## Autonomy

Current mode: `reference-only`

Before changing to `scheduled`, verify that the generator runs unattended, writes every required file, uses no unavailable assets or secrets, and completes within the GitHub Actions time limit.

## Reference outputs

List the approved files stored in `reference/` and explain why each is retained.
