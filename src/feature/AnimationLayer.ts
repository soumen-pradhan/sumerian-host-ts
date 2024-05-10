import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import AbstractState from './state/AbstractState';
import SingleState, { SingleStateOpts } from './state/SingleState';
import TransitionState from './state/TransitionState';
import RandomAnimationState from './state/RandomAnimationState';
import FreeBlendState from './state/FreeBlendState';

export default class AnimationLayer {
  name: string;
  mixer: THREE.AnimationMixer;
  weight: number = 1; // TODO Propagate it down somehow to the states

  // A global config for all states in this layer. Individual states may override this.
  #transitionTimeS: number = 0;
  #blendMode: BlendMode = 'Override';

  constructor(opts: {
    name: string;
    mixer: THREE.AnimationMixer;
    transitionTimeS?: number;
    blendMode?: BlendMode;
  }) {
    this.name = opts.name;
    this.mixer = opts.mixer;
    this.#transitionTimeS = opts.transitionTimeS ?? 0;
    this.#blendMode = opts.blendMode ?? 'Override';

    this.#transitionState = new TransitionState({ name: `${this.name}:transition` });
  }

  addSingleAnimation(opts: {
    clip: THREE.AnimationClip;
    blendMode?: BlendMode;
    weight?: number;
    loopCount?: number;
  }): string {
    const clip = this.mixer.existingAction(opts.clip) ? opts.clip.clone() : opts.clip;

    const action = this.mixer.clipAction(clip);

    const state = new SingleState({
      name: clip.name,
      action,
      blendMode: opts.blendMode ?? this.#blendMode,
      weight: opts.weight,
      loopCount: opts.loopCount,
    });

    const animationStateHandle = this.#addState(state);
    return animationStateHandle;
  }

  addRandomAnimation(opts: {
    name: string;
    playIntervalS?: number;
    blendMode?: BlendMode;
    subStateOpts: SingleStateOpts[];
  }): string {
    const subStates = opts.subStateOpts.map((opt) => {
      return new SingleState({
        name: opt.name,
        action: opt.action,
        blendMode: opt.blendMode ?? this.#blendMode,
        weight: opt.weight,
        loopCount: opt.loopCount,
      });
    });

    const state = new RandomAnimationState({
      name: opts.name,
      playIntervalS: opts.playIntervalS,
      subStates,
    });

    const randomAnimStateHandle = this.#addState(state);
    return randomAnimStateHandle;
  }

  addFreeBlendAnimation(opts: {
    name: string;
    blendStatesOpts: SingleStateOpts[];
  }): string {
    const blendStates = opts.blendStatesOpts.map((opt) => {
      return new SingleState({
        name: opt.name,
        action: opt.action,
        blendMode: opt.blendMode ?? this.#blendMode,
        weight: opt.weight,
        loopCount: opt.loopCount,
      });
    });

    const state = new FreeBlendState({ name: opts.name, blendStates });
    const freeBlendHandle = this.#addState(state);
    return freeBlendHandle;
  }

  //#region StateContainerInterface

  // similar to Java 8's LinkedHashMap
  #states: AbstractState[] = [];
  #stateMap = new Map<string, AbstractState>();

  #addState(state: AbstractState): string {
    if (this.#stateMap.has(state.name)) {
      throwErr(`AnimtionLayer:${this.name} already contains state:${state.name}`);
    }

    this.#states.push(state);
    this.#stateMap.set(state.name, state);
    return state.name;
  }

  //#endregion

  //#region AnimationPlayerInterface

  //#region #currentState
  #currentState?: AbstractState;
  #transitionState: TransitionState;

  get currentState() {
    return this.#currentState;
  }
  get currentAnimation() {
    return this.#currentState?.name;
  }
  get isTransitioning() {
    return this.#currentState === this.#transitionState;
  }
  // #endregion

  playAnimation(
    animationStateHandle: string,
    opts: { transitionTimeS?: number; easingFn?: EasingFunction } = {}
  ) {
    this.#prepareCurrentState(
      animationStateHandle,
      'play',
      opts.transitionTimeS ?? this.#transitionTimeS,
      opts.easingFn ?? TWEEN.Easing.Linear.None
    );
    this.#currentState?.play();
  }

  #prepareCurrentState(
    stateHandle: string,
    method: 'play',
    transitionTimeS: number,
    easingFn: EasingFunction
  ) {
    const targetState =
      this.#stateMap.get(stateHandle) ??
      throwErr(`Invalid handle:${stateHandle} for AnimationLayer:${this.name}`);

    // If the new state isn't already playing
    const newStateAlreadyPlaying = this.currentAnimation === stateHandle;

    if (!newStateAlreadyPlaying) {
      // Switch to new state immediately
      if (transitionTimeS <= 0) {
        if (this.#currentState) {
          this.#currentState.cancel();
          this.#currentState.deactivate();
        }
        this.#currentState = targetState;
      }

      // Blend into new state over time
      if (transitionTimeS > 0) {
        const currentStates = [...this.#stateMap.values()].filter(
          (state) => state !== targetState && !state.visible
        );

        this.#transitionState
          .configure(currentStates, targetState, transitionTimeS, easingFn)
          .onComplete(() => {
            this.#currentState = targetState;
            this.#currentState.play();
          });

        this.#currentState = this.#transitionState;
      }
    }

    // If current state is playing
    if (newStateAlreadyPlaying && method === 'play') {
      this.#currentState?.cancel();

      if (this.#currentState === this.#transitionState) {
        this.#transitionState.reset(transitionTimeS, easingFn).onComplete(() => {
          this.#currentState = targetState;
          this.#transitionState.setWeightTween(0).start();
          this.#currentState.play();
        });
      }
    }

    if (!this.#currentState) {
      throwErr(`unreachable: AnimationLayer.#currentState should be defined`);
    }

    this.#currentState.setWeightTween(1).start();
  }

  //#endregion
}
