import { describe, expect, it, vi } from 'vitest';
import { throwErr } from '../../src/utils';
import { Deferred } from '../../src';

/** Run the function consuming all exceptions thrown */
async function tryConsumeError(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (_) {
    /* empty */
  }
}

describe('Deferred', () => {
  describe('constructor', () => {
    it('should create a Promise object', () => {
      expect(new Deferred()).toBeInstanceOf(Promise);
    });

    it('should execute the onResolve callback once the promise has been resolved', async () => {
      const onResolve = vi.fn();
      const deferred = new Deferred<number>(
        (resolve) => {
          resolve?.(5);
        },
        { onResolve }
      );
      await deferred;

      expect(onResolve).toHaveBeenCalledWith(5);
    });

    it('should not execute the onResolve callback if the promise tries to resolve after it has already been rejected or canceled', async () => {
      const onResolve = vi.fn();
      const onReject = vi.fn();
      const onCancel = vi.fn();

      const rejected = new Deferred<number>(
        (resolve, reject) => {
          reject?.('error');
          resolve?.(5);
        },
        { onResolve, onReject, onCancel }
      );

      await tryConsumeError(async () => await rejected);

      expect(onReject).toHaveBeenCalledWith('error');
      expect(onResolve).not.toHaveBeenCalled();

      const canceled = new Deferred(
        (resolve, _reject, cancel) => {
          cancel?.(15);
          resolve?.(5);
        },
        { onResolve, onReject, onCancel }
      );
      await canceled;

      expect(onCancel).toHaveBeenCalledWith(15);
      expect(onResolve).not.toHaveBeenCalled();
    });

    it('should execute the onReject callback once the promise has been rejected', async () => {
      const onReject = vi.fn().mockImplementation(() => {});
      const deferred = new Deferred(
        (_resolve, reject) => {
          reject?.('error');
        },
        { onReject }
      ).catch(() => {});
      await deferred;

      expect(onReject).toHaveBeenCalledWith('error');
    });

    it('should not execute the onReject callback if the promise tries to reject after it has already been resolved or canceled', async () => {
      const onResolve = vi.fn().mockImplementation(() => {});
      const onReject = vi.fn().mockImplementation(() => {});
      const onCancel = vi.fn().mockImplementation(() => {});

      const resolved = new Deferred(
        (resolve, reject) => {
          resolve?.(5);
          reject?.('error');
        },
        { onResolve, onReject, onCancel }
      );
      await resolved;

      expect(onResolve).toHaveBeenCalledWith(5);
      expect(onReject).not.toHaveBeenCalled();

      const canceled = new Deferred(
        (_resolve, reject, cancel) => {
          cancel?.(15);
          reject?.('error');
        },
        { onResolve, onReject, onCancel }
      );
      await canceled;

      expect(onCancel).toHaveBeenCalledWith(15);
      expect(onReject).not.toHaveBeenCalled();
    });

    it('should execute the onCancel callback once the promise has been canceled', async () => {
      const onCancel = vi.fn().mockImplementation(() => {});
      const deferred = new Deferred(
        (_resolve, _reject, cancel) => {
          cancel?.(15);
        },
        { onCancel }
      );
      await deferred;

      expect(onCancel).toHaveBeenCalledWith(15);
    });

    it('should not execute the onCancel callback if the promise tries to cancel after it has already been resolved or rejected', async () => {
      const onResolve = vi.fn().mockImplementation(() => {});
      const onReject = vi.fn().mockImplementation(() => {});
      const onCancel = vi.fn().mockImplementation(() => {});

      const resolved = new Deferred(
        (resolve, _reject, cancel) => {
          resolve?.(5);
          cancel?.(15);
        },
        { onResolve, onReject, onCancel }
      );
      await resolved;

      expect(onResolve).toHaveBeenCalledWith(5);
      expect(onCancel).not.toHaveBeenCalled();

      const rejected = new Deferred(
        (_resolve, reject, cancel) => {
          reject?.('error');
          cancel?.(15);
        },
        { onResolve, onReject, onCancel }
      );
      await tryConsumeError(async () => await rejected);

      expect(onReject).toHaveBeenCalledWith('error');
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('resolved', () => {
    it('should return true if the promise has been resolved', () => {
      const autoResolved = new Deferred<void>((resolve) => {
        resolve?.();
      });

      expect(autoResolved.resolved).toBeTruthy();

      const manualResolved = new Deferred<void>();
      expect(manualResolved.resolved).toBeFalsy();

      manualResolved.resolve();
      expect(manualResolved.resolved).toBeTruthy();
    });
  });

  describe('rejected', () => {
    it('should return true if the promise has been rejected', () => {
      const autoRejected = new Deferred<void>((_resolve, reject) => {
        reject?.();
      });

      autoRejected.catch(() => {
        expect(autoRejected.rejected).toBeTruthy();
      });

      const manualRejected = new Deferred<void>();
      expect(manualRejected.rejected).toBeFalsy();

      manualRejected.reject();

      manualRejected.catch(() => {
        expect(manualRejected.rejected).toBeTruthy();
      });
    });
  });

  describe('canceled', () => {
    it('should return true if the promise has been manually canceled', () => {
      const deferred = new Deferred<void>();
      expect(deferred.cancelled).toBeFalsy();

      deferred.cancel();
      expect(deferred.cancelled).toBeTruthy();
    });
  });

  describe('pending', () => {
    it('should return false if the promise has been resolved', () => {
      const autoResolved = new Deferred<void>((resolve) => {
        resolve?.();
      });

      expect(autoResolved.pending).toBeFalsy();

      const manualResolved = new Deferred<void>();
      expect(manualResolved.pending).toBeTruthy();

      manualResolved.resolve();
      expect(manualResolved.pending).toBeFalsy();
    });

    it('should return false if the promise has been rejected', () => {
      const autoRejected = new Deferred<void>((_resolve, reject) => {
        reject?.();
      });

      autoRejected.catch(() => {
        expect(autoRejected.pending).toBeFalsy();
      });

      const manualRejected = new Deferred<void>();

      expect(manualRejected.pending).toBeTruthy();

      manualRejected.reject();

      manualRejected.catch(() => {
        expect(manualRejected.pending).toBeFalsy();
      });
    });

    it('should return false if the promise has been canceled', () => {
      const autoCanceled = new Deferred<void>((_resolve, _reject, cancel) => {
        cancel?.();
      });

      expect(autoCanceled.pending).toBeFalsy();

      const manualCanceled = new Deferred<void>();
      expect(manualCanceled.pending).toBeTruthy();

      manualCanceled.cancel();
      expect(manualCanceled.pending).toBeFalsy();
    });
  });

  describe('resolve', () => {
    it('should allow the promise to manually be resolved with a value', () => {
      const onResolve = vi.fn().mockImplementation(() => {});
      const deferred = new Deferred<number>(undefined, { onResolve });

      expect(deferred.pending).toBeTruthy();

      deferred.resolve(3);

      expect(onResolve).toHaveBeenCalledWith(3);
      expect(deferred.pending).toBeFalsy();
    });
  });

  describe('reject', () => {
    it('should allow the promise to manually be rejected with a value', () => {
      const onReject = vi.fn().mockImplementation(() => {});
      const deferred = new Deferred<void>(undefined, { onReject });

      expect(deferred.pending).toBeTruthy();

      deferred.reject('error');

      deferred.catch(() => {
        expect(onReject).toHaveBeenCalledWith('error');
        expect(deferred.pending).toBeFalsy();
      });
    });
  });

  describe('cancel', () => {
    it('should allow the promise to manually be cancelled with a value and execute the onCancel argument instead of onResolve', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const deferred = new Deferred<string>(undefined, { onResolve, onCancel });
      expect(deferred.pending).toBeTruthy();

      const value = 'cancelled';
      deferred.cancel(value);

      expect(onCancel).toHaveBeenCalledWith(value);
      expect(onResolve).not.toHaveBeenCalledWith(value);
      expect(deferred.pending).toBeFalsy();
    });
  });

  describe('execute', () => {
    it("should allow the promise's executor to be manually executed", () => {
      const state = { s: 0 };
      const exec = vi.fn((_a0, _a1, _a2, a3) => (state.s = +a3));
      const deferred = new Deferred(exec);
      expect(exec).toHaveBeenCalledTimes(1);

      deferred.execute(5);
      expect(state.s).toEqual(5);
    });

    it('should not run the executor if the promise is no longer pending', (ctx) => {
      ctx.skip();

      const exec = vi.fn((res) => {
        console.log('resolved');
        res();
      });

      const deferred = new Deferred<void>(exec);
      expect(deferred.pending).toBeTruthy();

      deferred.execute();

      expect(deferred.pending).toBeFalsy();
      expect(exec).not.toHaveBeenCalled();
    });
  });

  describe('static cancel', () => {
    it('should return a Deferred whose canceled property returns true', () => {
      const result = Deferred.cancelled(15);

      expect(result).toBeInstanceOf(Deferred);
      expect(result.pending).toBeFalsy();
      expect(result.resolved).toBeFalsy();
      expect(result.rejected).toBeFalsy();
      expect(result.cancelled).toBeTruthy();
    });

    it('should return a Deferred that resolves to the provieded value', () => {
      const result = Deferred.cancelled(15);

      return expect(result).resolves.toEqual(15);
    });
  });

  describe('static all', () => {
    it('should return a Deferred', () => {
      expect(Deferred.all([])).toBeInstanceOf(Deferred);
    });

    // prettier-ignore
    it('should return a rejected Deferred if a non-iterable is passed as the first argument', async () => {
      // @ts-expect-error Param iterable is undefined here
      await expect(Deferred.all().catch(throwErr)).rejects.toThrow();
      // @ts-expect-error Param iterable is undefined here
      await expect(Deferred.all(undefined).catch(throwErr)).rejects.toThrow();
      // @ts-expect-error Param iterable is undefined here
      await expect(Deferred.all(null).catch(throwErr)).rejects.toThrow();
      await expect(Deferred.all(true as unknown as []).catch(throwErr)).rejects.toThrow()
      await expect(Deferred.all(1 as unknown as []).catch(throwErr)).rejects.toThrow()
      await expect(Deferred.all(NaN as unknown as []).catch(throwErr)).rejects.toThrow()
      await expect(Deferred.all({ value: 1 } as unknown as []).catch(throwErr)).rejects.toThrow()
    });

    it('should resolve with an array matching the contents of the original iterable if none of the items in the iterable are non-promises', async () => {
      {
        const allStr = Deferred.all('12345' as unknown as []);
        await expect(allStr).resolves.toEqual(['1', '2', '3', '4', '5']);

        await allStr;
        expect(allStr.resolved).toBeTruthy();
      }

      {
        const array = [1, 2, 3, 4, 5];
        const allArray = Deferred.all(array);
        await expect(allArray).resolves.toEqual(array);

        await allArray;

        expect(allArray.resolved).toBeTruthy();
      }

      {
        const mixedArray = [1, 2, Promise.resolve(3), 4, 5];
        const allMixedArray = Deferred.all(mixedArray);
        await expect(allMixedArray).resolves.not.toEqual(mixedArray);

        await allMixedArray;
        expect(allMixedArray.resolved).toBeTruthy();
      }
    });

    it('should resolve with an array matching the values and resolved values of the original iterable if the iterable contains promises', async () => {
      const mixedArray = [1, 2, Promise.resolve(3), 4, 5];
      const allMixedArray = Deferred.all(mixedArray);

      await expect(allMixedArray).resolves.not.toEqual(mixedArray);
      await expect(allMixedArray).resolves.toEqual([1, 2, 3, 4, 5]);

      await allMixedArray;

      expect(allMixedArray.resolved).toBeTruthy();
    });

    it('should resolve with the first canceled value if the iterable contains a Deferred that gets canceled', async () => {
      const mixedArray = [
        1,
        Deferred.cancelled(5),
        Promise.resolve(3),
        Deferred.cancelled(15),
        5,
      ];
      const allMixedArray = Deferred.all(mixedArray);
      await expect(allMixedArray).resolves.toBeDefined();
      await expect(allMixedArray).resolves.not.toEqual(mixedArray);
      await expect(allMixedArray).resolves.toEqual(5);

      await allMixedArray;

      expect(allMixedArray.resolved).toBeFalsy();
      expect(allMixedArray.cancelled).toBeTruthy();
    });

    it('should cancel any pending Deferred promises with the value of the first canceled Deferred', async () => {
      const p1 = new Deferred((resolve) => {
        resolve?.(5);
      });
      const p2 = new Deferred();
      const p3 = new Deferred();
      const p4 = new Deferred();
      const all = Deferred.all([p1, p2, p3, p4]);

      await expect(p1).resolves.toEqual(5);

      await p1;

      expect(p1.resolved).toBeTruthy();
      expect(p2.resolved).toBeFalsy();
      expect(p3.resolved).toBeFalsy();
      expect(p4.resolved).toBeFalsy();
      expect(all.resolved).toBeFalsy();

      p3.cancel('cancelValue');

      await expect(all).resolves.toEqual('cancelValue');
      await expect(p1).resolves.toEqual(5);
      await expect(p2).resolves.toEqual('cancelValue');
      await expect(p3).resolves.toEqual('cancelValue');
      await expect(p4).resolves.toEqual('cancelValue');

      await p2;
      await p3;
      await p4;
      await all;

      expect(p1.resolved).toBeTruthy();
      expect(p1.cancelled).toBeFalsy();

      expect(p2.resolved).toBeFalsy();
      expect(p2.cancelled).toBeTruthy();

      expect(p3.resolved).toBeFalsy();
      expect(p3.cancelled).toBeTruthy();

      expect(p4.resolved).toBeFalsy();
      expect(p4.cancelled).toBeTruthy();

      expect(all.resolved).toBeFalsy();
      expect(all.cancelled).toBeTruthy();
    });

    it('should reject with the first rejected value if the iterable contains a promise that gets canceled', async () => {
      const mixedArray = [
        1,
        Deferred.resolve(5),
        Promise.reject(new Error('error')),
        new Deferred(),
        5,
      ];
      const allMixedArray = Deferred.all(mixedArray);
      await expect(allMixedArray).rejects.toThrow();
      await expect(allMixedArray).rejects.not.toEqual(mixedArray);
      await expect(allMixedArray).rejects.toEqual(new Error('error'));

      await expect(allMixedArray).rejects.not.toEqual(mixedArray);
      await expect(allMixedArray).rejects.toEqual(new Error('error'));

      await tryConsumeError(async () => await allMixedArray);

      expect(allMixedArray.resolved).toBeFalsy();
      expect(allMixedArray.rejected).toBeTruthy();
    });

    it('should reject any pending Deferred promises with the value of the first rejected Deferred', async () => {
      const p1 = new Deferred((resolve) => {
        resolve?.(5);
      });
      const p2 = new Deferred();
      const p3 = new Deferred();
      const p4 = new Deferred();
      const all = Deferred.all([p1, p2, p3, p4]);

      await expect(p1).resolves.toEqual(5);

      await p1;

      expect(p1.resolved).toBeTruthy();
      expect(p2.resolved).toBeFalsy();
      expect(p3.resolved).toBeFalsy();
      expect(p4.resolved).toBeFalsy();
      expect(all.resolved).toBeFalsy();

      p3.reject('error');

      await expect(all).rejects.toEqual('error');
      await expect(p1).resolves.toEqual(5);
      await expect(p2).rejects.toEqual('error');
      await expect(p3).rejects.toEqual('error');
      await expect(p4).rejects.toEqual('error');

      await tryConsumeError(async () => await p2);
      await tryConsumeError(async () => await p3);
      await tryConsumeError(async () => await p4);
      await tryConsumeError(async () => await all);

      expect(p1.resolved).toBeTruthy();
      expect(p1.rejected).toBeFalsy();
      expect(p2.resolved).toBeFalsy();
      expect(p2.rejected).toBeTruthy();
      expect(p3.resolved).toBeFalsy();
      expect(p3.rejected).toBeTruthy();
      expect(p4.resolved).toBeFalsy();
      expect(p4.rejected).toBeTruthy();
      expect(all.resolved).toBeFalsy();
      expect(all.rejected).toBeTruthy();
    });

    it('should resolve any pending Deferred promises with the resolve value if the Deferred.all promise is manually resolved', async () => {
      const p1 = new Deferred((resolve) => {
        resolve?.(5);
      });
      const p2 = new Deferred();
      const p3 = new Deferred();
      const p4 = new Deferred();
      const all = Deferred.all([3, p1, p2, p3, p4]);

      await expect(p1).resolves.toEqual(5);

      await p1;

      expect(p1.resolved).toBeTruthy();
      expect(p2.resolved).toBeFalsy();
      expect(p3.resolved).toBeFalsy();
      expect(p4.resolved).toBeFalsy();
      expect(all.resolved).toBeFalsy();

      p3.resolve('five');

      await expect(p1).resolves.toEqual(5);
      await expect(p3).resolves.toEqual('five');

      await p3;

      expect(p1.resolved).toBeTruthy();
      expect(p2.resolved).toBeFalsy();
      expect(p3.resolved).toBeTruthy();
      expect(p4.resolved).toBeFalsy();
      expect(all.resolved).toBeFalsy();

      // @ts-expect-error Value should be an array
      all.resolve(10);

      await expect(p1).resolves.toEqual(5);
      await expect(p2).resolves.toEqual(10);
      await expect(p3).resolves.toEqual('five');
      await expect(p4).resolves.toEqual(10);
      await expect(all).resolves.toEqual(10);

      await p2;
      await p4;
      await all;

      expect(p1.resolved).toBeTruthy();
      expect(p1.cancelled).toBeFalsy();
      expect(p2.resolved).toBeTruthy();
      expect(p2.cancelled).toBeFalsy();
      expect(p3.resolved).toBeTruthy();
      expect(p3.cancelled).toBeFalsy();
      expect(p4.resolved).toBeTruthy();
      expect(p4.cancelled).toBeFalsy();
      expect(all.resolved).toBeTruthy();
      expect(all.cancelled).toBeFalsy();
    });
  });
});
