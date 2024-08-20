import * as THREE from 'three';

import { HostObject as CoreHostObject } from 'hosts-core';

export default class HostObject extends CoreHostObject<THREE.Object3D> {
  #clock: THREE.Clock;

  constructor({ owner, clock }: { owner: THREE.Object3D; clock: THREE.Clock }) {
    super({ owner });
    this.#clock = clock;
  }

  override get nowMs(): number {
    return this.#clock.getElapsedTime() * 1000;
  }
}
