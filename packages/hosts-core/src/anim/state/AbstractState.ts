type AbstractStateOpts = {
  name?: string;
};

/**
 * Base class for a state in our animation system.
 */
export default class AbstractState {
  name: string;

  constructor({ name = AbstractState.name }: AbstractStateOpts = {}) {
    this.name = name;
  }

  /** Cancel any pending promises and remove reference to them. */
  discard() {}
}
