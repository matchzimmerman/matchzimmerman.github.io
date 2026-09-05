import { Mesh, OrthographicCamera, Plane, Raycaster, Vector2, Vector3 } from 'three';
import type { Intersection } from 'three';
import { damp, MAX_PRESSURES } from './types.ts';
import type { PressurePoint } from './types.ts';

/** Pointer Events unify mouse, pen, and up to five simultaneous touches. */
export class InteractionSystem {
  readonly pressures: PressurePoint[] = [];
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly hit = new Vector3();
  private readonly plane = new Plane(new Vector3(0, 1, 0), 0);
  private readonly intersections: Intersection[] = [];
  private readonly controller = new AbortController();
  private readonly pendingMoves = new Map<number, PointerEvent>();
  private keyX = 0;
  private keyZ = 0;
  private keyDown = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: OrthographicCamera,
    private readonly surface: Mesh,
    private readonly cursor: HTMLElement,
  ) {
    const options = { signal: this.controller.signal };
    canvas.addEventListener('pointerdown', this.onDown, options);
    canvas.addEventListener('pointermove', this.onMove, options);
    canvas.addEventListener('pointerup', this.onUp, options);
    canvas.addEventListener('pointercancel', this.onUp, options);
    canvas.addEventListener('lostpointercapture', this.onUp, options);
    canvas.addEventListener('pointerleave', this.onLeave, options);
    canvas.addEventListener('keydown', this.onKeyDown, options);
    canvas.addEventListener('keyup', this.onKeyUp, options);
    canvas.addEventListener('blur', this.clear, options);
    window.addEventListener('blur', this.clear, options);
  }

  private setPoint(id: number, x: number, z: number, down: boolean, strength: number): void {
    let point = this.pressures.find(p => p.id === id);
    if (!point) {
      if (this.pressures.length >= MAX_PRESSURES) {
        const expired = this.pressures.findIndex(p => !p.down);
        if (expired < 0) return;
        this.pressures.splice(expired, 1);
      }
      point = { id, x, z, targetX: x, targetZ: z, strength: 0, targetStrength: strength, radius: 2, down };
      this.pressures.push(point);
    }
    point.targetX = x;
    point.targetZ = z;
    point.down = down;
    point.targetStrength = strength;
  }

  private project(event: PointerEvent, down: boolean): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.pointer.set(x / rect.width * 2 - 1, 1 - y / rect.height * 2);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    // Pick the actual deformed material, so a touch lands on the visible ridge.
    this.intersections.length = 0;
    this.raycaster.intersectObject(this.surface, false, this.intersections);
    if (this.intersections.length) this.hit.copy(this.intersections[0].point);
    else if (!this.raycaster.ray.intersectPlane(this.plane, this.hit)) return;
    const force = down ? (event.pointerType === 'pen' ? 0.4 + event.pressure * 0.9 : 1) : 0.12;
    this.setPoint(event.pointerId, this.hit.x, this.hit.z, down, force);
    this.cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    this.cursor.classList.add('visible');
    this.cursor.classList.toggle('pressed', down);
  }

  private onDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    this.canvas.focus({ preventScroll: true });
    this.canvas.setPointerCapture(event.pointerId);
    this.project(event, true);
  };

  private onMove = (event: PointerEvent): void => {
    const down = this.pressures.some(p => p.id === event.pointerId && p.down);
    // Coalesce high-rate device events to at most one ray pick per pointer per frame.
    if (event.pointerType !== 'touch' || down) this.pendingMoves.set(event.pointerId, event);
  };

  private onUp = (event: PointerEvent): void => {
    this.pendingMoves.delete(event.pointerId);
    const point = this.pressures.find(p => p.id === event.pointerId);
    if (point) { point.down = false; point.targetStrength = 0; }
    this.cursor.classList.remove('pressed');
    if (event.pointerType === 'touch') this.cursor.classList.remove('visible');
  };

  private onLeave = (event: PointerEvent): void => {
    const point = this.pressures.find(p => p.id === event.pointerId);
    if (point && !point.down) { point.targetStrength = 0; this.pendingMoves.delete(event.pointerId); }
    this.cursor.classList.remove('visible');
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') this.keyX -= 0.35;
    if (event.key === 'ArrowRight') this.keyX += 0.35;
    if (event.key === 'ArrowUp') this.keyZ -= 0.35;
    if (event.key === 'ArrowDown') this.keyZ += 0.35;
    if (event.key === 'Enter') this.keyDown = true;
    this.keyX = Math.max(-8, Math.min(8, this.keyX));
    this.keyZ = Math.max(-8, Math.min(8, this.keyZ));
    this.setPoint(-1, this.keyX, this.keyZ, this.keyDown, this.keyDown ? 1 : 0.25);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') this.keyDown = false;
    if (event.key === 'Enter' || event.key.startsWith('Arrow')) {
      const point = this.pressures.find(p => p.id === -1);
      if (point && !this.keyDown) { point.down = false; point.targetStrength = 0; }
    }
  };

  update(dt: number): void {
    for (const event of this.pendingMoves.values()) {
      this.project(event, this.pressures.some(p => p.id === event.pointerId && p.down));
    }
    this.pendingMoves.clear();
    for (let i = this.pressures.length - 1; i >= 0; i--) {
      const point = this.pressures[i];
      point.x = damp(point.x, point.targetX, 14, dt);
      point.z = damp(point.z, point.targetZ, 14, dt);
      point.strength = damp(point.strength, point.targetStrength, point.down ? 5 : 2.6, dt);
      if (point.targetStrength === 0 && point.strength < 0.003) this.pressures.splice(i, 1);
    }
  }

  clear = (): void => {
    this.pressures.length = 0;
    this.pendingMoves.clear();
    this.keyX = this.keyZ = 0;
    this.keyDown = false;
    this.cursor.classList.remove('visible', 'pressed');
  };

  dispose(): void { this.controller.abort(); this.clear(); }
}
