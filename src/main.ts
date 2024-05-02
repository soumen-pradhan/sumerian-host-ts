import './style.css';
import './utils/Errors';

import * as THREE from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import * as TWEEN from '@tweenjs/tween.js';

import { NEUTRAL_400, NEUTRAL_50, NEUTRAL_950, SLATE_700 } from './utils/Color';

import HostObject from './feature/host/HostObject';
import AnimationFeature from './feature/host/AnimationFeature';

const paths = {
  character: 'assets/glTF/characters/adult_male/luke/luke.gltf',
  animation: {
    blink: 'assets/glTF/animations/adult_male/blink.glb',
    emote: 'assets/glTF/animations/adult_male/emote.glb',
    face_idle: 'assets/glTF/animations/adult_male/face_idle.glb',
    gesture: 'assets/glTF/animations/adult_male/gesture.glb',
    lipsync: 'assets/glTF/animations/adult_male/lipsync.glb',
    stand_idle: 'assets/glTF/animations/adult_male/stand_idle.glb',
  },
};

type AnimationPathMap = typeof paths.animation;
type AnimationClipMap = {
  [K in keyof AnimationPathMap]: THREE.AnimationClip[];
};

const renderFn: ((...args: any[]) => any)[] = [];
// set in createScene
let renderLoop: (timeMs: DOMHighResTimeStamp) => void = (_timeMs) => {};
let renderHandle: number | undefined = undefined;

main();

async function main() {
  const { scene, camera, clock } = createScene();

  const { character, clips, bindPoseOffset } = await loadCharacter(
    scene,
    paths.character,
    paths.animation
  );

  character.position.set(0, 0, 0);
  // character.rotateY(-0.5);

  const host = createHost({ owner: character, clock, clips });

  // initUx
  {
    // const button = document.createElement('button');
    // button.classList.add('absolute', 'top-1', 'left-1');
    // button.addEventListener('click', () => {
    //   if (renderHandle) {
    //     cancelAnimationFrame(renderHandle);
    //     renderHandle = undefined;
    //     button.textContent = 'Play';
    //   } else {
    //     renderHandle = requestAnimationFrame(renderLoop);
    //     button.textContent = 'Pause';
    //   }
    // });
    // button.textContent = 'Play';
    // document.body.append(button);
  }

  // Animate the render loop only after everything is loaded.
  renderHandle = requestAnimationFrame(renderLoop);
}

function createScene(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clock: THREE.Clock;
} {
  // Scene
  const scene = new THREE.Scene();
  scene.background = SLATE_700;
  scene.fog = new THREE.Fog(SLATE_700);

  const clock = new THREE.Clock();

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(SLATE_700);
  renderer.domElement.id = 'renderCanvas';
  document.body.appendChild(renderer.domElement);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.4, 3.1);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new THREE.Vector3(0, 0.8, 0);
  controls.screenSpacePanning = true;
  controls.update();

  window.addEventListener(
    'resize',
    () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
  );

  // Lights
  const hemiLight = new THREE.HemisphereLight(NEUTRAL_50, NEUTRAL_950, 0.6);
  hemiLight.position.set(0, 1, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(NEUTRAL_50);
  dirLight.position.set(0, 5, 5);
  dirLight.castShadow = true;

  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.top = 2.5;
  dirLight.shadow.camera.bottom = -2.5;
  dirLight.shadow.camera.left = -2.5;
  dirLight.shadow.camera.right = 2.5;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 40;
  scene.add(dirLight);

  const dirLightTarget = new THREE.Object3D();
  dirLight.add(dirLightTarget);
  dirLightTarget.position.set(0, -0.5, -1.0);
  dirLight.target = dirLightTarget;

  // Environment
  const groundMat = new THREE.MeshStandardMaterial({
    color: NEUTRAL_400,
    depthWrite: false,
    metalness: 0,
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Render Loop
  renderLoop = (timeMs: DOMHighResTimeStamp) => {
    renderHandle = requestAnimationFrame(renderLoop);
    TWEEN.update(timeMs);
    controls.update();
    renderFn.forEach((fn) => void fn());
    renderer.render(scene, camera);
  };

  return { scene, camera, clock };
}

async function loadCharacter(
  scene: THREE.Scene,
  characterPath: string,
  animationPaths: AnimationPathMap
): Promise<{
  character: THREE.Group<THREE.Object3DEventMap>;
  clips: AnimationClipMap;
  bindPoseOffset: THREE.AnimationClip;
}> {
  const gltfLoader = new GLTFLoader();

  const characterGLTF = await new Promise<GLTF>((resolve) => {
    gltfLoader.load(characterPath, (data) => {
      resolve(data);
    });
  });

  const character = characterGLTF.scene;
  scene.add(character);

  // Make the offset pose additive
  const [bindPoseOffset] = characterGLTF.animations;
  if (bindPoseOffset) {
    THREE.AnimationUtils.makeClipAdditive(bindPoseOffset);
  }

  // Cast shadows
  character.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
    }
  });

  // Load animations

  const clipMap: Partial<AnimationClipMap> = {};

  await Promise.all(
    Object.entries(animationPaths).map(([name, path]) => {
      return new Promise<void>((resolve) => {
        gltfLoader.load(path, (data) => {
          clipMap[name as keyof typeof animationPaths] = data.animations;
          resolve();
        });
      });
    })
  );

  const clips = clipMap as AnimationClipMap;

  return { character, clips, bindPoseOffset };
}

function createHost(opts: {
  owner: GLTF['scene'];
  clock: THREE.Clock;
  clips: AnimationClipMap;
}) {
  const host = new HostObject({ owner: opts.owner, clock: opts.clock });
  renderFn.push(() => host.update());

  const animFeature = new AnimationFeature(host);
  host.addFeature(animFeature);

  // Base Layer
  {
    const baseLayer = animFeature.addLayer({ name: 'Base' });
    const baseIdleHandle = baseLayer.addSingleAnimation({
      clip: opts.clips.stand_idle[0],
    });
    baseLayer.playAnimation(baseIdleHandle);
  }

  return host;
}
