import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import AbstractState from './state/AbstractState';
import SingleState from './state/SingleState';

export default class AnimationLayer {
  name: string;
  mixer: THREE.AnimationMixer;

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

  //#region StateContainerInterface

  #stateMap = new Map<string, AbstractState>();

  #addState(state: AbstractState): string {
    if (this.#stateMap.has(state.name)) {
      throwErr(`AnimtionLayer:${this.name} already contains state:${state.name}`);
    }

    this.#stateMap.set(state.name, state);
    return state.name;
  }

  //#endregion

  //#region AnimationPlayerInterface

  //#region #currentState
  #currentState?: AbstractState;

  get currentState() {
    return this.#currentState;
  }
  get currentAnimation() {
    return this.#currentState?.name;
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
    console.trace(`[${this.name}:Layer] playAnimation()`, this.#currentState);
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
        throwErr('AnimationLayer.#prepareCurrentState TODO add transition');
      }
    }

    // If current state is playing
    if (newStateAlreadyPlaying && method === 'play') {
      this.#currentState?.cancel();
      this.#currentState = targetState;
      this.#currentState.play();
    }

    if (!this.#currentState) {
      throwErr(`unreachable: AnimationLayer.#currentState should be defined`);
    }

    this.#currentState.setWeightTween(1).start();
  }

  //#endregion
}
