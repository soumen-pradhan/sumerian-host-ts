import * as THREE from 'three';

export async function snowing(scene: THREE.Scene, img: string) {
  const snowGeom = new THREE.PlaneGeometry(0.6, 0.6);

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

  const bgTex = await new THREE.TextureLoader().loadAsync(img);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  bgTex.wrapS = bgTex.wrapT = THREE.RepeatWrapping;

  const uniforms = {
    iTime: { value: 0.1 },
    bg: { value: bgTex },
  } satisfies THREE.ShaderMaterialParameters['uniforms'];

  const snowMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
  });

  const snow = new THREE.Mesh(snowGeom, snowMat);
  snow.name = 'snow0';
  snow.position.set(0, 1.5, -0.8);
  snow.scale.set(6, 6, 6);

  scene.add(snow);

  return {
    snow,
    render({ deltaS }: { deltaS: number }) {
      uniforms.iTime.value += deltaS;
    },
  };
}

export function videoBg(scene: THREE.Scene) {
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true; // Mute to avoid feedback noise

  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;
    video.play();
  });

  // video.src = PATH.vid.mp4;
  // video.play();

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter; // Optionally set the filtering
  videoTexture.wrapS = THREE.RepeatWrapping;
  videoTexture.wrapT = THREE.RepeatWrapping;

  let videoCanplay = false;

  function fixBgAspect({
    size,
    scene,
  }: {
    size: { width: number; height: number };
    scene: THREE.Scene;
  }) {
    if (
      videoCanplay &&
      (scene.background as THREE.VideoTexture).isVideoTexture
    ) {
      const canvasAspect = size.width / size.height;
      const imageAspect = video.videoWidth / video.videoHeight;
      const factor = imageAspect / canvasAspect;

      // When factor larger than 1, that means texture 'wilder' than target。
      // we should scale texture height to target height and then 'map' the center  of texture to target， and vice versa.
      const bg = scene.background as THREE.VideoTexture;
      bg.offset.x = factor > 1 ? (1 - 1 / factor) / 2 : 0;
      bg.repeat.x = factor > 1 ? 1 / factor : 1;
      bg.offset.y = factor > 1 ? 0 : (1 - factor) / 2;
      bg.repeat.y = factor > 1 ? 1 : factor;
    }
  }

  // Wait for the video to be ready before using the texture
  video.addEventListener('canplay', () => {
    scene.background = videoTexture;
    videoCanplay = true;

    const domElement = document.getElementById('renderCanvas');
    if (domElement instanceof HTMLCanvasElement) {
      fixBgAspect({
        size: {
          width: domElement.clientWidth,
          height: domElement.clientHeight,
        },
        scene,
      });
    }
  });

  return { resize: fixBgAspect };
}

export async function imgBg(scene: THREE.Scene, img: string) {
  const textureLoader = new THREE.TextureLoader();
  const tex = await textureLoader.loadAsync(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;

  function fixBgAspect({
    size,
    scene,
  }: {
    size: { width: number; height: number };
    scene: THREE.Scene;
  }) {
    if (scene.background instanceof THREE.Texture) {
      const canvasAspect = size.width / size.height;
      const image = tex.image as HTMLImageElement;
      const imageAspect = image.width / image.height;
      const factor = imageAspect / canvasAspect;

      // When factor larger than 1, that means texture 'wilder' than target。
      // we should scale texture height to target height and then 'map' the center  of texture to target， and vice versa.
      scene.background.offset.x = factor > 1 ? (1 - 1 / factor) / 2 : 0;
      scene.background.repeat.x = factor > 1 ? 1 / factor : 1;
      scene.background.offset.y = factor > 1 ? 0 : (1 - factor) / 2;
      scene.background.repeat.y = factor > 1 ? 1 : factor;
    }
  }

  const domElement = document.getElementById('renderCanvas');
  if (domElement instanceof HTMLCanvasElement) {
    fixBgAspect({
      size: {
        width: domElement.clientWidth,
        height: domElement.clientHeight,
      },
      scene,
    });
  }

  return { resize: fixBgAspect };
}
