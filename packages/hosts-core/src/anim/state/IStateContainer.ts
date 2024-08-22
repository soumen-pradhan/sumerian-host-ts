/* eslint-disable @typescript-eslint/no-unused-vars */

import { EmptyBase, getUniqueName, impl, throwErr } from '../../utils';
import AbstractState from './AbstractState';

/**
 * Class factory interface for manipulating a collection of {@link AbstractState}
 */
export default class IStateContainer {
  /** Return the state with the given name. */
  getState(name: string): AbstractState | undefined {
    impl();
  }

  /** Gets an array of the names of all states in the container. */
  getStateNames(): string[] {
    impl();
  }

  /** Gets an array of all states in the container. */
  getStateValues(): AbstractState[] {
    impl();
  }

  /**
   * Add a new state to be controlled by the container. States are stored keyed
   * by their name property, which must be unique. If it isn't, a number will
   * be added or incremented until a unique key is generated.
   */
  addState(state: AbstractState): string {
    impl();
  }

  /** Removes a state with the given name from the container. */
  removeState(name: string): boolean {
    impl();
  }

  /**
   * Renames a state with the given name in the container. Name must be unique
   * to the container, if it isn't the name will be incremented until it is unique.
   */
  renameState(currName: string, newName: string): string {
    impl();
  }

  /** Discards all states. */
  discardStates(): void {
    impl();
  }

  static Mixin<TBase extends Constructor>(Base: TBase = EmptyBase as TBase) {
    return class IStateContainerImpl extends Base implements IStateContainer {
      #states = new Map<string, AbstractState>();

      getState(name: string) {
        return this.#states.get(name);
      }

      getStateNames() {
        return [...this.#states.keys()];
      }

      getStateValues() {
        return [...this.#states.values()];
      }

      addState(state: AbstractState): string {
        // Make sure the state is not already in this container
        if ([...this.#states.values()].includes(state)) {
          console.warn('Cannot add animation. Already exists.');
          return state.name;
        }

        // Make sure the state name is unique
        const uniqueName = getUniqueName(state.name, this.getStateNames());
        if (state.name !== uniqueName) {
          console.warn(`Animation name ${state.name} not uniqur for state.`);
          state.name = uniqueName;
        }

        this.#states.set(state.name, state);

        return state.name;
      }

      removeState(name: string): boolean {
        // Check if the state is in this container
        if (!this.#states.has(name)) {
          console.warn(`No animation ${name} exists on state`);
          return false;
        }

        this.#states.get(name)?.discard();
        return this.#states.delete(name);
      }

      renameState(currName: string, newName: string): string {
        // Make sure the state is in this container
        if (!this.#states.has(currName)) {
          throwErr(`No animation ${currName} exists`);
        }

        // Exit if the names are the same
        if (currName === newName) {
          return currName;
        }

        const state = this.#states.get(currName)!;

        // Make sure the name is unique
        const uniqueName = getUniqueName(
          newName,
          this.getStateNames().filter((n) => n !== currName)
        );

        if (newName !== uniqueName) {
          console.warn(
            `Animation name ${newName} is not unique. Renamed to ${uniqueName}`
          );
          newName = uniqueName;
        }

        state.name = newName;
        this.#states.delete(currName);
        this.#states.set(state.name, state);

        return state.name;
      }

      discardStates(): void {
        this.#states.forEach((s) => s.discard());
      }
    };
  }
}
