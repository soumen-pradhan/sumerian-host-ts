import * as TWEEN from '@tweenjs/tween.js';
import AbstractState from './AbstractState';

export default class TransitionState extends AbstractState {
  #fromStates: AbstractState[] = [];
  #toState: AbstractState | null = null;
  #toTween: TWEEN.Tween<{}> = new TWEEN.Tween({}).duration(0);

  //#region weightTweens
  override get visible(): boolean {
    return this.#toState?.visible ?? false;
  }

  override setWeightTween(
    toWeight: number,
    seconds = 0,
    easingFn = TWEEN.Easing.Linear.None
  ): TWEEN.Tween<{}> {
    // toState will be correctly configured already, this is to satisfy the constraint
    return this.#toTween;
  }

  // TODO Create a custom class OR use a TWEEN Group
  #weightTweens: TWEEN.Tween<{}>[] = [];
  //#endregion

  configure(
    currentStates: AbstractState[],
    targetState: AbstractState,
    transitionTimeS: number,
    easingFn: EasingFunction
  ): TWEEN.Tween<{}> {
    // Deactivate any states that aren't in the new configuration
    if (
      this.#toState === targetState ||
      (this.#toState && currentStates.includes(this.#toState))
    ) {
      this.#toState = null;
    }

    // TODO override deactivate()
    this.#toState?.deactivate();
    this.#fromStates.forEach((s) => {
      if (s !== targetState && !currentStates.includes(s)) s.deactivate();
    });

    this.#fromStates = currentStates;
    this.#toState = targetState;

    return this.reset(transitionTimeS, easingFn);
  }

  reset(transitionTimeS: number, easingFn: EasingFunction): TWEEN.Tween<{}> {
    // cancel current transitions
    this.#weightTweens.forEach((t) => t.stop());
    this.#weightTweens.splice(0, this.#weightTweens.length);

    this.#fromStates.forEach((state) => {
      const tween = state.setWeightTween(0, transitionTimeS, easingFn).onComplete(() => {
        state.cancel();
        state.deactivate();
      });
      this.#weightTweens.push(tween);
    });

    this.#toTween =
      this.#toState?.setWeightTween(1, transitionTimeS, easingFn).start() ??
      new TWEEN.Tween({}).duration(0).start();

    return this.#toTween;
  }

  override play(): void {
    this.#weightTweens.forEach((t) => t.start());
    this.#toTween.start();
  }

  override pause(): boolean {
    this.#weightTweens.forEach((t) => t.pause());
    this.#toTween.pause();
    return true;
  }

  override resume(): void {
    this.#weightTweens.forEach((t) => t.resume());
    this.#toTween.resume();
  }

  override cancel(): void {
    this.#weightTweens.forEach((t) => t.stop());
    this.#toTween.stop();
  }

  override stop(): void {
    this.cancel();
  }

  override discard(): void {
    this.cancel();
  }

  override deactivate(): void {
    this.cancel();
  }
}
