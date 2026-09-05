import { Color, OrthographicCamera, Scene, SRGBColorSpace, WebGLRenderer } from 'three';
import { PALETTE } from './materials.ts';

export interface SceneContext {
  scene: Scene;
  camera: OrthographicCamera;
  renderer: WebGLRenderer;
  compact: boolean;
  resize: () => void;
  lowerResolution: () => boolean;
  dispose: () => void;
}

export function createScene(canvas: HTMLCanvasElement): SceneContext {
  const compact = matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
  const scene = new Scene();
  scene.background = new Color(PALETTE.paper);
  const camera = new OrthographicCamera(-10, 10, 10, -10, 0.1, 180);
  camera.position.set(10, 12.4, 15.8);
  camera.lookAt(0, 0.65, 0);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'default' });
  renderer.outputColorSpace = SRGBColorSpace;
  let ratio = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.8);

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const aspect = width / height;
    // Fit the core on narrow screens, reserving space for the control dock.
    const viewHeight = aspect < 0.8 ? 15.4 / aspect : 16.6;
    const horizontalOffset = width > 760 ? 2.6 : 0;
    const verticalOffset = aspect < 0.8 ? -2.7 : 0;
    camera.left = -viewHeight * aspect / 2 + horizontalOffset;
    camera.right = viewHeight * aspect / 2 + horizontalOffset;
    camera.top = viewHeight / 2 + verticalOffset;
    camera.bottom = -viewHeight / 2 + verticalOffset;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  return {
    scene, camera, renderer, compact, resize,
    lowerResolution: () => {
      if (ratio <= 1) return false;
      ratio = Math.max(1, ratio - 0.25);
      resize();
      return true;
    },
    dispose: () => { observer.disconnect(); renderer.dispose(); },
  };
}
