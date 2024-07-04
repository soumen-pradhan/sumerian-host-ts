import IAnimationPlayer from './IAnimationPlayer';
import IStateContainer from './state/IStateContainer';

/**
 * Class for managing a set of animations where only one state can be active at
 * any given time.
 */
export default class AnimationLayer extends IAnimationPlayer.Mixin(
  IStateContainer.Mixin()
) {
  constructor(opts: { name?: string } = {}) {
    super();
  }
}
