import './style.css';
import './utils/Errors';

import * as THREE from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import * as TWEEN from '@tweenjs/tween.js';

import Color from './utils/Color';

import HostObject from './feature/host/HostObject';
import AnimationFeature from './feature/host/AnimationFeature';
import ModelConstants from './utils/ModelConstants';

//#region User Interaction to start and stop the page

(function userInteraction() {
  const consentButton = document.createElement('button');
  consentButton.replaceChildren('I consent');
  consentButton.title = 'Required for audio autoplay';

  consentButton.addEventListener('click', () => {
    consentButton.hidden = true;
    main();
  });

  document.body.append(consentButton);
})();

const cleanupFn: ((...args: any[]) => any)[] = [];
window.addEventListener('beforeunload', () => {
  cleanupFn.forEach((fn) => fn());
});

//#endregion

//#region Globals

const PATH = {
  luke: 'assets/glTF/characters/adult_male/luke/luke.gltf',
  animation: {
    blink: 'assets/glTF/animations/adult_male/blink.glb',
    emote: 'assets/glTF/animations/adult_male/emote.glb',
    face_idle: 'assets/glTF/animations/adult_male/face_idle.glb',
    gesture: 'assets/glTF/animations/adult_male/gesture.glb',
    lipsync: 'assets/glTF/animations/adult_male/lipsync.glb',
    stand_idle: 'assets/glTF/animations/adult_male/stand_idle.glb',
  },
  model: {
    desk: 'assets/glTF/models/standing_desk.glb',
    lamp: 'assets/glTF/models/desk+lamp-gltf.glb',
    laptop: 'assets/glTF/models/S-Laptop.glb',
    banner: 'assets/glTF/models/Hanging_Banner.obj',
    interior: 'assets/glTF/models/interior-empty.glb',
    ceilingLamp: 'assets/glTF/models/ceiling_lamp.glb',
  },
  texture: {
    woodColor: 'assets/textures/worn_planks_diff_4k.jpg',
    bigshyft: 'assets/textures/bigshyft-logo.png',
  },
};

const gltfLoader = new GLTFLoader();

//#endregion

//#region Dev GUI Controls

let GLOBAL_GUI: GUI | undefined;

// Useful to cancel animation loop
let renderHandle: number | undefined = undefined;
const renderFn: ((...args: any) => any)[] = [];

//#endregion

// main();

async function main() {
  GLOBAL_GUI = new GUI();

  const { renderLoop, scene, clock } = await createScene();
  const { luke, clip } = await loadModels({ scene, path: PATH });

  const host = createHost({ owner: luke, clock, clip });

  // Animate the render loop only after everything is loaded.
  renderHandle = requestAnimationFrame(renderLoop);
}

async function createScene() {
  //#region Scene

  const scene = new THREE.Scene();
  scene.background = Color.SLATE_950;
  scene.fog = new THREE.Fog(Color.SLATE_950);

  const clock = new THREE.Clock();

  const stats = new Stats();
  stats.showPanel(0);
  document.body.append(stats.dom);

  const axesHelper = new THREE.AxesHelper(5);
  const gridHelper = new THREE.GridHelper(10, 10);
  scene.add(axesHelper, gridHelper);

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
  const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.set(0, 1.4, 3.1);

  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.target = new THREE.Vector3(0, 0.8, 0);
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
  scene.add(ambientLight);

  gui('Ambient', ambientLight).light();

  //#endregion

  //#region Environment

  const groundGeom = new THREE.PlaneGeometry(10, 10);
  const groundMat = new THREE.MeshStandardMaterial({
    color: Color.NEUTRAL_400,
    depthWrite: false,
    metalness: 0,
  });

  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  //#endregion

  //#region Add Models
  //#endregion

  //#region Set Render Loop

  const renderLoop = (timeMs: DOMHighResTimeStamp) => {
    renderHandle = requestAnimationFrame(renderLoop);

    stats.begin();

    TWEEN.update(timeMs);
    orbitControls.update();

    renderFn.forEach((fn) => fn());
    renderer.render(scene, camera);

    stats.end();
  };

  //#endregion

  return { renderLoop, scene, clock };
}

async function loadModels({ scene, path }: { scene: THREE.Scene; path: typeof PATH }) {
  //#region Load Luke - Adult Male

  const { luke, bindPoseOffset } = await gltfLoader.loadAsync(path.luke).then((luke) => {
    scene.add(luke.scene);

    // Make the offset pose additive
    const [bindPoseOffset] = luke.animations as (THREE.AnimationClip | undefined)[];
    if (bindPoseOffset) {
      THREE.AnimationUtils.makeClipAdditive(bindPoseOffset);
    }

    const lukeAudioAttach =
      luke.scene.getObjectByName(ModelConstants.audioAttachJoint1) ??
      throwErr(`Model ${path.luke} lacks prop: ${ModelConstants.audioAttachJoint1}`);

    // Cast Shadows
    luke.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });

    gui('Luke', luke.scene).pos().rot().scale().visible();

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
  ]);

  //#endregion

  //#region Load Textures
  //#endregion

  //#region Desk

  await gltfLoader.loadAsync(path.model.desk).then((desk) => {
    desk.scene.position.set(0, 0, 0.7);
    scene.add(desk.scene);
    gui('Desk', desk.scene).pos().rot().scale().visible();
  });

  //#endregion

  //#region Laptop

  await gltfLoader.loadAsync(path.model.laptop).then((laptop) => {
    laptop.scene.position.set(0, 0.28, 0.1);
    laptop.scene.rotation.set(0, 3.3, 0);
    laptop.scene.scale.set(1, 1, 1);

    scene.add(laptop.scene);
    gui('Laptop', laptop.scene).pos().rot().scale().visible();
  });

  //#endregion

  //#region Wall of Light

  const rectLight = new THREE.RectAreaLight(Color.SKY_100, 10, 2.6, 1.9);
  rectLight.position.set(-3.1, 1.4, -0.52);
  rectLight.rotation.set(0, -1.57, 0);
  rectLight.visible = false;

  scene.add(rectLight, new RectAreaLightHelper(rectLight));

  gui('Wall of Light', rectLight).pos().rot().scale().visible().color().dim();

  //#endregion

  //#region Interior

  await gltfLoader.loadAsync(path.model.interior).then((interior) => {
    const room = interior.scene;

    room.position.set(-2, 0, 2);
    room.rotation.set(0, -1.57, 0);

    scene.add(room);

    room.children[3].receiveShadow = true; // Rug
    room.children[4].receiveShadow = true; // Plane

    {
      const sphereMesh = room.children[2] as THREE.Mesh;
      const sphereMat = new THREE.MeshPhysicalMaterial({
        color: Color.SKY_100,
        transmission: 1,
        roughness: 0.5,
        thickness: 0,
        metalness: 0.4,
      });
      sphereMesh.material = sphereMat;

      const rimMesh = sphereMesh.children[0] as THREE.Mesh;
      const rimMat = new THREE.MeshPhysicalMaterial({
        color: Color.SLATE_950,
        transmission: 1,
        roughness: 0,
        thickness: 0,
        metalness: 0.4,
      });
      rimMesh.material = rimMat;

      {
        const roomGui = gui('Interior', room).pos().rot().scale().visible();
        roomGui.gui
          .add({ wireframe: false }, 'wireframe')
          .onChange((v) => showWireframe(room, v));

        gui('Ceiling Sphere', sphereMat, roomGui.gui).mat();
        gui('Ceiling Mat', rimMat, roomGui.gui).mat();
      }
    }
  });

  //#endregion

  //#region Ceiling SemiCircle Light

  const ceilLight = new THREE.PointLight(Color.SKY_100, 10);
  ceilLight.position.set(-0.38, 2.55, 0.4);
  ceilLight.castShadow = true;

  const ceilLightHelper = new THREE.PointLightHelper(ceilLight, 0.1, Color.SLATE_50);
  scene.add(ceilLight, ceilLightHelper);
  gui('Ceil Circle Light', ceilLight).pos().visible().light();

  //#endregion

  //#region Standing lamp Light

  const standingLampLight = new THREE.PointLight(Color.AMBER_100, 10);
  standingLampLight.position.set(1.23, 1.1, -2);
  standingLampLight.castShadow = true;

  const standingLampHelper = new THREE.PointLightHelper(
    standingLampLight,
    0.1,
    Color.SLATE_50
  );

  scene.add(standingLampLight, standingLampHelper);
  gui('Standing Lamp', standingLampLight).pos().visible().light();

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
      bindPoseOffset,
    },
  };
}

function createHost({
  owner,
  clock,
  clip,
}: {
  owner: GLTF['scene'];
  clock: THREE.Clock;
  clip: UnwrapPromise<ReturnType<typeof loadModels>>['clip'];
}) {
  const host = new HostObject({ owner, clock });
  renderFn.push(() => host.update());

  //#region AnimationFeature

  const animFeature = new AnimationFeature(host);
  host.addFeature(animFeature);

  // Base Layer
  {
    const baseLayer = animFeature.addLayer({ name: 'Base' });
    const baseIdleHandle = baseLayer.addSingleAnimation({ clip: clip.stand_idle });
    baseLayer.playAnimation(baseIdleHandle);
  }

  // Face Layer
  {
    const faceLayer = animFeature.addLayer({ name: 'Face', blendMode: 'Additive' });

    THREE.AnimationUtils.makeClipAdditive(clip.face_idle);
    const subclip = THREE.AnimationUtils.subclip(
      clip.face_idle,
      clip.face_idle.name,
      1,
      clip.face_idle.duration * 30,
      30
    );

    const faceIdleHandle = faceLayer.addSingleAnimation({ clip: subclip });
    faceLayer.playAnimation(faceIdleHandle, { transitionTimeS: 4 });
  }

  // bindPoseOffset if it exists. No Effect ??
  {
    if (clip.bindPoseOffset) {
      const bindPoseLayer = animFeature.addLayer({
        name: 'BindPoseOffset',
        blendMode: 'Additive',
      });

      const bindPoseHandle = bindPoseLayer.addSingleAnimation({
        clip: THREE.AnimationUtils.subclip(
          clip.bindPoseOffset,
          clip.bindPoseOffset.name,
          1,
          2,
          30
        ),
      });

      bindPoseLayer.playAnimation(bindPoseHandle);
    }
  }

  //#endregion
}

//#region Debug Gui Controllers

function gui(name: string, model: any, localGui = GLOBAL_GUI) {
  return new ControlGui(name, model, localGui);
}

class ControlGui {
  #gui: GUI;
  get gui() {
    return this.#gui;
  }
  #model: THREE.Object3D;

  constructor(name: string, model: any, localGui = GLOBAL_GUI) {
    this.#gui = localGui!.addFolder(name);
    this.#gui.close();
    this.#model = model;
  }

  pos() {
    this.#gui.add(this.#model.position, 'x');
    this.#gui.add(this.#model.position, 'y');
    this.#gui.add(this.#model.position, 'z');
    return this;
  }

  rot() {
    this.#gui.add(this.#model.rotation, 'x').name('euler.x');
    this.#gui.add(this.#model.rotation, 'y').name('euler.y');
    this.#gui.add(this.#model.rotation, 'z').name('euler.z');
    return this;
  }

  scale() {
    this.#gui
      .add(this.#model.scale, 'x')
      .name('scale')
      .onChange((x) => this.#model.scale.set(x, x, x));
    return this;
  }

  visible() {
    this.#gui.add(this.#model, 'visible');
    return this;
  }

  light() {
    if (this.#model instanceof THREE.Light) {
      this.#gui.add(this.#model, 'intensity');
      this.#gui.addColor(this.#model, 'color');
    }
    return this;
  }

  mat() {
    if (this.#model instanceof THREE.Material) {
    }
    if (this.#model instanceof THREE.MeshStandardMaterial) {
      this.#gui.addColor(this.#model, 'color');
      this.#gui.add(this.#model, 'roughness');
      this.#gui.add(this.#model, 'metalness');
    }
    if (this.#model instanceof THREE.MeshPhysicalMaterial) {
      this.#gui.add(this.#model, 'transmission');
      this.#gui.add(this.#model, 'thickness');
    }
    return this;
  }

  color() {
    if ('color' in this.#model) {
      this.#gui.addColor(this.#model, 'color');
    }
    return this;
  }

  dim() {
    if ('width' in this.#model && 'height' in this.#model) {
      this.#gui.add(this.#model as { width: number }, 'width');
      this.#gui.add(this.#model as { height: number }, 'height');
    }

    return this;
  }
}

function showWireframe(model: GLTF['scene'], show = true) {
  model.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;

    let mat = (child as THREE.Mesh).material;
    if (!Array.isArray(mat)) mat = [mat];

    for (let m of mat) (m as any).wireframe = show;
  });
}

//#endregion
