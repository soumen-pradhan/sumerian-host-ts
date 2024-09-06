/* eslint-disable @typescript-eslint/no-explicit-any */
import * as TWEEN from '@tweenjs/tween.js';

import Deferred from '../../Deferred';
import AbstractState from './AbstractState';
import IStateContainer from './IStateContainer';
import TransitionState from './TransitionState';
import { impl } from '../../utils';

interface Updatable {
  update?(deltaMs: number): void;
}

/**
 * Class factory interface for controlling playback of a collection of animations.
 * One animation can be played at any given time, crossfading between animations
 * will result in playing a {@link TransitionState}.
 */
export default abstract class IAnimationPlayer {
  /** Gets whether or not the player is updating states. */
  abstract get paused(): boolean;

  /**
   * Gets and sets the default number of seconds it takes to transition to
   * a new animation.
   */
  abstract get transitionMs(): number;
  abstract set transitionMs(ms: number);

  /**
   * Gets and sets the default easing function to use when transitioning and
   * setting weights.
   */
  abstract get easingFn(): EasingFn;
  abstract set easingFn(fn: EasingFn);

  /** Gets the state the layer is currently in control of. */
  abstract get currentState(): AbstractState | undefined;

  /** Gets the name of the state the layer is currently in control of. */
  abstract get currentAnimation(): string | undefined;

  /** Gets whether or not the layer is currently transitioning to a new animation. */
  abstract get isTransitioning(): boolean;

  /**
   * Update the layer's current state to a new value. If transitionTime is defined
   * and greater than zero, perform a smooth blend between any states that currently
   * have non-zero weight values and the new state.
   */
  abstract _prepareCurrentState(
    name: string,
    playMethod: string,
    transitionMs: number,
    easingFn: EasingFn,
    onError?: (reason: unknown) => void
  ): void;

  /** Start playback an animation from the beginning. */
  abstract playAnimation(
    name: string,
    transitionMs?: number,
    easingFn?: EasingFn,
    on?: {
      onFinish?: () => void;
      onError?: () => void;
      onCancel?: () => void;
      onNext?: any;
    }
  ): Deferred<void>;

  /** Cancel playback of the current animation. */
  abstract cancelAnimation(): boolean;

  /** Pause playback of the current animation. */
  abstract pauseAnimation(): boolean;

  /** Resume playback of the current animation. */
  abstract resumeAnimation(
    name?: string,
    transitionMs?: number,
    easingFn?: EasingFn,
    on?: { onFinish?: any; onError?: any; onCancel?: any; onNext?: any }
  ): Deferred<void>;

  /** Stop playback of the current animation. */
  abstract stopAnimation(): boolean;

  /** Update the current animation */
  abstract update(deltaMs: number): void;

  /** Discards the transition state */
  abstract discard(): void;

  /** Contains an init function */
  static Mixin<TBase extends Constructor<IStateContainer & Updatable>>(
    Base: TBase
  ) {
    return class IAnimationPlayerImpl extends Base implements IAnimationPlayer {
      #transitionState = new TransitionState();
      #currentState?: AbstractState;
      #paused = false;
      #transitionMs = 0;
      #easingFn: EasingFn = TWEEN.Easing.Linear.None;

      /** Mimics a constructor, to be called by class that extends the mixin */
      IAnimationPlayerInit(
        opts: { transitionMs?: number; easingFn?: EasingFn } = {}
      ) {
        this.#transitionMs = opts.transitionMs ?? this.#transitionMs;
        this.#easingFn = opts.easingFn ?? this.#easingFn;
      }

      get paused() {
        return this.#paused;
      }
      protected set paused(pause: boolean) {
        this.#paused = pause;
      }

      get transitionMs() {
        return this.#transitionMs;
      }
      set transitionMs(ms: number) {
        this.#transitionMs = Math.max(ms, 0);
      }

      get easingFn() {
        return this.#easingFn;
      }
      set easingFn(fn: EasingFn) {
        this.#easingFn = fn;
      }

      get currentState() {
        return this.#currentState;
      }

      get currentAnimation() {
        return this.#currentState?.name;
      }

      get isTransitioning() {
        return this.#currentState === this.#transitionState;
      }

      // @ts-expect-error Mimicing an abstract method
      protected get internalWeight(): number {
        impl();
      }

      _prepareCurrentState(
        name: string,
        playMethod: 'play' | 'resume',
        transitionMs: number,
        easingFn: EasingFn,
        onError?: (reason: unknown) => void
      ): void {
        const targetState = this.getState(name);

        if (targetState === undefined) {
          const e = new Error(
            `Cannot ${playMethod} animation '${name}'. No such animation exists`
          );

          onError?.(e);
          throw e;
        }

        // Make sure the new state isn't already playing
        if (this.currentAnimation !== name) {
          // Switch to the new state immediately
          // else Blend to the new state over time

          if (transitionMs <= 0) {
            // Cancel the current state and set its weight to 0

            this.#currentState?.cancel();
            this.#currentState?.setWeight(0);
            this.#currentState?.deactivate();

            this.#currentState = targetState;
          } else {
            // Make sure to transition out of any states with non-zero weight

            const currentStates = this.getStateValues().filter(
              (s) => s !== targetState && (s.weight || s.weightPending)
            );

            // Update the transition state with new inputs
            this.#transitionState.configure(
              currentStates,
              targetState,
              transitionMs,
              easingFn,
              () => {
                this.#currentState = targetState;
                this.#transitionState.setWeight(0);
              }
            );

            this.#currentState = this.#transitionState;
          }
        } else if (playMethod === 'play') {
          this.#currentState?.cancel();

          if (this.#currentState === this.#transitionState) {
            this.#transitionState.reset(transitionMs, easingFn, () => {
              this.#currentState = targetState;
              this.#transitionState.setWeight(0);
            });
          }
        }

        // Update weight for the new current state so it has full influence for the player
        this.#currentState?.setWeight(1);
        this.#currentState?.updateInternalWeight(this.internalWeight);
      }

      playAnimation(
        name: string,
        transitionMs?: number,
        easingFn?: EasingFn,
        on: {
          onFinish?: () => void;
          onError?: () => void;
          onCancel?: () => void;
          onNext?: any;
        } = {}
      ): Deferred<void> {
        try {
          this._prepareCurrentState(
            name,
            'play',
            transitionMs ?? this.#transitionMs,
            easingFn ?? this.#easingFn,
            on?.onError
          );
        } catch (e) {
          return Deferred.rejected(e);
        }

        return this.#currentState!.play({
          onFinish: on.onFinish,
          onError: on.onError,
          onCancel: on.onCancel,
        });
      }

      pauseAnimation(): boolean {
        return this.#currentState?.pause() ?? false;
      }

      resumeAnimation(
        name?: string,
        transitionMs?: number,
        easingFn?: EasingFn,
        on: { onFinish?: any; onError?: any; onCancel?: any; onNext?: any } = {}
      ): Deferred<void> {
        name = name ?? this.#currentState!.name;

        try {
          this._prepareCurrentState(
            name,
            'resume',
            transitionMs ?? this.#transitionMs,
            easingFn ?? this.#easingFn,
            on.onError
          );
        } catch (e) {
          return Deferred.rejected(e);
        }

        return this.#currentState!.resume(on);
      }

      cancelAnimation(): boolean {
        return this.#currentState?.cancel() ?? false;
      }

      stopAnimation(): boolean {
        return this.#currentState?.stop() ?? false;
      }

      override update(delatMs: number): void {
        super.update?.(delatMs);
        this.#currentState?.update(delatMs);
      }

      discard(): void {
        this.#transitionState.discard();
      }
    };
  }
}
