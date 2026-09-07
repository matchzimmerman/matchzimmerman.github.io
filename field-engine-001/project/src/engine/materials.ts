import { Color, DoubleSide, ShaderMaterial } from 'three';

export const PALETTE = {
  paper: '#f1f3ee',
  ink: '#243fcb',
  accent: '#f15b35',
  grid: '#a6b0b9',
};

/** Grid lines live on the material, so the background and foreground are continuous. */
export function createFieldMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    side: DoubleSide,
    uniforms: {
      uDensity: { value: 4.6 },
      uPaper: { value: new Color(PALETTE.paper) },
      uInk: { value: new Color(PALETTE.ink) },
      uAccent: { value: new Color(PALETTE.accent) },
      uGrid: { value: new Color(PALETTE.grid) },
      uFracture: { value: 0 },
    },
    vertexShader: /* glsl */`
      attribute float energy;
      attribute float trace;
      attribute float tear;
      varying vec2 vRest;
      varying vec3 vWorld;
      varying float vEnergy;
      varying float vTrace;
      varying float vTear;
      void main() {
        vRest = uv;
        vWorld = position;
        vEnergy = energy;
        vTrace = trace;
        vTear = tear;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uDensity;
      uniform vec3 uPaper;
      uniform vec3 uInk;
      uniform vec3 uAccent;
      uniform vec3 uGrid;
      uniform float uFracture;
      varying vec2 vRest;
      varying vec3 vWorld;
      varying float vEnergy;
      varying float vTrace;
      varying float vTear;

      float line(float coordinate, float width) {
        float derivatives = max(fwidth(coordinate), 0.0001);
        float distanceToLine = abs(fract(coordinate - 0.5) - 0.5) / derivatives;
        return 1.0 - smoothstep(width, width + 1.0, distanceToLine);
      }

      void main() {
        float radius = length(vRest);
        float central = 1.0 - smoothstep(4.6, 8.0, radius);
        float edges = 1.0 - smoothstep(15.0, 24.0, radius);
        float bands = line(vRest.y * uDensity, 0.45 + central * 0.2);
        float crosslines = line(vRest.x * 0.55, 0.28) * (1.0 - central) * 0.28;
        // Local damage opens short material-space seams; intact regions stay continuous.
        float incision = line(vRest.y * uDensity * 0.5, 0.3 + vTear * 2.0);
        float dash = step(0.25, fract(vRest.x * 0.8 + floor(vRest.y * uDensity * 0.5) * 0.37));
        if (vTear > 0.3 && incision * dash > 0.6) discard;

        vec3 normal = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        float shade = abs(dot(normal, normalize(vec3(-0.4, 1.0, 0.6))));
        vec3 paper = uPaper * (0.95 + shade * 0.05);
        paper = mix(paper, uPaper, 1.0 - central);
        vec3 ink = mix(uGrid, uInk, central);
        ink = mix(ink, uAccent, clamp(vEnergy * 0.9 + vTrace * 0.9 + vTear, 0.0, 1.0));
        paper = mix(paper, uAccent, min(0.08, vTrace * 0.065));
        float opacity = max(bands * mix(0.32, 1.0, max(central, vTrace)), crosslines) * edges;
        vec3 color = mix(paper, ink, opacity);
        color = mix(uPaper, color, edges);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
