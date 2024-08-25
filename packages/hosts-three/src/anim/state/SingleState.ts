import * as THREE from 'three';

import { SingleState as CoreSingleState } from 'hosts-core/anim';
import type { SingleStateOpts as CoreSingleStateOpts } from 'hosts-core/anim';
import { MathUtils } from 'hosts-core/utils';
import { Deferred } from 'hosts-core';

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

  override set normalizedTime(time) {
    time = MathUtils.clamp(time);
    this.#threeAction.time = this.#threeAction.getClip().duration * time;
  }

  override setWeight(
    weight: number,
    ms?: number,
    easingFn?: EasingFn
  ): Deferred<void> {
    this.#threeAction.enabled = true;
    return super.setWeight(weight, ms, easingFn);
  }

  override updateInternalWeight(factor: number): void {
    super.updateInternalWeight(factor);
    this.#threeAction.setEffectiveWeight(this.internalWeight);
  }

  override setTimeScale(
    timeScale: number,
    ms?: number,
    easingFn?: EasingFn
  ): Deferred<void> {
    this.#threeAction.timeScale = timeScale;
    return super.setTimeScale(timeScale, ms, easingFn);
  }

  override set loopCount(loop: number) {
    super.loopCount = loop;
    this.#threeAction.loop = loop === 1 ? THREE.LoopOnce : THREE.LoopRepeat;
    this.#threeAction.repetitions = loop;
  }

  override play(on?: {
    onFinish?: () => void;
    onError?: () => void;
    onCancel?: () => void;
  }): Deferred<void> {
    // Restart animations
    this.#threeAction.reset();
    this.#threeAction.play();

    return super.play(on);
  }

  override pause(): boolean {
    // Make sure animation has influence
    this.#threeAction.paused = true;
    this.#threeAction.play();

    return super.pause();
  }

  override resume(on?: {
    onFinish?: () => void;
    onError?: () => void;
    onCancel?: () => void;
  }): Deferred<void> {
    // Make sure the animation can play and has influence
    this.#threeAction.paused = false;
    this.#threeAction.enabled = true;
    this.#threeAction.play();

    return super.resume(on);
  }

  override cancel(): boolean {
    // Stop animation playback
    this.#threeAction.paused = true;

    return super.cancel();
  }

  override stop(): boolean {
    // Restart and pause the animation
    this.#threeAction.reset();
    this.#threeAction.paused = true;
    this.#threeAction.play();

    return super.stop();
  }

  override discard(): void {
    // Stop the animation from having influence
    this.#threeAction.enabled = false;

    // Stop listening for finish events
    this.#threeAction
      .getMixer()
      .removeEventListener('finished', this.#onFinishedEvent);

    super.discard();
  }
}
