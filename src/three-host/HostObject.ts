import * as THREE from 'three';

import { HostObject as CoreHostObject } from '../host';

export default class HostObject extends CoreHostObject<THREE.Object3D> {
  #clock: THREE.Clock;

  constructor({ owner, clock }: { owner: THREE.Object3D; clock: THREE.Clock }) {
    super({ owner });
    this.#clock = clock;
  }

  override getNowMs = () => this.#clock.getElapsedTime() * 1000;
}
