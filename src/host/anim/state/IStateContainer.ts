import { EmptyBase, getUniqueName } from '../../../utils';
import AbstractState from './AbstractState';

/**
 * Class factory interface for manipulating a collection of {@link AbstractState}
 */
export default abstract class IStateContainer {
  /** Return the state with the given name. */
  abstract getState(name: string): AbstractState | undefined;

  /** Gets an array of the names of all states in the container. */
  abstract getStateNames(): string[];

  /**
   * Add a new state to be controlled by the container. States are stored keyed
   * by their name property, which must be unique. If it isn't, a number will
   * be added or incremented until a unique key is generated.
   */
  abstract addState(state: AbstractState): string;

  /** Removes a state with the given name from the container. */
  abstract removeState(name: string): boolean;

  /**
   * Renames a state with the given name in the container. Name must be unique
   * to the container, if it isn't the name will be incremented until it is unique.
   */
  abstract renameState(currName: string, newName: string): string;

  /** Discards all states. */
  abstract discardStates(): void;

  static Mixin<TBase extends Constructor>(Base: TBase = EmptyBase as TBase) {
    return class IStateContainerImpl extends Base implements IStateContainer {
      #states = new Map<string, AbstractState>();

      getState = (name: string) => this.#states.get(name);
      getStateNames = () => [...this.#states.keys()];

      addState(state: AbstractState): string {
        // Make sure the state is not already in this container
        if ([...this.#states.values()].includes(state)) {
          console.warn('Cannot add animation');
          return state.getName();
        }

        // Make sure the state name is unique
        const uniqueName = getUniqueName(state.getName(), this.getStateNames());
        state.setName(uniqueName);

        this.#states.set(state.getName(), state);

        return state.getName();
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

        state.setName(newName);
        this.#states.delete(currName);
        this.#states.set(state.getName(), state);

        return state.getName();
      }

      discardStates(): void {
        this.#states.forEach((s) => s.discard());
      }
    };
  }
}
