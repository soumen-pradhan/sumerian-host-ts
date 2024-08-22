import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractState, IStateContainer } from '../../../../src/anim';

class TestContainer extends IStateContainer.Mixin() {}

describe('StateContainerMixin', () => {
  let state1: AbstractState;
  let state2: AbstractState;
  let state3: AbstractState;

  let testContainer: TestContainer;

  beforeEach(() => {
    state1 = new AbstractState({ name: 'state1' });
    state2 = new AbstractState({ name: 'state2' });
    state3 = new AbstractState({ name: 'state2' });

    testContainer = new TestContainer();
    testContainer.addState(state1);
    testContainer.addState(state2);
  });

  describe('getStateName', () => {
    it('should return an array of state names that the container controls', () => {
      const stateNames = testContainer.getStateNames();

      expect(stateNames.length).toEqual(2);
      expect(stateNames.includes('state1')).toBeTruthy();
      expect(stateNames.includes('state2')).toBeTruthy();
    });
  });

  describe('addState', () => {
    it('should execute a console warning if the state is already in the container', () => {
      const onWarn = vi.spyOn(console, 'warn');
      testContainer.addState(state1);

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should not add a new state if the state is already in the container', () => {
      const numStates = testContainer.getStateNames().length;
      testContainer.addState(state1);

      expect(testContainer.getStateNames().length).toEqual(numStates);
    });

    it('should execute a console warning if a state with the same name exists in the container', () => {
      const onWarn = vi.spyOn(console, 'warn');
      testContainer.addState(state3);

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it("should increment a new state's name if a state with the same name exists in the container", () => {
      const oldName = state3.name;
      testContainer.addState(state3);

      expect(state3.name > oldName).toBeTruthy();
    });

    it('should store a new key in the _states map', () => {
      const numStates = testContainer.getStateNames().length;
      testContainer.addState(state3);

      expect(testContainer.getStateNames().length).toBeGreaterThan(numStates);
    });

    it('should return the name of the state', () => {
      const result = testContainer.addState(state3);

      expect(state3.name).toEqual(result);
    });
  });

  describe('removeState', () => {
    it('should execute a console warning if the state is not in the container', () => {
      const onWarn = vi.spyOn(console, 'warn');
      testContainer.removeState('NonState');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should remove the state from the _states map', () => {
      testContainer.removeState('state1');

      expect(
        testContainer.getStateNames().find((it) => it === 'state1')
      ).toBeFalsy();
    });
  });

  describe('renameState', () => {
    it('should throw an error if the state is not in the container', () => {
      expect(() => {
        testContainer.renameState('NotState', 'NewStateName');
      }).toThrowError();
    });

    it('should not change the name if newName is currentName', () => {
      const currentName = state1.name;

      expect(testContainer.renameState(state1.name, state1.name)).toEqual(
        currentName
      );
    });

    it('should execute a console warning if a state with the same newName exits in the container', () => {
      const onWarn = vi.spyOn(console, 'warn');
      testContainer.renameState('state1', 'state2');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it("should increment a new state's name if a state with the same name exists in the container", () => {
      testContainer.renameState(state1.name, state2.name);

      expect(state1.name > state2.name).toBeTruthy();
    });

    it('should store the new state key and remove the old key', () => {
      const oldName = state1.name;
      const newName = 'newStateName';
      testContainer.renameState(oldName, newName);

      expect(
        testContainer.getStateNames().find((it) => it === newName)
      ).toBeTruthy();
      expect(
        testContainer.getStateNames().find((it) => it === oldName)
      ).toBeFalsy();
    });

    it('should not change the number of states in the container', () => {
      const numStates = testContainer.getStateNames().length;
      testContainer.renameState(state1.name, state2.name);

      expect(testContainer.getStateNames().length).toEqual(numStates);
    });

    it('should return the new name of the state', () => {
      const result = testContainer.renameState(state1.name, 'newStateName');

      expect(state1.name).toEqual(result);
    });
  });
});
