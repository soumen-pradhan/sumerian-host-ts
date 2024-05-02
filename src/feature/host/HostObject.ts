import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/Addons.js';
import AbstractHostFeature from './AbstractHostFeature';

export default class HostObject {
  owner: GLTF['scene'];
  #featureMap = new Map<string, AbstractHostFeature>();

  #clock: THREE.Clock;
  get nowMs() {
    return this.#clock.getElapsedTime() * 1000;
  }

  #lastUpdateMs: number;
  get deltaTimeMs() {
    return this.nowMs - this.#lastUpdateMs;
  }
  set deltaTimeMs(ms: number) {
    this.#lastUpdateMs = ms;
  }

  constructor(options: { owner: GLTF['scene']; clock: THREE.Clock }) {
    this.owner = options.owner;
    this.#clock = options.clock;
    this.#lastUpdateMs = this.nowMs;
  }

  update() {
    const currentTimeMs = this.nowMs;
    const deltaMs = this.deltaTimeMs;
    this.#featureMap.forEach((feature) => feature.update(deltaMs));
    this.#lastUpdateMs = currentTimeMs;
  }

  addFeature<T extends AbstractHostFeature>(feature: T, override = false) {
    if (this.#featureMap.has(feature.name) && !override) {
      throwErr(`Feature:${feature.name} already exists on Host:${this.owner.id}`);
    }

    this.#featureMap.set(feature.name, feature);
  }
}
