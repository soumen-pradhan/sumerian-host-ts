import './style.css';
import './utils/Errors';

import * as THREE from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import * as TWEEN from '@tweenjs/tween.js';

import {
  AMBER_400,
  NEUTRAL_400,
  SKY_200,
  SLATE_50,
  SLATE_700,
  SLATE_950,
} from './utils/Color';

import HostObject from './feature/host/HostObject';
import AnimationFeature from './feature/host/AnimationFeature';
import ModelConstants from './utils/ModelConstants';
import Deferred from './utils/Deferred';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const paths = {
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
  },
  texture: {
    woodColor: 'assets/textures/worn_planks_diff_4k.jpg',
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

const gui = new GUI();
const stats = new Stats();
stats.showPanel(0);
document.body.append(stats.dom);

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

function test() {
  const sleep = (ms: number) => new Promise<void>((res) => setTimeout(() => res(), ms));

  const startPromiseButton = document.createElement('button');
  startPromiseButton.replaceChildren('Start');

  let def = Deferred.canceled('');

  startPromiseButton.addEventListener('click', () => {
    def = new Deferred((res, rej, cancel) => {
      sleep(3000)
        .then(() => res('Deferred done'))
        .catch((e) => rej(e));
    });

    def.then(console.log);
  });

  const cancelButton = document.createElement('button');
  cancelButton.replaceChildren('Cancel');

  cancelButton.addEventListener('click', () => {
    def.cancel('Deferred canceled');
  });

  document.body.append(startPromiseButton, cancelButton);
}

async function main() {
  const { scene, camera, clock, groundMat } = createScene();

  const {
    character: charLuke,
    clips,
    bindPoseOffsetClip,
  } = await loadCharacter(scene, paths.luke, paths.animation);

  const lukeAudioAttach1 =
    charLuke.getObjectByName(ModelConstants.audioAttachJoint1) ??
    throwErr(`The loaded models lack properties: ${ModelConstants.audioAttachJoint1}`);

  charLuke.position.set(0, 0, 0);
  // character.rotateY(-0.5);

  const gltfLoader = new GLTFLoader();

  const addControls = (name: string, model: GLTF['scene']) => {
    const modelGui = gui.addFolder(name);
    modelGui.add(model.position, 'x');
    modelGui.add(model.position, 'y');
    modelGui.add(model.position, 'z');

    modelGui.add(model.rotation, 'x').name('Euler.x');
    modelGui.add(model.rotation, 'y').name('Euler.y');
    modelGui.add(model.rotation, 'z').name('Euler.z');

    modelGui
      .add(model.scale, 'x')
      .name('scale')
      .onChange((v) => model.scale.set(v, v, v));

    modelGui.add(model, 'visible');

    return modelGui;
  };

  const addGlTFModel = (
    path: string,
    name: string,
    hook?: (model: GLTF['scene']) => any
  ) => {
    return gltfLoader
      .loadAsync(path)
      .then((model) => {
        scene.add(model.scene);
        hook?.(model.scene);
        return model.scene;
      })
      .then((group) => {
        const modelGui = addControls(name, group);
        modelGui.close();
        return group;
      });
  };

  addControls('Luke', charLuke).close();

  const [woodTexture] = await Promise.all([
    new THREE.TextureLoader().loadAsync(paths.texture.woodColor),
  ]);

  woodTexture.wrapS = THREE.RepeatWrapping;
  woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(4, 4);

  await Promise.all([
    addGlTFModel(paths.model.desk, 'Desk', (desk) => {
      desk.position.set(0, 0, 0.7);
    }),
    addGlTFModel(paths.model.lamp, 'Lamp', (lamp) => {
      lamp.position.set(1.1, 1.07, 2.1);
      lamp.scale.set(0.04, 0.04, 0.04);

      const bulbMesh = lamp.children[0].children[2] as THREE.Mesh;
      (bulbMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5;
    }),
    addGlTFModel(paths.model.laptop, 'Laptop', (laptop) => {
      laptop.position.set(0, 0.28, 0.1);
      laptop.rotation.set(0, 3.3, 0);
      laptop.scale.set(1, 1, 1);
    }),
    // new OBJLoader().loadAsync(paths.model.banner).then((banner) => {
    //   const left = banner.children[0] as THREE.Mesh;
    //   const mat = left.material as THREE.MeshPhongMaterial;

    //   scene.add(banner);
    //   addControls('Banner', banner).close();
    // }),
  ]);

  groundMat.map = woodTexture;
  woodTexture.needsUpdate = true;
  woodTexture.colorSpace = THREE.SRGBColorSpace;

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  {
    const pointLight = new THREE.PointLight(AMBER_400, 4);
    pointLight.castShadow = true;
    pointLight.position.set(-0.45, 1.36, 0.53);

    scene.add(pointLight);

    const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.1, SLATE_50);
    scene.add(pointLightHelper);

    const pointLightGui = gui.addFolder('Lamp Light');
    pointLightGui.add(pointLight.position, 'x');
    pointLightGui.add(pointLight.position, 'y');
    pointLightGui.add(pointLight.position, 'z');
    pointLightGui.add(pointLight, 'intensity');
    pointLightGui
      .add(pointLight, 'visible')
      .onChange((v) => (pointLightHelper.visible = v));

    pointLightGui.close();
  }

  {
    const rectLight = new THREE.RectAreaLight(SKY_200, 0, 40, 20);
    rectLight.position.setX(-10);
    rectLight.rotation.set(0, -1.57, 0);
    rectLight.visible = false;

    const rectLightHelper = new RectAreaLightHelper(rectLight);
    rectLight.add(rectLightHelper);

    scene.add(rectLight);

    const rectLightGui = gui.addFolder('Wall of Light');

    rectLightGui.add(rectLight, 'width');
    rectLightGui.add(rectLight, 'height');

    rectLightGui.add(rectLight.position, 'x');
    rectLightGui.add(rectLight.position, 'y');
    rectLightGui.add(rectLight.position, 'z');

    rectLightGui.add(rectLight.rotation, 'x').name('Euler.x');
    rectLightGui.add(rectLight.rotation, 'y').name('Euler.y');
    rectLightGui.add(rectLight.rotation, 'z').name('Euler.z');

    rectLightGui.add(rectLight, 'intensity');
    rectLightGui.add(rectLight, 'visible');
    rectLightGui.close();
  }

  const { host } = createHost({
    owner: charLuke,
    clock,
    camera,
    clips,
    bindPoseOffsetClip,
    audioAttach: lukeAudioAttach1,
  });

  // // initUx
  // {
  //   const buttonContainer = document.createElement('div');
  //   buttonContainer.classList.add('absolute', 'top-1', 'left-1', 'flex', 'gap-2');
  //   document.body.append(buttonContainer);

  //   const textarea = document.createElement('textarea');
  //   textarea.cols = 60;
  //   textarea.rows = 12;
  //   textarea.readOnly = true;
  //   textarea.classList.add('absolute');
  //   document.body.append(textarea);

  //   const playButton = document.createElement('button');
  //   playButton.replaceChildren('Play');

  //   playButton.addEventListener('click', () => {
  //     let currMs = performance.now();
  //     textToSpeakFeature.play('');

  //     Msg.listen('viseme', (msg) => {
  //       textarea.textContent += `${(performance.now() - currMs).toFixed(2)}: ${msg}\n`;
  //       // console.log(`${(performance.now() - currMs).toFixed(2)}: ${msg}`);
  //     });
  //   });

  //   const pauseButton = document.createElement('button');
  //   pauseButton.replaceChildren('Pause');

  //   pauseButton.addEventListener('click', () => {
  //     textToSpeakFeature.pause();
  //     console.log('paused');
  //   });

  //   const resumeButton = document.createElement('button');
  //   resumeButton.replaceChildren('Resume');

  //   resumeButton.addEventListener('click', () => {
  //     textToSpeakFeature.resume('');
  //     console.log('resumed');
  //   });

  //   buttonContainer.append(playButton, pauseButton, resumeButton);
  // }

  // Animate the render loop only after everything is loaded.
  renderHandle = requestAnimationFrame(renderLoop);
}

function createScene() {
  // Scene
  const scene = new THREE.Scene();
  scene.background = SLATE_950;
  scene.fog = new THREE.Fog(SLATE_950);

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

  // TODO Use a resizeobserver instead
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
  // const hemiLight = new THREE.HemisphereLight(SLATE_950, YELLOW_950, 0.6);
  // hemiLight.position.set(0, 1, 0);
  // scene.add(hemiLight);

  // const dirLight = new THREE.DirectionalLight(NEUTRAL_50);
  // dirLight.position.set(0, 5, 5);
  // dirLight.castShadow = true;

  // {
  //   const dirLightFolder = gui.addFolder('Dir Light');
  //   const N = 1000;
  //   dirLightFolder.add(dirLight.position, 'x', -N, N);
  //   dirLightFolder.add(dirLight.position, 'y', -N, N);
  //   dirLightFolder.add(dirLight.position, 'z', -N, N);
  // }

  // dirLight.shadow.mapSize.width = 1024;
  // dirLight.shadow.mapSize.height = 1024;
  // dirLight.shadow.camera.top = 2.5;
  // dirLight.shadow.camera.bottom = -2.5;
  // dirLight.shadow.camera.left = -2.5;
  // dirLight.shadow.camera.right = 2.5;
  // dirLight.shadow.camera.near = 0.1;
  // dirLight.shadow.camera.far = 40;
  // scene.add(dirLight);

  // const dirLightTarget = new THREE.Object3D();
  // dirLight.add(dirLightTarget);
  // dirLightTarget.position.set(0, -0.5, -1.0);
  // dirLight.target = dirLightTarget;

  // {
  //   const dirLightTargetFolder = gui.addFolder('Dir Light Target');
  //   const N = 1000;
  //   dirLightTargetFolder.add(dirLightTarget.position, 'x', -N, N);
  //   dirLightTargetFolder.add(dirLightTarget.position, 'y', -N, N);
  //   dirLightTargetFolder.add(dirLightTarget.position, 'z', -N, N);
  // }

  const ambientLight = new THREE.AmbientLight(SLATE_50, 1);
  scene.add(ambientLight);

  // Environment
  const groundMat = new THREE.MeshStandardMaterial({
    color: NEUTRAL_400,
    depthWrite: false,
    metalness: 0,
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Render Loop
  renderLoop = (timeMs: DOMHighResTimeStamp) => {
    renderHandle = requestAnimationFrame(renderLoop);
    stats.begin();
    TWEEN.update(timeMs);
    controls.update();
    renderFn.forEach((fn) => void fn());
    renderer.render(scene, camera);
    stats.end();
  };

  return { scene, camera, clock, groundMat };
}

async function loadCharacter(
  scene: THREE.Scene,
  characterPath: string,
  animationPaths: AnimationPathMap
): Promise<{
  character: THREE.Group<THREE.Object3DEventMap>;
  clips: AnimationClipMap;
  bindPoseOffsetClip: THREE.AnimationClip;
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
  const [bindPoseOffsetClip] = characterGLTF.animations;
  if (bindPoseOffsetClip) {
    THREE.AnimationUtils.makeClipAdditive(bindPoseOffsetClip);
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

  return { character, clips, bindPoseOffsetClip };
}

function createHost(opts: {
  owner: GLTF['scene'];
  clock: THREE.Clock;
  camera: THREE.Camera;
  clips: AnimationClipMap;
  bindPoseOffsetClip?: THREE.AnimationClip;
  audioAttach: THREE.Object3D<THREE.Object3DEventMap>;
}) {
  const host = new HostObject({ owner: opts.owner, clock: opts.clock });
  renderFn.push(() => host.update());

  //#region TextToSpeakFeature
  // const listener = new THREE.AudioListener();
  // opts.camera.add(listener);
  // const textToSpeakFeature = new TextToSpeakFeature(host, {
  //   listener,
  //   attachTo: opts.audioAttach,
  // });
  // host.addFeature(textToSpeakFeature);
  //#endregion

  //#region Animation Feature

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

  // Face Layer. No Effect ??
  {
    const faceLayer = animFeature.addLayer({
      name: 'Face',
      blendMode: 'Additive',
    });

    const faceIdleClip = opts.clips.face_idle[0];
    THREE.AnimationUtils.makeClipAdditive(faceIdleClip);
    const subclip = THREE.AnimationUtils.subclip(
      faceIdleClip,
      faceIdleClip.name,
      1,
      faceIdleClip.duration * 30,
      30
    );

    const faceIdleHandle = faceLayer.addSingleAnimation({ clip: subclip });
    faceLayer.playAnimation(faceIdleHandle, { transitionTimeS: 4 });
  }

  // Blink Layer
  {
    const blinkLayer = animFeature.addLayer({
      name: 'Blink',
      blendMode: 'Additive',
    });

    const blinkClips = opts.clips.blink;
    blinkClips.forEach((c) => THREE.AnimationUtils.makeClipAdditive(c));

    const blinkHandle = blinkLayer.addRandomAnimation({
      name: 'blink',
      playIntervalS: 3,
      subStateOpts: blinkClips.map((clip) => {
        const clipChecked = blinkLayer.mixer.existingAction(clip) ? clip.clone() : clip;
        const action = blinkLayer.mixer.clipAction(clipChecked);

        return {
          name: clipChecked.name,
          action,
          loopCount: 1,
        };
      }),
    });

    blinkLayer.playAnimation(blinkHandle);
  }

  // Talking Idle Layer
  {
    // const talkingIdleLayer = animFeature.addLayer({
    //   name: 'Talk',
    //   transitionTimeS: 0.75,
    //   blendMode: 'Additive',
    // });
    // // TODO add a weight to the layer
    // const standTalkClip = opts.clips.lipsync[14];
    // const talkingAnimHandle = talkingIdleLayer.addSingleAnimation({
    //   clip: THREE.AnimationUtils.makeClipAdditive(standTalkClip),
    // });
    // talkingIdleLayer.playAnimation(talkingAnimHandle);
  }

  // Viseme Layer
  {
    // const visemeLayer = animFeature.addLayer({
    //   name: 'Viseme',
    //   transitionTimeS: 0.12,
    //   blendMode: 'Additive',
    // });
    // // TODO Layer Weight
    // const visemeBlendHandle = visemeLayer.addFreeBlendAnimation({
    //   name: 'visemes',
    //   blendStatesOpts: opts.clips.lipsync.map((clip) => {
    //     THREE.AnimationUtils.makeClipAdditive(clip);
    //     const subClip = THREE.AnimationUtils.subclip(clip, clip.name, 1, 2, 30);
    //     const clipChecked = visemeLayer.mixer.existingAction(subClip)
    //       ? subClip.clone()
    //       : subClip;
    //     const action = visemeLayer.mixer.clipAction(clipChecked);
    //     return {
    //       name: clipChecked.name,
    //       action,
    //       weight: 0,
    //     };
    //   }),
    // });
    // visemeLayer.playAnimation(visemeBlendHandle);
  }

  // bindPoseOffset if it exists. No Effect ??
  if (opts.bindPoseOffsetClip) {
    const bindPoseLayer = animFeature.addLayer({
      name: 'BindPoseOffset',
      blendMode: 'Additive',
    });

    const bindPoseHandle = bindPoseLayer.addSingleAnimation({
      clip: THREE.AnimationUtils.subclip(
        opts.bindPoseOffsetClip,
        opts.bindPoseOffsetClip.name,
        1,
        2,
        30
      ),
    });

    bindPoseLayer.playAnimation(bindPoseHandle);
  }

  //#endregion

  return { host };
}
