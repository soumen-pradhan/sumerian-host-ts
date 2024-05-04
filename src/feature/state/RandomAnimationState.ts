import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import AbstractState from './AbstractState';
import SingleState from './SingleState';
import TransitionState from './TransitionState';

export type RandomAnimationStateOpts = {
  name: string;
  playIntervalS?: number;
  transitionTimeS?: number;
  subStates: SingleState[];
};

export default class RandomAnimationState extends AbstractState {
  playIntervalS = 3;
  #transitionTimeS = 0;

  constructor(opts: RandomAnimationStateOpts) {
    super({ name: opts.name });

    this.playIntervalS = opts.playIntervalS ?? 3;
    this.#transitionTimeS = opts.transitionTimeS ?? 0;
    opts.subStates.forEach((s) => this.#addState(s));

    this.#transitionState = new TransitionState({ name: `${this.name}:transition` });
  }

  //#region weightTween
  #dummyTween = new TWEEN.Tween({}).duration(0);

  override setWeightTween(
    _toWeight: number,
    _seconds = 0,
    _easingFn = TWEEN.Easing.Linear.None
  ): TWEEN.Tween<{}> {
    // A state has to be randomly chosen, done in play(), this is to satisfy the constraint
    return this.#dummyTween;
  }
  //#endregion

  override play(): void {
    this.#playRandomAnimation();
  }

  #playRandomAnimation() {
    const waitTimeS = THREE.MathUtils.randFloat(
      this.playIntervalS / 4,
      this.playIntervalS * 2
    );

    new TWEEN.Tween({})
      .duration(waitTimeS * 1000)
      .onComplete(() => this.#playRandomAnimation())
      .start();

    const randomState = this.#states[THREE.MathUtils.randInt(0, this.#states.length - 1)];

    this.playAnimation(randomState.name);
  }

  // override pause(): boolean {}

  // override resume(): void {}

  // override cancel(): void {}

  // override stop(): void {}

  // override discard(): void {}

  // override deactivate(): void {}

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
    console.log(`[${this.name}:Layer] playAnimation() state prep`, this.#currentState);
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
            console.log(
              `[${this.name}:Layer] #prepareCurrentState() transition-Ended`,
              this.#currentState
            );
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
