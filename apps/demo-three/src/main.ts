import './style.css';

import * as THREE from 'three';
import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { ControlGui, Color } from './utils';

//#region Globals

const PATH = {
  character: 'assets/glTF/characters/adult_male/luke/luke.gltf',
  animation: {
    blink: 'assets/glTF/animations/adult_male/blink.glb',
    emote: 'assets/glTF/animations/adult_male/emote.glb',
    face_idle: 'assets/glTF/animations/adult_male/face_idle.glb',
    gesture: 'assets/glTF/animations/adult_male/gesture.glb',
    lipsync: 'assets/glTF/animations/adult_male/lipsync.glb',
    stand_idle: 'assets/glTF/animations/adult_male/stand_idle.glb',
    poi: 'assets/glTF/animations/adult_male/poi.glb',
  },
} as const;

let GLOBAL_GUI: GUI | undefined;

function gui(m: ConstructorParameters<typeof ControlGui>[1], g = GLOBAL_GUI) {
  return new ControlGui(m.name, m, g!);
}

const renderFn: ((args?: { deltaS?: number }) => unknown)[] = [];
let _renderHandle: number | undefined;

//#endregion

await main();

async function main() {
  GLOBAL_GUI = new GUI();

  const { renderLoop, scene } = createScene();
  await loadModels({ scene, path: PATH });

  // Animate the render loop only after everything is loaded.
  _renderHandle = requestAnimationFrame(renderLoop);
}

function createScene() {
  //#region Scene

  const scene = new THREE.Scene();
  scene.background = Color.SLATE_700;
  scene.fog = new THREE.Fog(Color.SLATE_700);

  const clock = new THREE.Clock();

  const stats = new Stats();
  stats.showPanel(0);

  //#endregion

  //#region Renderer

  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(Color.SLATE_700);

  // renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;

  renderer.domElement.id = 'renderCanvas';
  document.body.appendChild(renderer.domElement);

  //#endregion

  //#region Camera

  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
  camera.position.set(0, 1.5, 1.2);
  camera.lookAt(0, 1.5, 0);
  camera.name = 'camera0';

  scene.add(camera);
  gui(camera).pos();

  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.target = new THREE.Vector3(0, 1.5, 0);
  orbitControls.screenSpacePanning = true;
  orbitControls.update();

  // TODO Use a ResizeObserver instead
  window.addEventListener(
    'resize',
    () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
  );

  //#endregion

  //#region GLobal Illumination

  const ambientLight = new THREE.AmbientLight(Color.SLATE_50, 0.5);
  const hemiLight = new THREE.HemisphereLight(
    Color.SLATE_700,
    Color.STONE_500,
    2.6
  );
  scene.add(ambientLight, hemiLight);

  // Directional Lights
  {
    const dirLight = new THREE.DirectionalLight(Color.ZINC_400, 18);
    const dirLight2 = new THREE.DirectionalLight(Color.ZINC_400, 13);
    scene.add(dirLight, dirLight2);

    const dirLightTarget = new THREE.Object3D();
    dirLightTarget.position.set(18, -27, -3); // left
    dirLight.add(dirLightTarget);
    dirLight.target = dirLightTarget;

    const dirLightTarget2 = new THREE.Object3D();
    dirLightTarget2.position.set(-1, -3, -3); // behind
    dirLight2.add(dirLightTarget2);
    dirLight2.target = dirLightTarget2;

    [dirLight, dirLight2].forEach((l) => {
      l.castShadow = true;
      l.shadow.mapSize.width = 1024;
      l.shadow.mapSize.height = 1024;
      l.shadow.camera.top = 2.5;
      l.shadow.camera.bottom = -2.5;
      l.shadow.camera.left = -2.5;
      l.shadow.camera.right = 2.5;
      l.shadow.camera.near = 0.1;
      l.shadow.camera.far = 40;
    });
  }

  //#endregion

  //#region Environment

  const groundMat = new THREE.MeshPhysicalMaterial({
    color: Color.STONE_500,
    depthWrite: false,
    metalness: 0,
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), groundMat);

  ground.rotateX(-Math.PI / 2);
  ground.receiveShadow = true;
  ground.name = 'ground0';

  scene.add(ground);

  //#endregion

  //#region Set Render Loop

  const renderLoop = (_timeMs: DOMHighResTimeStamp) => {
    _renderHandle = requestAnimationFrame(renderLoop);

    stats.begin();

    renderFn.forEach((fn) => fn({ deltaS: clock.getDelta() }));
    renderer.render(scene, camera);

    stats.end();
  };

  //#endregion

  return { renderLoop, scene, camera, clock };
}

async function loadModels({
  scene,
  path,
}: {
  scene: THREE.Scene;
  path: typeof PATH;
}) {
  const gltfLoader = new GLTFLoader();

  //#region Load Luke - Adult Male

  const { luke, bindPoseOffset } = await gltfLoader
    .loadAsync(path.character)
    .then((luke) => {
      luke.scene.name = 'luke';

      scene.add(luke.scene);
      gui(luke.scene).visible();

      // Make the offset pose additive
      const [bindPoseOffset] = luke.animations as (
        | THREE.AnimationClip
        | undefined
      )[];
      if (bindPoseOffset) {
        THREE.AnimationUtils.makeClipAdditive(bindPoseOffset);
      }

      // Cast Shadows
      luke.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
        }
      });

      return { luke: luke.scene, bindPoseOffset };
    });

  //#endregion

  //#region Load Adult Male Animations

  const clips = await Promise.all([
    gltfLoader.loadAsync(path.animation.blink).then((blink) => {
      const anim = blink.animations;
      return { blink_fast: anim[0], blink_med: anim[1], blink_slow: anim[2] };
    }),
    gltfLoader.loadAsync(path.animation.emote).then((emote) => {
      const anim = emote.animations;
      return { applause: anim[0], bored: anim[1], cheer: anim[2] };
    }),
    gltfLoader.loadAsync(path.animation.face_idle).then((face_idle) => {
      return face_idle.animations[0];
    }),
    gltfLoader.loadAsync(path.animation.gesture).then((gesture) => {
      const anim = gesture.animations;

      return {
        aggressive: anim[0],
        big: anim[1],
        defense: anim[2],
        generic_a: anim[3],
        generic_b: anim[4],
        generic_c: anim[5],
        heart: anim[6],
        in: anim[7],
        many: anim[8],
        movement: anim[9],
        one: anim[10],
        self: anim[11],
        wave: anim[12],
        you: anim[13],
      };
    }),
    gltfLoader.loadAsync(path.animation.lipsync).then((lipsync) => {
      const anim = lipsync.animations;

      return {
        '@': anim[0],
        a: anim[1],
        e: anim[2],
        E: anim[3],
        f: anim[4],
        i: anim[5],
        k: anim[6],
        o: anim[7],
        O: anim[8],
        p: anim[9],
        r: anim[10],
        s: anim[11],
        S: anim[12],
        sil: anim[13],
        stand_talk: anim[14],
        T: anim[15],
        t: anim[16],
        u: anim[17],
      };
    }),
    gltfLoader.loadAsync(path.animation.stand_idle).then((stand_idle) => {
      return stand_idle.animations[0];
    }),
    gltfLoader.loadAsync(path.animation.poi).then((poi) => {
      const anim = poi.animations;

      return {
        brows_d: anim[0],
        brows_dl: anim[1],
        brows_dr: anim[2],
        brows_l: anim[3],
        brows_neutral: anim[4],
        brows_r: anim[5],
        brows_u: anim[6],
        brows_ul: anim[7],
        brows_ur: anim[8],
        eyes_d: anim[9],
        eyes_dl: anim[10],
        eyes_dr: anim[11],
        eyes_l: anim[12],
        eyes_neutral: anim[13],
        eyes_r: anim[14],
        eyes_u: anim[15],
        eyes_ul: anim[16],
        eyes_ur: anim[17],
        head_d: anim[18],
        head_dl: anim[19],
        head_dr: anim[20],
        head_l: anim[21],
        head_neutral: anim[22],
        head_r: anim[23],
        head_u: anim[24],
        head_ul: anim[25],
        head_ur: anim[26],
      };
    }),
  ]);

  //#endregion

  return {
    luke,
    clip: {
      blink: clips[0],
      emote: clips[1],
      face_idle: clips[2],
      gesture: clips[3],
      lipsync: clips[4],
      stand_idle: clips[5],
      poi: clips[6],
      bindPoseOffset,
    },
  };
}
