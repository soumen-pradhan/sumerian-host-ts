import * as TWEEN from '@tweenjs/tween.js';
import AbstractState from './AbstractState';
import SingleState from './SingleState';

export type FreeBlendStateOpts = {
  name: string;
  blendStates: SingleState[];
};

export default class FreeBlendState extends AbstractState {
  constructor(opts: FreeBlendStateOpts) {
    super({ name: opts.name });
    opts.blendStates.forEach((s) => this.#addState(s));
  }

  //#region related to Weight
  override get visible(): boolean {
    throwErr('FreeBlendState.visible should be overriden');
    return false;
  }
  /** This does not start the tween, only creates it */
  override setWeightTween(
    toWeight: number,
    seconds?: number,
    easingFn?: EasingFunction
  ): TWEEN.Tween<{}> {
    this.#states.forEach((s) => s.setWeightTween(toWeight, seconds, easingFn));
    // TODO Fix this. The returned tween does not control the actual state tweens.
    // Create a data structure like a TWEEN Group that can control all the free blend tweens
    return new TWEEN.Tween({}).duration(seconds);
  }
  //#endregion

  override play(): void {
    this.#states.forEach((s) => s.play());
  }

  override pause(): boolean {
    let retVal = true;
    for (let s of this.#states) {
      retVal = retVal && s.pause();
    }
    return retVal;
  }

  override resume(): void {
    this.#states.forEach((s) => s.resume());
  }

  override cancel(): void {
    this.#states.forEach((s) => s.cancel());
  }

  override stop(): void {
    this.#states.forEach((s) => s.stop());
  }

  override discard(): void {
    this.#states.forEach((s) => s.discard());
  }

  override deactivate(): void {
    this.#states.forEach((s) => s.deactivate());
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
}
