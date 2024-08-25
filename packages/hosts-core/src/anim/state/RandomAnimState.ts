import AbstractState from './AbstractState';
import IAnimationPlayer from './IAnimationPlayer';
import IStateContainer from './IStateContainer';

import type { AbstractStateOpts } from './AbstractState';

export type RandomAnimStateOpts = AbstractStateOpts & {
  playInterval?: number;
  subStates?: AbstractState[];
};

/**
 * Class for playing random animations at random intervals within this state.
 */
export default class RandomAnimState extends IAnimationPlayer.Mixin(
  IStateContainer.Mixin(AbstractState)
) {
  playInterval: number;
  #currentState?: AbstractState;

  constructor(opts: RandomAnimStateOpts) {
    super(opts);
    this.IAnimationPlayerInit();

    this.playInterval = opts.playInterval ?? 3;
    opts.subStates?.forEach((state) => this.addState(state));
  }

  override updateInternalWeight(factor: number): void {
    super.updateInternalWeight(factor);

    this.#currentState?.updateInternalWeight(this.internalWeight);
  }
}
