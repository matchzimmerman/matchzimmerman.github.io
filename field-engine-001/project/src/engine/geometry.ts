import {
  BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, Group, InstancedMesh,
  Matrix4, Mesh, MeshBasicMaterial, PlaneGeometry, DoubleSide, Quaternion, Vector3,
} from 'three';
import { sampleField, seededRandom } from './behavior.ts';
import { createFieldMaterial, PALETTE } from './materials.ts';
import type { FieldBasis, FieldSample, FieldState } from './types.ts';

const EXTENT = 48;
const Y_AXIS = new Vector3(0, 1, 0);

export class ProceduralField {
  readonly group = new Group();
  readonly surface: Mesh<BufferGeometry, ReturnType<typeof createFieldMaterial>>;
  readonly vertexCount: number;
  private readonly positions: Float32Array;
  private readonly energy: Float32Array;
  private readonly rest: Float32Array;
  private readonly basisData: Float64Array;
  private readonly basis: FieldBasis = { radius: 0, angle: 0, core: 0 };
  private readonly fragments: InstancedMesh;
  private readonly fragmentSeeds: Float32Array;
  private readonly sample: FieldSample = { x: 0, y: 0, z: 0, energy: 0 };
  private readonly matrix = new Matrix4();
  private readonly rotation = new Quaternion();
  private readonly position = new Vector3();
  private readonly scale = new Vector3();
  private readonly ink = new Color(PALETTE.ink);
  private readonly accent = new Color(PALETTE.accent);
  private readonly color = new Color();

  constructor(compact: boolean) {
    // Nonuniform tessellation concentrates resolution at the sculptural center.
    const segments = compact ? 112 : 160;
    const side = segments + 1;
    this.vertexCount = side * side;
    this.positions = new Float32Array(this.vertexCount * 3);
    this.rest = new Float32Array(this.vertexCount * 2);
    this.basisData = new Float64Array(this.vertexCount * 3);
    this.energy = new Float32Array(this.vertexCount);
    const indices = new Uint32Array(segments * segments * 6);
    const coordinate = (i: number) => {
      const n = i / segments * 2 - 1;
      return Math.sign(n) * Math.pow(Math.abs(n), 1.6) * EXTENT / 2;
    };
    for (let row = 0; row < side; row++) {
      for (let col = 0; col < side; col++) {
        const i = row * side + col;
        this.rest[i * 2] = this.positions[i * 3] = coordinate(col);
        this.rest[i * 2 + 1] = this.positions[i * 3 + 2] = coordinate(row);
        const x = this.rest[i * 2], z = this.rest[i * 2 + 1];
        const radius = Math.sqrt(x * x * 0.88 + z * z * 1.13);
        this.basisData[i * 3] = radius;
        this.basisData[i * 3 + 1] = Math.atan2(z, x);
        this.basisData[i * 3 + 2] = Math.exp(-radius * radius * 0.038);
      }
    }
    let k = 0;
    for (let row = 0; row < segments; row++) {
      for (let col = 0; col < segments; col++) {
        const a = row * side + col, b = a + 1, c = a + side, d = c + 1;
        indices[k++] = a; indices[k++] = c; indices[k++] = b;
        indices[k++] = b; indices[k++] = c; indices[k++] = d;
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(this.positions, 3).setUsage(DynamicDrawUsage));
    geometry.setAttribute('uv', new BufferAttribute(this.rest, 2));
    geometry.setAttribute('energy', new BufferAttribute(this.energy, 1).setUsage(DynamicDrawUsage));
    geometry.setIndex(new BufferAttribute(indices, 1));
    // Conservative fixed bounds avoid recomputing them every frame and retain ray picking.
    geometry.computeBoundingSphere();
    geometry.boundingSphere!.radius = 45;
    this.surface = new Mesh(geometry, createFieldMaterial());
    this.surface.name = 'continuous-material-field';
    this.group.add(this.surface);

    const fragmentCount = compact ? 220 : 360;
    this.fragmentSeeds = new Float32Array(fragmentCount * 4);
    const random = seededRandom(1001);
    for (let i = 0; i < this.fragmentSeeds.length; i++) this.fragmentSeeds[i] = random();
    const fragmentGeometry = new PlaneGeometry(1, 1);
    fragmentGeometry.rotateX(-Math.PI / 2);
    const fragmentMaterial = new MeshBasicMaterial({ color: 'white', side: DoubleSide });
    this.fragments = new InstancedMesh(fragmentGeometry, fragmentMaterial, fragmentCount);
    this.fragments.instanceMatrix.setUsage(DynamicDrawUsage);
    this.fragments.frustumCulled = false;
    this.fragments.name = 'field-fragments';
    this.group.add(this.fragments);
  }

  setDensity(value: number): void {
    this.surface.material.uniforms.uDensity.value = 1.8 + value * 6.4;
    this.fragments.count = Math.round(this.fragmentSeeds.length / 4 * (0.35 + value * 0.65));
  }

  update(state: FieldState): void {
    const out = this.sample;
    for (let i = 0; i < this.vertexCount; i++) {
      this.basis.radius = this.basisData[i * 3];
      this.basis.angle = this.basisData[i * 3 + 1];
      this.basis.core = this.basisData[i * 3 + 2];
      sampleField(this.rest[i * 2], this.rest[i * 2 + 1], state, out, this.basis);
      this.positions[i * 3] = out.x;
      this.positions[i * 3 + 1] = out.y;
      this.positions[i * 3 + 2] = out.z;
      this.energy[i] = out.energy;
    }
    this.surface.geometry.attributes.position.needsUpdate = true;
    this.surface.geometry.attributes.energy.needsUpdate = true;
    this.surface.material.uniforms.uFracture.value = state.profile.fracture;

    for (let i = 0; i < this.fragments.count; i++) {
      const seed = i * 4;
      const a = this.fragmentSeeds[seed] * Math.PI * 2 + state.time * 0.12;
      const r = 1.6 + this.fragmentSeeds[seed + 1] * 3.8;
      sampleField(Math.cos(a) * r, Math.sin(a) * r, state, out);
      const release = state.profile.fracture * state.intensity;
      const drift = Math.sin(a * 3 - state.time * 0.5) * release * 0.5;
      this.position.set(out.x + Math.cos(a) * drift, out.y + 0.055 + release * this.fragmentSeeds[seed + 2] * 1.6, out.z + Math.sin(a) * drift);
      this.rotation.setFromAxisAngle(Y_AXIS, -a + Math.sin(state.time + a) * release);
      const size = 0.035 + this.fragmentSeeds[seed + 3] * 0.07;
      this.scale.set(size * (2 + release * 4), 1, size * 0.55);
      this.matrix.compose(this.position, this.rotation, this.scale);
      this.fragments.setMatrixAt(i, this.matrix);
      this.color.copy(this.ink).lerp(this.accent, Math.min(1, out.energy + (i % 7 === 0 ? 1 : release * 0.4)));
      this.fragments.setColorAt(i, this.color);
    }
    this.fragments.instanceMatrix.needsUpdate = true;
    if (this.fragments.instanceColor) this.fragments.instanceColor.needsUpdate = true;
  }

  dispose(): void {
    this.surface.geometry.dispose();
    this.surface.material.dispose();
    this.fragments.geometry.dispose();
    (this.fragments.material as MeshBasicMaterial).dispose();
    this.fragments.dispose();
  }
}
