import './App.css';

import { Suspense, useEffect, useRef, useState } from 'react';

import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import type { MeshProps } from '@react-three/fiber';

import Color from './utils/Color';

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
  const camRef = useRef<THREE.PerspectiveCamera>(null);

  useEffect(() => {
    camRef.current?.lookAt?.(0, 1.5, 0);
  }, []);

  return (
    <Suspense fallback={null}>
      <Canvas
        scene={{
          background: Color.SLATE_700,
          fog: new THREE.Fog(Color.SLATE_700),
        }}
      >
        <CreateScene />
        <Bg />
        {/* <Snowing img={PATH.texture.cafe} /> */}
        {/* <Box position={[0, 0, 0]} /> */}

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

  useEffect(() => {
    luke.scene.name = 'luke';

    // Cast Shadows
    luke.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
      }
    });
  }, [luke]);

  return <primitive object={luke.scene}></primitive>;
}

function Bg() {
  const bgTex = useLoader(THREE.TextureLoader, PATH.texture.cafe);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  bgTex.wrapS = bgTex.wrapT = THREE.RepeatWrapping;
  const { scene, gl } = useThree();

  new ResizeObserver((entries) => {
    for (const e of entries) {
      const canvasAspect = e.contentRect.width / e.contentRect.height;
      const image = bgTex.image as HTMLImageElement;
      const imageAspect = image.width / image.height;
      const factor = imageAspect / canvasAspect;

      // When factor larger than 1, that means texture 'wilder' than target。
      // we should scale texture height to target height and then 'map' the center  of texture to target， and vice versa.
      bgTex.offset.x = factor > 1 ? (1 - 1 / factor) / 2 : 0;
      bgTex.repeat.x = factor > 1 ? 1 / factor : 1;
      bgTex.offset.y = factor > 1 ? 0 : (1 - factor) / 2;
      bgTex.repeat.y = factor > 1 ? 1 : factor;
    }
  }).observe(gl.domElement);

  useEffect(() => {
    scene.background = bgTex;
  }, [bgTex, scene]);

  return null;
}

function Snowing(props: MeshProps & { img: string }) {
  const bgTex = useLoader(THREE.TextureLoader, props.img);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  bgTex.wrapS = bgTex.wrapT = THREE.RepeatWrapping;

  //#region Shader

  // https://stackoverflow.com/questions/24820004/how-to-implement-a-shadertoy-shader-in-three-js
  // https://www.shadertoy.com/view/ldsGDn

  const vertexShader = /* glsl */ `

  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }

  `;

  const fragmentShader = /* glsl */ `

  uniform float iTime;
  uniform sampler2D bg;

  varying vec2 vUv;

  // #define LIGHT_SNOW // Comment this out for a blizzard

  #ifdef LIGHT_SNOW
    #define LAYERS 50
    #define DEPTH .5
    #define WIDTH .3
    #define SPEED .6
  #else // BLIZZARD
    #define LAYERS 200
    #define DEPTH .1
    #define WIDTH .8
    #define SPEED 1.5
  #endif

  float snowing(vec2 uv, vec2 fragCoord) {
    const mat3 p = mat3(
      13.323122, 23.5112, 21.71123,
      21.1212,   28.7312, 11.9312,
      21.8112,   14.7212, 61.3934
    );

    float acc = 0.0;
    float dof = 4.0 * sin(iTime * 0.1);

    for (int i = 2; i < LAYERS; i++) {
      float fi = float(i);

      vec2 q = uv * (1.0 + fi * DEPTH);
      q += vec2(
        q.y * (WIDTH * mod(fi * 7.238917, 1.0) - WIDTH * 0.5),
        SPEED * iTime / 1.0 + fi * DEPTH * 0.03
      );

      vec3 n = vec3(floor(q), 31.189 + fi);
      vec3 m = floor(n) * 0.00001 + fract(n);
      vec3 mp = (31415.9 + m) / fract(m * p);
      vec3 r = fract(mp);

      vec2 s = abs(mod(q, 1.0) - 0.5 + 0.9 * r.xy - 0.45);
      s += 0.01 * abs(2.0 * fract(10.0 * q.yx) - 1.0);

      float d = 0.6 * max(s.x - s.y, s.x + s.y) + max(s.x, s.y) - 0.01;
      float edge = 0.005 + 0.05 * min(0.5 * abs(fi - 5.0 - dof), 1.0);

      acc += smoothstep(edge, -edge, d) * (r.x / (1.0 + 0.02 * fi * DEPTH));
    }

    return acc;
  }

  void main() {
    vec2 uv = -1.0 + 2.0 * vUv;

    vec4 textureColor = texture2D(bg, vUv);
    float snowOut = snowing(uv, vUv);

    float luminance = dot(textureColor.rgb, vec3(0.299, 0.587, 0.114));
    float threshold = 0.1;

    float snowFactor = smoothstep(threshold, 1.0, luminance);
    snowOut = snowFactor * snowOut;

    gl_FragColor = mix(textureColor * vec4(1.01), vec4(1.0), snowOut);
  }

  `;

  //#endregion

  const uniforms = {
    iTime: { value: 0.1 },
    bg: { value: bgTex },
  } satisfies THREE.ShaderMaterialParameters['uniforms'];

  useFrame((state, delta) => {
    uniforms.iTime.value += delta;
  });

  return (
    <mesh position={[0, 1.5, -0.8]} scale={[6, 6, 6]}>
      <planeGeometry args={[0.6, 0.6]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

function Box(props: MeshProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((_state, delta) => (meshRef.current.rotation.x += delta));

  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}
