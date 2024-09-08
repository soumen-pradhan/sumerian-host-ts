/* eslint-disable @typescript-eslint/no-unused-vars */

import './style.css';

import * as THREE from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { HostObject } from 'hosts-three';
import { AnimationFeature } from 'hosts-three/anim';

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

function gui(m: THREE.Object3D, g = GLOBAL_GUI) {
  Object.defineProperty(window, m.name, { value: m });
  return new ControlGui(m.name, m, g!);
}

type ThreeState = {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  clock: THREE.Clock;
  size: { width: number; height: number; top: number; left: number };
};

type RenderState = ThreeState & { deltaS: number };
const renderFn: ((args: RenderState) => unknown)[] = [];
let _renderHandle: number | undefined;

type ResizeState = ThreeState;
const resizeFn: ((args: ResizeState) => unknown)[] = [];

//#endregion

await main();

async function main() {
  GLOBAL_GUI = new GUI();

  const { renderLoop, scene, camera, clock } = createScene();
  const { luke, clip } = await loadModels({ scene, path: PATH });

  createHost({
    three: { camera, clock, scene },
    owner: luke,
    clip,
  });

  // Animate the render loop only after everything is loaded.

  const pauseBtn = document.createElement('button');
  pauseBtn.classList.toggle('absolute');
  pauseBtn.textContent = 'start';

  pauseBtn.addEventListener('click', () => {
    if (pauseBtn.textContent === 'pause') {
      cancelAnimationFrame(_renderHandle!);
      pauseBtn.textContent = 'start';
    } else {
      _renderHandle = requestAnimationFrame(renderLoop);
      pauseBtn.textContent = 'pause';
    }
  });

  // document.body.append(pauseBtn);
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
      resizeFn.forEach((fn) =>
        fn({
          gl: renderer,
          scene,
          camera,
          clock,
          size: {
            width: renderer.domElement.clientWidth,
            height: renderer.domElement.clientHeight,
            top: renderer.domElement.clientTop,
            left: renderer.domElement.clientLeft,
          },
        })
      );
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
  gui(ground).visible(false);

  //#endregion

  //#region Set Render Loop

  const renderLoop = (_timeMs: DOMHighResTimeStamp) => {
    _renderHandle = requestAnimationFrame(renderLoop);

    stats.begin();

    renderFn.forEach((fn) =>
      fn({
        gl: renderer,
        scene,
        camera,
        clock,
        size: {
          width: renderer.domElement.clientWidth,
          height: renderer.domElement.clientHeight,
          top: renderer.domElement.clientTop,
          left: renderer.domElement.clientLeft,
        },
        deltaS: clock.getDelta(),
      })
    );
    orbitControls.update();
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

function createHost({
  three,
  owner,
  clip,
}: {
  three: { camera: THREE.Camera; clock: THREE.Clock; scene: THREE.Scene };
  owner: GLTF['scene'];
  clip: Awaited<ReturnType<typeof loadModels>>['clip'];
}) {
  const host = new HostObject({ owner, clock: three.clock });
  renderFn.push(() => host.update());

  //#region Animation

  const anim = new AnimationFeature(host);
  host.addFeature(anim);

  // Layers 'Base', 'Face', 'BindPoseOffset'
  // Required for the model to look not deformed
  {
    {
      anim.addLayer('Base');

      anim.addAnimation('Base', clip.stand_idle.name, 'Single', {
        clip: clip.stand_idle,
      });

      anim.playAnimation('Base', clip.stand_idle.name);
    }

    {
      anim.addLayer('Face', { blendMode: 'Additive' });

      const faceSubClip = THREE.AnimationUtils.subclip(
        clip.face_idle,
        clip.face_idle.name,
        1,
        clip.face_idle.duration * 30,
        30
      );

      anim.addAnimation('Face', clip.face_idle.name, 'Single', {
        clip: THREE.AnimationUtils.makeClipAdditive(faceSubClip),
      });

      anim.playAnimation('Face', clip.face_idle.name);
    }

    if (clip.bindPoseOffset !== undefined) {
      anim.addLayer('BindPoseOffset', {
        blendMode: 'Additive',
      });

      const bindPoseSubClip = THREE.AnimationUtils.subclip(
        clip.bindPoseOffset,
        clip.bindPoseOffset.name,
        1,
        2,
        30
      );

      anim.addAnimation('BindPoseOffset', clip.bindPoseOffset.name, 'Single', {
        clip: bindPoseSubClip,
      });

      anim.playAnimation('BindPoseOffset', clip.bindPoseOffset.name);
    }
  }

  // Layer 'Blink'
  {
    anim.addLayer('Blink', { blendMode: 'Additive', transitionMs: 75 });

    // TODO. bug: setTimeout, so that the action is played after the
    // first requestAnimationFrame call, else it will not run. Only for LoopOnce,
    // if infinitely repeating, then no issue
    setTimeout(() => {
      anim.addAnimation('Blink', 'blink', 'Random', {
        playIntervalMs: 5000,
        subStatesOpts: [
          clip.blink.blink_fast,
          clip.blink.blink_med,
          clip.blink.blink_slow,
        ].map((clip) => {
          THREE.AnimationUtils.makeClipAdditive(clip);
          return {
            name: clip.name,
            loopCount: 1,
            clip,
          };
        }),
      });

      anim.playAnimation('Blink', 'blink');
    }, 1000);
  }

  // Talking Idle
  {
    anim.addLayer('Talk', {
      transitionMs: 750,
      blendMode: 'Additive',
    });

    anim.setLayerWeight('Talk', 0);
    const talkClip = clip.lipsync.stand_talk;

    anim.addAnimation('Talk', talkClip.name, 'Single', {
      clip: THREE.AnimationUtils.makeClipAdditive(talkClip),
    });

    anim.playAnimation('Talk', talkClip.name);
  }

  // Gesture animations
  {
    anim.addLayer('Gesture', {
      transitionMs: 500,
      blendMode: 'Additive',
    });

    for (const [name, value] of Object.entries(clip.gesture)) {
      THREE.AnimationUtils.makeClipAdditive(value);
      anim.addAnimation('Gesture', name, 'Single', { clip: value });
    }
  }

  // Emote aniamtions
  {
    anim.addLayer('Emote', { transitionMs: 500 });

    for (const [name, value] of Object.entries(clip.emote)) {
      anim.addAnimation('Emote', name, 'Single', { clip: value, loopCount: 1 });
    }
  }

  //#endregion

  return { host };
}
