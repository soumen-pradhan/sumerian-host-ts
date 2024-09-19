import './App.css';

import { Suspense, useEffect, useRef, useState } from 'react';

import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import { HostObject } from 'hosts-three';
import { AnimationFeature } from 'hosts-three/anim';

import Color from './utils/Color';
import { Bg } from './extras';

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
  texture: {
    cafe: '__ignore/textures/cafe-interior-bg.jpg',
    wood: '__ignore/textures/wood_table_worn.jpg',
  },
} as const;

//#endregion

export default function App() {
  return (
    <Suspense fallback={null}>
      <Canvas>
        <CreateScene />
        <Bg img={PATH.texture.cafe} />

        <LoadModels />
      </Canvas>
    </Suspense>
  );
}

function CreateScene() {
  const camRef = useRef<THREE.PerspectiveCamera>(null!);

  useEffect(() => {
    camRef.current.lookAt(0, 1.5, 0);
  }, [camRef]);

  const [leftDirTarget] = useState(() => new THREE.Object3D());
  const [behindDirTarget] = useState(() => new THREE.Object3D());

  return (
    <>
      <PerspectiveCamera
        makeDefault
        ref={camRef}
        fov={55}
        near={0.1}
        far={1000}
        position={[0, 1.5, 1.2]}
        name="camera0"
      >
        <OrbitControls screenSpacePanning target={[0, 1.5, 0]} />
      </PerspectiveCamera>

      <ambientLight color={Color.SLATE_50} intensity={0.5} />
      <hemisphereLight
        args={[Color.SLATE_700, Color.STONE_500]}
        intensity={2.6}
      />

      <directionalLight
        castShadow
        color={Color.ZINC_400}
        intensity={18}
        shadow-mapSize={[1024, 1024]}
        target={leftDirTarget}
      >
        <primitive
          name="left"
          object={leftDirTarget}
          position={[18, -27, -3]}
        />

        <orthographicCamera
          attach="shadow-camera"
          top={2.5}
          bottom={-2.5}
          left={-2.5}
          right={2.5}
          near={0.1}
          far={40}
        />
      </directionalLight>

      <directionalLight
        castShadow
        color={Color.ZINC_400}
        intensity={13}
        shadow-mapSize={[1024, 1024]}
        target={behindDirTarget}
      >
        <primitive
          name="behind"
          object={behindDirTarget}
          position={[-1, -3, -3]}
        />

        <orthographicCamera
          attach="shadow-camera"
          top={2.5}
          bottom={-2.5}
          left={-2.5}
          right={2.5}
          near={0.1}
          far={40}
        />
      </directionalLight>

      <mesh
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        name="groud0"
      >
        <planeGeometry args={[10, 10]} />
        <meshPhysicalMaterial
          color={Color.STONE_500}
          depthWrite={false}
          metalness={0}
        />
      </mesh>
    </>
  );
}

function LoadModels() {
  const luke = useLoader(GLTFLoader, PATH.character);

  const clipsRaw = useLoader(GLTFLoader, [
    PATH.animation.blink,
    PATH.animation.emote,
    PATH.animation.face_idle,
    PATH.animation.gesture,
    PATH.animation.lipsync,
    PATH.animation.stand_idle,
    PATH.animation.poi,
  ]);

  const hostRef = useRef<HostObject | null>(null);
  const { camera, clock, scene } = useThree();

  useEffect(() => {
    luke.scene.name = 'luke';

    // Cast Shadows
    luke.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
      }
    });

    const clip = loadClips(clipsRaw, luke);
    hostRef.current = createHost({
      three: { camera, clock, scene },
      owner: luke.scene,
      clip,
    });
  }, [luke, clipsRaw]);

  useFrame(() => {
    hostRef.current?.update?.();
  });

  return <primitive object={luke.scene}></primitive>;
}

function loadClips(clipsRaw: GLTF[], luke: GLTF) {
  const anim = clipsRaw.map((cl) => cl.animations);

  // Make the offset pose additive
  const [bindPoseOffset] = luke.animations as (
    | THREE.AnimationClip
    | undefined
  )[];
  if (bindPoseOffset) {
    THREE.AnimationUtils.makeClipAdditive(bindPoseOffset);
  }

  return {
    blink: {
      blink_fast: anim[0][0],
      blink_med: anim[0][1],
      blink_slow: anim[0][2],
    },
    emote: { applause: anim[1][0], bored: anim[1][1], cheer: anim[1][2] },
    face_idle: anim[2][0],
    gesture: {
      aggressive: anim[3][0],
      big: anim[3][1],
      defense: anim[3][2],
      generic_a: anim[3][3],
      generic_b: anim[3][4],
      generic_c: anim[3][5],
      heart: anim[3][6],
      in: anim[3][7],
      many: anim[3][8],
      movement: anim[3][9],
      one: anim[3][10],
      self: anim[3][11],
      wave: anim[3][12],
      you: anim[3][13],
    },
    lipsync: {
      '@': anim[4][0],
      a: anim[4][1],
      e: anim[4][2],
      E: anim[4][3],
      f: anim[4][4],
      i: anim[4][5],
      k: anim[4][6],
      o: anim[4][7],
      O: anim[4][8],
      p: anim[4][9],
      r: anim[4][10],
      s: anim[4][11],
      S: anim[4][12],
      sil: anim[4][13],
      stand_talk: anim[4][14],
      T: anim[4][15],
      t: anim[4][16],
      u: anim[4][17],
    },
    stand_idle: anim[5][0],
    poi: {
      brows_d: anim[6][0],
      brows_dl: anim[6][1],
      brows_dr: anim[6][2],
      brows_l: anim[6][3],
      brows_neutral: anim[6][4],
      brows_r: anim[6][5],
      brows_u: anim[6][6],
      brows_ul: anim[6][7],
      brows_ur: anim[6][8],
      eyes_d: anim[6][9],
      eyes_dl: anim[6][10],
      eyes_dr: anim[6][11],
      eyes_l: anim[6][12],
      eyes_neutral: anim[6][13],
      eyes_r: anim[6][14],
      eyes_u: anim[6][15],
      eyes_ul: anim[6][16],
      eyes_ur: anim[6][17],
      head_d: anim[6][18],
      head_dl: anim[6][19],
      head_dr: anim[6][20],
      head_l: anim[6][21],
      head_neutral: anim[6][22],
      head_r: anim[6][23],
      head_u: anim[6][24],
      head_ul: anim[6][25],
      head_ur: anim[6][26],
    },
    bindPoseOffset,
  };
}

function createHost({
  three,
  owner,
  clip,
}: {
  three: { camera: THREE.Camera; clock: THREE.Clock; scene: THREE.Scene };
  owner: GLTF['scene'];
  clip: ReturnType<typeof loadClips>;
}) {
  const host = new HostObject({ owner, clock: three.clock });

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

  //#endregion

  return host;
}
