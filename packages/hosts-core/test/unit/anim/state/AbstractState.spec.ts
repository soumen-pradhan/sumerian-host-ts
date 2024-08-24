import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractState } from '../../../../src/anim';
import Deferred from '../../../../src/Deferred';

describe('AbstractState', () => {
  let state: AbstractState;

  beforeEach(() => {
    state = new AbstractState();
  });

  describe('weight', () => {
    it('should return a number', () => {
      expect(state.weight).toBeTypeOf('number');
    });

    it('should be clamped between 0 and 1', () => {
      expect(state.weight).toEqual(0);

      state.setWeight(10);
      expect(state.weight).toEqual(1);

      state.setWeight(-10);
      expect(state.weight).toEqual(0);
    });
  });

  describe('weightPending', () => {
    it('should return true if the weight promise has not been resolved, rejected or canceled', () => {
      state._promises.weight = new Deferred();

      expect(state.weightPending).toBeTruthy();
    });

    it('should return false if the weight promise has been resolved', () => {
      state._promises.weight = new Deferred();

      expect(state.weightPending).toBeTruthy();

      state._promises.weight.resolve();

      expect(state.weightPending).toBeFalsy();
    });

    it('should return false if the weight promise has been rejected', () => {
      state._promises.weight = new Deferred();

      expect(state.weightPending).toBeTruthy();

      state._promises.weight.reject();

      state._promises.weight.catch(() => {
        expect(state.weightPending).toBeFalsy();
      });
    });

    it('should return false if the weight promise has been canceled', () => {
      state._promises.weight = new Deferred();

      expect(state.weightPending).toBeTruthy();

      state._promises.weight.cancel();

      expect(state.weightPending).toBeFalsy();
    });
  });

  describe('setWeight', () => {
    it('should return a deferred promise', () => {
      const interpolator = state.setWeight(1);

      expect(interpolator).toBeInstanceOf(Deferred);
    });

    it('should update the weight value when the promise is executed', () => {
      const interpolator = state.setWeight(1, 1000);
      expect(state.weight).toEqual(0);

      interpolator.execute(250);
      expect(state.weight).toEqual(0.25);
    });

    it('should resolve once the weight reaches the target value', async () => {
      const interpolator = state.setWeight(1, 1000);
      interpolator.execute(1000);

      await expect(interpolator).resolves.toBeUndefined();
    });
  });

  describe('updateInternalWeight', () => {
    it('should update the _internalWeight property', () => {
      state.setWeight(1);
      state.updateInternalWeight(1);
      const currentWeight = state.internalWeight;

      state.updateInternalWeight(0.5);

      expect(state.internalWeight).not.toEqual(currentWeight);
    });

    it('should set the _internal weight to the value of weight multiplied by the input factor', () => {
      state.setWeight(0.5);
      state.updateInternalWeight(0.5);

      expect(state.internalWeight).toEqual(0.25);
    });
  });

  describe('update', () => {
    it('should execute all stored promises if _paused is false', () => {
      state._promises = {
        weight: new Deferred(),
        play: new Deferred(),
        finish: new Deferred(),
      };
      const onExecuteWeight = vi.spyOn(state._promises.weight, 'execute');
      const onExecutePlay = vi.spyOn(state._promises.play, 'execute');
      const onExecuteFinish = vi.spyOn(state._promises.finish, 'execute');
      state._paused = true;
      state.update(200);

      expect(onExecuteWeight).not.toHaveBeenCalled();
      expect(onExecutePlay).not.toHaveBeenCalled();
      expect(onExecuteFinish).not.toHaveBeenCalled();

      state._paused = false;
      state.update(200);

      expect(onExecuteWeight).toHaveBeenCalledTimes(1);
      expect(onExecutePlay).toHaveBeenCalledTimes(1);
      expect(onExecuteFinish).toHaveBeenCalledTimes(1);
    });
  });

  describe('play', () => {
    it('should set _paused to false', () => {
      state.pause();
      state.play();

      expect(state.paused).toBeFalsy();
    });

    it('should create and store new play and finish promises', (ctx) => {
      ctx.skip();

      const playPromise = state._promises.play;
      const finishPromise = state._promises.finish;

      state.play();

      expect(state._promises.play).not.toEqual(playPromise);
      expect(state._promises.finish).not.toEqual(finishPromise);
    });

    it('should return a deferred promise', () => {
      expect(state.play()).toBeInstanceOf(Deferred);
    });
  });

  describe('pause', () => {
    it('should set _paused to true', () => {
      state._paused = false;
      state.pause();

      expect(state._paused).toBeTruthy();
    });

    it('should return a boolean', () => {
      expect(state.pause()).toBeTypeOf('boolean');
    });
  });

  describe('resume', () => {
    it('should set _paused to false', () => {
      state._paused = true;
      state.resume();

      expect(state._paused).toBeFalsy();
    });

    it('should create and store new play and finish promises if the current play promise is no longer pending', () => {
      state._promises = {
        play: new Deferred(),
        finish: new Deferred(),
        weight: new Deferred(),
      };
      const playPromise = state._promises.play;
      const finishPromise = state._promises.finish;

      state.resume();
      let playEqual = state._promises.play === playPromise;
      let finishEqual = state._promises.finish === finishPromise;

      expect(playEqual).toBeTruthy();
      expect(finishEqual).toBeTruthy();

      playPromise.resolve();
      state.resume();
      playEqual = state._promises.play === playPromise;
      finishEqual = state._promises.finish === finishPromise;

      expect(playEqual).toBeFalsy();
      expect(finishEqual).toBeFalsy();
    });

    it('should return a deferred promise', () => {
      expect(state.resume()).toBeInstanceOf(Deferred);
    });
  });

  describe('cancel', () => {
    it('should set _paused to true', () => {
      state._paused = false;
      state.cancel();

      expect(state._paused).toBeTruthy();
    });

    it('should cancel all stored promises', async () => {
      state._promises = {
        weight: new Deferred(),
        play: new Deferred(),
        finish: new Deferred(),
      };
      const onCancelWeight = vi.spyOn(state._promises.weight, 'cancel');
      const onCancelPlay = vi.spyOn(state._promises.play, 'cancel');
      const onCancelFinish = vi.spyOn(state._promises.finish, 'cancel');

      state.cancel();

      expect(onCancelWeight).toHaveBeenCalledTimes(1);
      expect(onCancelPlay).toHaveBeenCalledTimes(1);
      expect(onCancelFinish).toHaveBeenCalledTimes(1);

      await expect(state._promises.weight).resolves.toBeUndefined();
      await expect(state._promises.play).resolves.toBeUndefined();
      await expect(state._promises.finish).resolves.toBeUndefined();
    });

    it('should return a boolean', () => {
      expect(state.cancel()).toBeTypeOf('boolean');
    });
  });

  describe('stop', () => {
    it('should set _paused to true', () => {
      state._paused = false;
      state.stop();

      expect(state._paused).toBeTruthy();
    });

    it('should resolve all stored promises', async () => {
      state._promises = {
        weight: new Deferred(),
        play: new Deferred(),
        finish: new Deferred(),
      };
      const onResolveWeight = vi.spyOn(state._promises.weight, 'resolve');
      const onResolvePlay = vi.spyOn(state._promises.play, 'resolve');
      const onResolveFinish = vi.spyOn(state._promises.finish, 'resolve');

      state.stop();

      expect(onResolveWeight).toHaveBeenCalledTimes(1);
      expect(onResolvePlay).toHaveBeenCalledTimes(1);
      expect(onResolveFinish).toHaveBeenCalledTimes(1);

      await expect(state._promises.weight).resolves.toBeUndefined();
      await expect(state._promises.play).resolves.toBeUndefined();
      await expect(state._promises.finish).resolves.toBeUndefined();
    });

    it('should return a boolean', () => {
      expect(typeof state.stop()).toEqual('boolean');
    });
  });

  describe('discard', () => {
    it('should cancel the state', () => {
      const onCancel = vi.spyOn(state, 'cancel');
      state.discard();

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('deactivate', () => {
    it('should execute updateInternalWeight with a value of 0', () => {
      const onUpdateInternalWeight = vi.spyOn(state, 'updateInternalWeight');
      state.deactivate();

      expect(onUpdateInternalWeight).toHaveBeenCalledWith(0);
    });
  });
});
