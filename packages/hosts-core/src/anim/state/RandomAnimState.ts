import AbstractState from './AbstractState';
import IAnimationPlayer from './IAnimationPlayer';
import IStateContainer from './IStateContainer';

import type { AbstractStateOpts } from './AbstractState';
import Utils from '../../utils';
import Deferred from '../../Deferred';
import SingleState from './SingleState';

export type RandomAnimStateOpts = AbstractStateOpts & {
  transitionMs?: number;
  playIntervalMs?: number;
  subStates?: SingleState[];
};

/**
 * Class for playing random animations at random intervals within this state.
 */
export default class RandomAnimState extends IAnimationPlayer.Mixin(
  IStateContainer.Mixin(AbstractState)
) {
  playIntervalMs: number;

  declare _promises: AbstractState['_promises'] & {
    timer: Deferred<void>;
  };

  constructor(opts: RandomAnimStateOpts) {
    super(opts);
    this.IAnimationPlayerInit({ transitionMs: opts.transitionMs });

    this.playIntervalMs = opts.playIntervalMs ?? 3;
    opts.subStates?.forEach((state) => this.addState(state));

    this._promises.timer = Deferred.resolved();
  }

  override updateInternalWeight(factor: number): void {
    super.updateInternalWeight(factor);

    this.currentState?.updateInternalWeight(this.internalWeight);
  }

  /**
   * Pick a random animation and utilize AnimationPlayerInterface to play that animation
   */
  playRandomAnim(onError?: () => void) {
    this.#resetTimer();

    // TODO Bug, if states.length < 2, playAniamtion will throw error, as state name will be undefined
    const states = this.getStateNames();
    if (this.currentState) {
      states.splice(states.indexOf(this.currentState.name), 1);
    }

    const randIdx = Utils.getRandomInt(0, states.length);
    const randomState = states[randIdx];

    this.playAnimation(randomState, this.transitionMs, this.easingFn, {
      onError,
    });
  }

  override play(on?: {
    onFinish?: () => void;
    onError?: () => void;
    onCancel?: () => void;
  }): Deferred<void> {
    this.playRandomAnim(on?.onError);
    return super.play(on);
  }

  override pause(): boolean {
    return super.pause() && this.pauseAnimation();
  }

  override resume(on?: {
    onFinish?: () => void;
    onError?: () => void;
    onCancel?: () => void;
  }): Deferred<void> {
    if (this.currentState) {
      this.resumeAnimation(
        this.currentState.name,
        this.transitionMs,
        this.easingFn,
        { onError: on?.onError }
      );
    }

    return super.resume(on);
  }

  override cancel(): boolean {
    return super.cancel() && this.cancelAnimation();
  }

  override stop(): boolean {
    return super.stop() && this.stopAnimation();
  }

  override discard(): void {
    super.discard();
    this.discardStates();
  }

  /**
   * Reset the internal timer for animation play interval
   */
  #resetTimer() {
    const playTimer = Utils.getRandomFLoat(
      this.playIntervalMs / 4,
      this.playIntervalMs / 2
    );

    this._promises.timer = Utils.wait(playTimer, {
      onFinish: () => {
        this.playRandomAnim(this._playCallbacks.onError);
      },
    });
  }
}
