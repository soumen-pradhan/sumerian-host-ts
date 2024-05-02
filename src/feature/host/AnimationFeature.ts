import * as THREE from 'three';
import AbstractHostFeature from './AbstractHostFeature';
import AnimationLayer from '../AnimationLayer';

export default class AnimationFeature extends AbstractHostFeature {
  override name = 'AnimationFeature';
  mixer = new THREE.AnimationMixer(this.host.owner);

  // similar to Java 8's LinkedHashMap
  #layers: AnimationLayer[] = [];
  layerMap = new Map<string, AnimationLayer>();

  addLayer(
    opts: {
      name: string;
      transitionTimeS?: number;
      blendMode?: BlendMode;
    },
    index?: number
  ): AnimationLayer {
    if (this.layerMap.has(opts.name)) {
      throwErr(`AnimationFeature already contains layer:${opts.name}`);
    }

    const layer = new AnimationLayer({
      name: opts.name,
      mixer: this.mixer,
      transitionTimeS: opts.transitionTimeS,
      blendMode: opts.blendMode,
    });

    const layerIndex = index ?? this.#layers.length;
    this.layerMap.set(layer.name, layer);
    this.#layers.splice(layerIndex, 0, layer);

    return layer;
  }

  override update(deltaMs: number): void {
    // all layers will be updated here as well,
    // since the same mixer is passed down to layers as well.
    this.mixer.update(deltaMs / 1000);
  }
}
