import * as TWEEN from '@tweenjs/tween.js';

export default class AbstractState {
  name: string;

  constructor(opts: { name: string }) {
    this.name = opts.name;
  }

  // Empty methods to be overriden

  //#region related to Weight
  get visible(): boolean {
    throwErr('AbstractState.visible should be overriden');
    return false;
  }
  /** This does not start the tween, only creates it */
  setWeightTween(
    toWeight: number,
    seconds?: number,
    easingFn?: EasingFunction
  ): TWEEN.Tween<{}> {
    throwErr('AbstractState.setWeightTween should be overriden');
  }
  //#endregion

  play(): void {
    throwErr('AbstractState.play should be overriden');
  }

  pause(): boolean {
    throwErr('AbstractState.pause should be overriden');
  }

  resume(): void {
    throwErr('AbstractState.resume should be overriden');
  }

  cancel(): void {
    throwErr('AbstractState.cancel should be overriden');
  }

  stop(): void {
    throwErr('AbstractState.stop should be overriden');
  }

  discard(): void {
    throwErr('AbstractState.discard should be overriden');
  }

  deactivate(): void {
    throwErr('AbstractState.deactivate should be overriden');
  }
}
