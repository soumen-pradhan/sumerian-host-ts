import { IName } from '../../../utils';

/**
 * Base class for a state in our animation system.
 */
export default class AbstractState implements IName {
  #name: string;
  #weight: number;

  constructor({
    name = AbstractState.name,
    weight = 0,
  }: {
    name?: string;
    weight?: number;
  } = {}) {
    this.#name = name;
    this.#weight = weight;
  }

  discard() {}

  getName = () => this.#name;
  setName = (n: string) => (this.#name = n);
}
