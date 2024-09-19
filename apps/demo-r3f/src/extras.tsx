import * as THREE from 'three';
import {
  useFrame,
  useLoader,
  useThree,
  type MeshProps,
} from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';

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

  // #define SMOOTH // To filter out window softly
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
    
    #ifdef SMOOTH
      float threshold = 0.1;
      float snowFactor = smoothstep(threshold, 1.0, luminance);
    #else
      float threshold = 0.5;
      float snowFactor = step(threshold, luminance);
    #endif
    
    snowOut = snowFactor * snowOut;

    gl_FragColor = mix(textureColor, vec4(1.0), snowOut);

    #include <colorspace_fragment>
  }

  `;

//#endregion

export function Snowing(props: MeshProps & { img: string }) {
  const bgTex = useLoader(THREE.TextureLoader, props.img);

  const uniforms = {
    iTime: { value: 0.1 },
    bg: { value: bgTex },
  } satisfies THREE.ShaderMaterialParameters['uniforms'];

  useFrame((state, delta) => {
    uniforms.iTime.value += delta;
  });

  return (
    <mesh {...props} name="snow0" position={[0, 1.5, -0.8]} scale={[6, 6, 6]}>
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

export function Bg(props: { img: string }) {
  const bgTex = useLoader(THREE.TextureLoader, props.img);
  const { scene, gl } = useThree();

  useEffect(() => {
    bgTex.colorSpace = THREE.SRGBColorSpace;
    bgTex.wrapS = bgTex.wrapT = THREE.RepeatWrapping;

    scene.background = bgTex;

    const resizer = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.target !== gl.domElement) continue;

        // fixBgAspect
        const canvasAspect = e.contentRect.width / e.contentRect.height;
        const image = bgTex.image as HTMLImageElement;
        const imageAspect = image.width / image.height;
        const factor = imageAspect / canvasAspect;

        // When factor larger than 1, that means texture 'wider' than target。
        // we should scale texture height to target height and then 'map' the center
        // of texture to target， and vice versa.
        bgTex.offset.x = factor > 1 ? (1 - 1 / factor) / 2 : 0;
        bgTex.repeat.x = factor > 1 ? 1 / factor : 1;
        bgTex.offset.y = factor > 1 ? 0 : (1 - factor) / 2;
        bgTex.repeat.y = factor > 1 ? 1 : factor;
      }
    });

    resizer.observe(gl.domElement);

    return () => {
      resizer.disconnect();
    };
  }, [bgTex, scene, gl]);

  return null;
}

export function VidBg(props: { vid?: string }) {
  const { scene, gl } = useThree();

  useEffect(() => {
    const video = document.createElement('video');
    video.autoplay = true;
    video.loop = true;
    video.muted = true; // Mute to avoid feedback noise

    const bgTex = new THREE.VideoTexture(video);
    bgTex.minFilter = THREE.LinearFilter;
    bgTex.wrapS = bgTex.wrapT = THREE.RepeatWrapping;

    const resizer = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.target !== gl.domElement) continue;

        // fixBgAspect
        const canvasAspect = e.contentRect.width / e.contentRect.height;
        const imageAspect = video.videoWidth / video.videoHeight;
        const factor = imageAspect / canvasAspect;

        // When factor larger than 1, that means texture 'wider' than target。
        // we should scale texture height to target height and then 'map' the center
        // of texture to target， and vice versa.
        bgTex.offset.x = factor > 1 ? (1 - 1 / factor) / 2 : 0;
        bgTex.repeat.x = factor > 1 ? 1 / factor : 1;
        bgTex.offset.y = factor > 1 ? 0 : (1 - factor) / 2;
        bgTex.repeat.y = factor > 1 ? 1 : factor;
      }
    });

    const canPlayListener = () => {
      scene.background = bgTex;
      resizer.observe(gl.domElement);
    };

    if (props.vid) {
      video.src = props.vid;
      video.play();
    } else {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        video.srcObject = stream;
        video.play();
      });
    }

    video.addEventListener('canplay', canPlayListener);

    return () => {
      video.pause();
      video.srcObject = null;
      video.removeEventListener('canplay', canPlayListener);
      resizer.disconnect();
    };
  }, [scene, gl]);

  return null;
}
