import { beforeEach, describe, expect, it } from 'vitest';
import { SingleState } from '../../../../src/anim';
import { Deferred } from '../../../../src';

describe('SingleState', () => {
  let state: SingleState;

  beforeEach(() => {
    state = new SingleState();
  });

  describe('timeScale', () => {
    it('should return a number', () => {
      expect(state.timeScale).toBeTypeOf('number');
    });
  });

  describe('timeScalePending', () => {
    it('should return true if the timeScale promise has not been resolved, rejected or canceled', () => {
      state._promises.timeScale = new Deferred();
      expect(state.timeScalePending).toBeTruthy();
    });

    it('should return false if the timeScale promise has been resolved', () => {
      state._promises.timeScale = new Deferred();
      expect(state.timeScalePending).toBeTruthy();

      state._promises.timeScale.resolve();
      expect(state.timeScalePending).toBeFalsy();
    });

    it('should return false if the timeScale promise has been canceled', () => {
      state._promises.timeScale = new Deferred();
      expect(state.timeScalePending).toBeTruthy();

      state._promises.timeScale.cancel();
      expect(state.timeScalePending).toBeFalsy();
    });
  });

  describe('setTimeScale', () => {
    it('should return a deferred promise', () => {
      const interpolator = state.setTimeScale(0);
      expect(interpolator).toBeInstanceOf(Deferred);
    });

    it('should update the timeScale value when the promise is executed', () => {
      const interpolator = state.setTimeScale(0, 1000);
      expect(state.timeScale).toEqual(1);

      interpolator.execute(250);
      expect(state.timeScale).toEqual(0.75);
    });

    it('should resolve once the timeScale reaches the target value', async () => {
      const interpolator = state.setTimeScale(0, 1000);
      interpolator.execute(1000);

      await expect(interpolator).resolves.toBeUndefined();
    });
  });

  describe('loopCount', () => {
    it('should return a number', () => {
      expect(state.loopCount).toBeTypeOf('number');
    });
  });
});
