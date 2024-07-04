import AbstractState from './state/AbstractState';

export default abstract class IAnimationPlayer {
  /** Gets whether or not the player is updating states. */
  abstract getPaused(): boolean;

  /**
   * Gets and sets the default number of seconds it takes to transition to
   * a new animation.
   */
  abstract getTransitionTime(): number;
  abstract setTransitionTime(sec: number): void;

  /**
   * Gets and sets the default easing function to use when transitioning and
   * setting weights.
   *
   * @type {Function}
   */
  abstract getEasingFn(): EasingFn;
  abstract setEasingFn(fn: EasingFn): void;

  /** Gets the state the layer is currently in control of. */
  abstract getCurrentState(): AbstractState;

  /** Gets the name of the state the layer is currently in control of. */
  abstract currentAnimation(): string;

  /** Gets whether or not the layer is currently transitioning to a new animation. */
  abstract isTransitioning(): boolean;

  /**
   * Update the layer's current state to a new value. If transitionTime is defined
   * and greater than zero, perform a smooth blend between any states that currently
   * have non-zero weight values and the new state.
   */
  abstract _playCurrentState(
    name: string,
    playMethod: string,
    transitionTime: number,
    easingFn: EasingFn,
    onError: () => void
  ): void;

  abstract playAnimation(name: string, transitionTime: number, easingFn: EasingFn): void;

  static Mixin<TBase extends Constructor>(Base: TBase) {
    return class IAnimationPlayerImpl extends Base implements IAnimationPlayer {
      /** Mimics a constructor, to be called by class that extends the mixin */
      IAnimationPlayerInit(opts: { transitionTime: number; easingFn: EasingFn }) {}

      getPaused(): boolean {
        throwErr('Method not implemented.');
      }

      getTransitionTime(): number {
        throwErr('Method not implemented.');
      }
      setTransitionTime(sce: number): void {
        throwErr('Method not implemented.');
      }

      getEasingFn(): EasingFn {
        throwErr('Method not implemented.');
      }
      setEasingFn(fn: EasingFn): void {
        throwErr('Method not implemented.');
      }

      getCurrentState(): AbstractState {
        throwErr('Method not implemented.');
      }

      currentAnimation(): string {
        throwErr('Method not implemented.');
      }

      isTransitioning(): boolean {
        throwErr('Method not implemented.');
      }

      _playCurrentState(
        name: string,
        playMethod: string,
        transitionTime: number,
        easingFn: EasingFn,
        onError: () => void
      ): void {
        throwErr('Method not implemented.');
      }

      playAnimation(name: string, transitionTime: number, easingFn: EasingFn): void {
        throwErr('Method not implemented.');
      }
    };
  }
}
