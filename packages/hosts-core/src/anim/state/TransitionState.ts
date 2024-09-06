import * as TWEEN from '@tweenjs/tween.js';

import Deferred from '../../Deferred';
import AbstractState from './AbstractState';
import type { AbstractStateOpts } from './AbstractState';

export type TransitionStateOpts = AbstractStateOpts & {};

/**
 * Class for smooth transitioning between states on an animation layer.
 */
export default class TransitionState extends AbstractState {
  #to?: AbstractState;
  #from: AbstractState[] = [];
  _weightPromise: Deferred<void>;

  constructor(opts: TransitionStateOpts = {}) {
    super({ ...opts, name: opts.name ?? TransitionState.name });

    this._weightPromise = Deferred.resolved();
  }

  override get internalWeight(): number {
    // Find the combined weight of all sub-states
    const totalWeight = this.#from.reduce(
      (acc, x) => acc + x.weight,
      this.#to?.weight ?? 0
    );

    return totalWeight * super.internalWeight;
  }

  override updateInternalWeight(factor: number): void {
    super.updateInternalWeight(factor);

    this.#from.forEach((s) => s.updateInternalWeight(super.internalWeight));
    this.#to?.updateInternalWeight(super.internalWeight);
  }

  /**
   * Update sub-states the transition is controlling and start new weight
   * animations on each one. This should be called each time the current state of
   * an animation layer gets updated to a new value and a transition time greater
   * that zero is specified.
   *
   * @param currentStates States whose weight values will be animated to 0.
   * @param targetState State whose weight will be animated to 1.
   * @param transitionMs Amount of time in ms for animations to complete.
   */
  configure(
    currentStates: AbstractState[],
    targetState?: AbstractState,
    transitionMs: number = 0,
    easingFn: EasingFn = TWEEN.Easing.Linear.None,
    onComplete?: () => void
  ): void {
    // Deactivate any states that aren't in the new configuration
    if (
      this.#to !== undefined &&
      (this.#to === targetState || currentStates.includes(this.#to))
    ) {
      this.#to = undefined;
    }

    this.#from = this.#from.filter(
      (s) => s !== targetState && !currentStates.includes(s)
    );

    this.deactivate();

    this.#from = currentStates;
    this.#to = targetState;
    this.reset(transitionMs, easingFn, onComplete);
  }

  /**
   * Start new weight animations state the transition controls. This should be called
   * if an animation is played with a transition time greater than zero and a transtion
   * to that animation was already in progress.
   */
  reset(
    transitionMs: number,
    easingFn: EasingFn = TWEEN.Easing.Linear.None,
    onComplete?: () => void
  ): void {
    // Stop any pending promises
    this._weightPromise.cancel();

    // Start tweening weight to 0 for the current states
    const weightPromises = this.#from.map((state) =>
      state.setWeight(0, transitionMs, easingFn)
    );

    // Start tweening weight to 1 for the target state
    if (this.#to) {
      weightPromises.push(this.#to.setWeight(1, transitionMs, easingFn));
    }

    this._weightPromise = Deferred.all(weightPromises, {
      onResolve: () => {
        this.#from.forEach((s) => {
          s.cancel();
          s.deactivate();
        });
        onComplete?.();
      },
    }) as unknown as Deferred<void>;
  }

  override play(
    on: {
      onFinish?: () => void;
      onError?: () => void;
      onCancel?: () => void;
      onNext?: () => void;
    } = {}
  ): Deferred<void> {
    this._paused = false;

    this._playCallbacks.onFinish = on.onFinish;
    this._playCallbacks.onError = on.onError;
    this._playCallbacks.onCancel = on.onCancel;

    const promises = [this._weightPromise];
    this.#from.forEach((s) => s.resume());

    if (this.#to) {
      this._promises.play = this.#to.play();
      promises.push(this._promises.play);
    }

    this._promises.finish = Deferred.all(promises, {
      onResolve: on.onFinish,
      onReject: on.onError,
      onCancel: on.onCancel,
    }) as unknown as Deferred<void>;

    return this._promises.finish;
  }

  override pause(): boolean {
    this.#from.forEach((s) => s.pause());
    this.#to?.pause();

    return super.pause();
  }

  override resume(
    on: {
      onFinish?: () => void;
      onError?: () => void;
      onCancel?: () => void;
      onNext?: () => void;
    } = {}
  ): Deferred<void> {
    this._paused = false;

    if (!this._promises.play.pending) {
      this._playCallbacks.onFinish =
        on.onFinish ?? this._playCallbacks.onFinish;
      this._playCallbacks.onError = on.onError ?? this._playCallbacks.onError;
      this._playCallbacks.onCancel =
        on.onCancel ?? this._playCallbacks.onCancel;
    }

    const promises = [this._weightPromise];

    this.#from.forEach((state) => {
      state.resume();
    });

    if (this.#to) {
      this._promises.play = this.#to.resume();
      promises.push(this._promises.play);
    }

    this._promises.finish = Deferred.all(promises, {
      onResolve: this._playCallbacks.onFinish,
      onReject: this._playCallbacks.onError,
      onCancel: this._playCallbacks.onCancel,
    }) as unknown as Deferred<void>;

    return this._promises.finish;
  }

  override cancel(): boolean {
    this.#from.forEach((s) => s.pause());
    this.#to?.pause();
    this._weightPromise.cancel();

    return super.cancel();
  }

  override stop(): boolean {
    this.#from.forEach((s) => s.stop());
    this.#to?.stop();

    return super.stop();
  }

  override update(deltaMs: number): void {
    super.update(deltaMs);

    this.#from.forEach((s) => s.update(deltaMs));
    this.#to?.update(deltaMs);
  }

  override discard(): void {
    super.discard();

    this._weightPromise.cancel();
    // delete this.#weightPromise

    this.#to = undefined;
    this.#from.length = 0;
  }

  override deactivate(): void {
    this.#to?.deactivate();
    this.#from.forEach((s) => s.deactivate());
  }
}
