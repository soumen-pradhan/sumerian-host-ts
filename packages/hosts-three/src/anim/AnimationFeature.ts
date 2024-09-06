import * as THREE from 'three';

import {
  AnimationTypes as CoreAnimationTypes,
  AnimationFeature as CoreAnimationFeature,
} from 'hosts-core/anim';
import SingleState, { SingleStateOpts } from './state/SingleState';

export type AnimationTypes = Omit<CoreAnimationTypes, 'Single' | 'Random'> & {
  Single: Omit<
    CoreAnimationTypes['Single'] & { clip: THREE.AnimationClip },
    'threeAction'
  >;
  Random: Omit<CoreAnimationTypes['Random'], 'subStatesOpts'> & {
    subStatesOpts: Omit<
      SingleStateOpts & { clip: THREE.AnimationClip },
      'threeAction'
    >[];
  };
};

export default class AnimationFeature extends CoreAnimationFeature<THREE.Object3D> {
  #mixer = new THREE.AnimationMixer(this.host.owner);

  get mixer() {
    return this.#mixer;
  }

  override _createSingleState(
    opts: Omit<SingleStateOpts & { clip: THREE.AnimationClip }, 'threeAction'>
  ): SingleState {
    // Duplicate the clip if it is already in use by another three action
    let { clip } = opts;

    if (this.#mixer.existingAction(clip)) {
      clip = clip.clone();
    }

    const threeAction = this.#mixer.clipAction(clip);
    return new SingleState({ ...opts, threeAction });
  }

  override addAnimation<TAnim extends keyof AnimationTypes>(
    layerName: string,
    animName: string,
    animType: TAnim,
    opts?: AnimationTypes[TAnim]
  ): string {
    return super.addAnimation(layerName, animName, animType, opts);
  }

  override update(deltaMs: number): void {
    super.update(deltaMs);

    if (!this.paused) {
      this.#mixer.update(deltaMs / 1000);
    }
  }

  override discard(): void {
    // Release THREE animation resources
    this.#mixer.uncacheRoot(this.host.owner);
    super.discard();
  }
}
