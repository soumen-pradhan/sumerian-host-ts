import * as TWEEN from '@tweenjs/tween.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractState, TransitionState } from '../../../../src/anim';
import { spyOnAllMethods } from '../../mocks';

describe('TransitionState', () => {
  let state: TransitionState;
  let toState: AbstractState;
  let fromStates: AbstractState[];

  beforeEach(() => {
    toState = spyOnAllMethods(new AbstractState());

    fromStates = [
      spyOnAllMethods(new AbstractState({ weight: 0.5 })),
      spyOnAllMethods(new AbstractState({ weight: 0.5 })),
    ];

    state = spyOnAllMethods(new TransitionState());
    state.setWeight(1);
    state.updateInternalWeight(1);
    // state.configure(fromStates, toState, 0);
  });

  describe('internalWeight', () => {
    it('should return the sum of all controlled states multiplied by the _internalWeight of the state', () => {
      state.configure(fromStates, toState, 0);
      state.setWeight(1);
      state.updateInternalWeight(0.25);

      expect(state.internalWeight).toEqual(
        (toState.weight + fromStates[0].weight + fromStates[1].weight) * 0.25
      );

      state.configure(fromStates, undefined, 0);
      state.updateInternalWeight(0.75);

      expect(state.internalWeight).toEqual(
        (fromStates[0].weight + fromStates[1].weight) * 0.75
      );
    });
  });

  describe('updateInternalWeight', () => {
    it('should execute updateInternalWeight on all controlled states', () => {
      state.configure(fromStates, toState, 0);
      state.updateInternalWeight(0.35);

      expect(toState.updateInternalWeight).toHaveBeenCalledWith(0.35);
      expect(fromStates[0].updateInternalWeight).toHaveBeenCalledWith(0.35);
      expect(fromStates[1].updateInternalWeight).toHaveBeenCalledWith(0.35);
    });
  });

  describe('configure', () => {
    it.skip('should cancel the current weight promise', () => {
      // const onCancel = vi.spyOn(state._weightPromise, 'cancel');
      // state.configure(fromStates, toState, 1);
      // expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should store a new weight promise for each controlled state', () => {
      state.configure(fromStates, toState, 1);

      const easing = TWEEN.Easing.Linear.None;

      expect(toState.setWeight).toHaveBeenCalledWith(1, 1, easing);
      expect(fromStates[0].setWeight).toHaveBeenCalledWith(0, 1, easing);
      expect(fromStates[1].setWeight).toHaveBeenCalledWith(0, 1, easing);
    });

    it("hould only resolve on its own the new weight promise once the target state's weight reaches 1 and the current state's weights reach 0", async () => {
      state.configure(fromStates, toState, 0);

      // await state._weightPromise;
      // await expect(state._weightPromise).resolves.toBeUndefined();

      await new Promise((res) => setTimeout(res, 1000));

      expect(toState.weight).toEqual(1);
      expect(fromStates[0].weight).toEqual(0);
      expect(fromStates[1].weight).toEqual(0);
    });

    it("should deactivate any states that aren't in the new configuration", () => {
      state.configure(fromStates, toState, 0);
      state.configure([fromStates[1]], toState, 1);
      expect(fromStates[0].deactivate).toHaveBeenCalledTimes(1);
    });
  });
});
