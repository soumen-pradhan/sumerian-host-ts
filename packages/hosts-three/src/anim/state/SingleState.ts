import * as THREE from 'three';

import { SingleState as CoreSingleState } from 'hosts-core/anim';
import type { SingleStateOpts as CoreSingleStateOpts } from 'hosts-core/anim';

export type SingleStateOpts = CoreSingleStateOpts & {
  threeAction: THREE.AnimationAction;
};

export default class SingleState extends CoreSingleState {
  #threeAction: THREE.AnimationAction;

  #onFinishedEvent: (event: {
    type: 'finished' | 'loop';
    action: THREE.AnimationAction;
  }) => void;

  constructor(opts: SingleStateOpts) {
    super(opts);

    // Callback to catch THREE animation action completion
    this.#onFinishedEvent = ({ type, action }) => {
      // Exit if this isn't the finish event for this animation
      if (type !== 'finished' || action !== this.#threeAction) {
        return;
      }

      this._promises.play.resolve();

      // Stop evaluating interpolators if they have already completed
      if (!this.weightPending && !this.timeScalePending) {
        this._paused = true;
      }
    };

    this.#threeAction = opts.threeAction;
    this.#threeAction.clampWhenFinished = true; // Hold the last frame on completion
    this.#threeAction.enabled = false;
    this.#threeAction.loop =
      this.loopCount === 1 ? THREE.LoopOnce : THREE.LoopRepeat;
    this.#threeAction.paused = this.paused;
    this.#threeAction.repetitions = this.loopCount;
    this.#threeAction.timeScale = this.timeScale;
    this.#threeAction.weight = this.internalWeight;
    this.#threeAction.blendMode =
      this.blendMode === 'Override'
        ? THREE.NormalAnimationBlendMode
        : THREE.AdditiveAnimationBlendMode;

    // Start listening for animation finished events
    this.#threeAction
      .getMixer()
      .addEventListener('finished', this.#onFinishedEvent);
  }

  get threeAction() {
    return this.#threeAction;
  }

  override get normalizedTime(): number {
    const clip = this.#threeAction.getClip();
    if (this.#threeAction.time && clip && clip.duration) {
      return this.#threeAction.time / clip.duration;
    }

    return 0;
  }
}
