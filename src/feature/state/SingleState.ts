import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

import AbstractState from './AbstractState';

export type SingleStateOpts = {
  name: string;
  action: THREE.AnimationAction;
  loopCount?: number;
  timeScale?: number;
  weight?: number;
  blendMode?: BlendMode;
};

export default class SingleState extends AbstractState {
  #threeAction: THREE.AnimationAction;

  #paused = true;

  #loopCount: number = Infinity;
  #timeScale: number = 1;

  constructor(opts: SingleStateOpts) {
    super({ name: opts.name });

    this.#loopCount = opts.loopCount ?? Infinity;
    this.#timeScale = opts.timeScale ?? 1;

    const blendMode =
      opts.blendMode === 'Additive'
        ? THREE.AdditiveAnimationBlendMode
        : THREE.NormalAnimationBlendMode;

    this.#threeAction = opts.action;
    {
      opts.action.clampWhenFinished = true; // Hold the last frame on completion
      opts.action.enabled = true;
      opts.action.loop = this.#loopCount === 1 ? THREE.LoopOnce : THREE.LoopRepeat;
      opts.action.paused = this.#paused;
      opts.action.repetitions = this.#loopCount;
      opts.action.timeScale = this.#timeScale;
      opts.action.weight = THREE.MathUtils.clamp(opts.weight ?? 0, 0, 1);
      opts.action.blendMode = blendMode;
    }

    this.#threeAction.getMixer().addEventListener('finished', this.#onMixerFinished);
  }

  //#region weightTween
  #weightTween?: TWEEN.Tween<{}>;

  override get visible(): boolean {
    return this.#threeAction.weight > 0 || (this.#weightTween?.isPlaying() ?? false);
  }

  override setWeightTween(
    toWeight: number,
    seconds = 0,
    easingFn = TWEEN.Easing.Linear.None
  ): TWEEN.Tween<{}> {
    this.#weightTween?.stop();

    const tween = new TWEEN.Tween(this.#threeAction)
      .to({ weight: THREE.MathUtils.clamp(toWeight, 0, 1) })
      .duration(seconds * 1000)
      .easing(easingFn);

    this.#weightTween = tween;
    return tween;
  }
  //#endregion

  override play() {
    this.#threeAction.reset().play();
  }

  override pause(): boolean {
    this.#threeAction.paused = true;
    // this.#threeAction.play(); // won't play ??
    return true;
  }

  override resume() {
    // Make sure the animation can play and has influence
    this.#threeAction.paused = false;
    this.#threeAction.enabled = true;
    this.#threeAction.play();
  }

  override cancel() {
    // Stop animation playback
    this.#threeAction.paused = true;
  }

  override stop() {
    this.#threeAction.stop();
  }

  override discard() {
    // Stop the animation from having influence
    this.#threeAction.enabled = false;

    // Stop listening for finish events
    this.#threeAction.getMixer().removeEventListener('finished', this.#onMixerFinished);
  }

  override deactivate() {
    this.discard();
  }

  #onMixerFinished: THREE.EventListener<
    { action: THREE.AnimationAction; direction: number },
    'finished',
    THREE.AnimationMixer
  > = ({ type, action }) => {
    if (type !== 'finished' || action !== this.#threeAction) {
      return;
    }

    this.#threeAction.paused = true;
  };
}
