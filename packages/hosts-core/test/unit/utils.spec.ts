import { describe, expect, it, vi } from 'vitest';
import Utils from '../../src/utils';
import { Deferred } from '../../src';

describe('Utils', () => {
  describe('createId', () => {
    it('should generate a string', () => {
      expect(Utils.uuid()).toBeTypeOf('string');
    });
  });

  describe('getUniqueName', () => {
    const nameArray = [
      'name',
      'nameOther',
      'name1',
      'name5',
      'name-5',
      'name14',
    ];

    it('should return the original name if it is not included in the provided array of names', () => {
      expect(Utils.getUniqueName('uniqueName', nameArray)).toEqual(
        'uniqueName'
      );

      expect(Utils.getUniqueName('name', nameArray)).not.toEqual('name');
    });

    it('should return a string that matches the original name with the highest trailing number appended if it is included in the provided array of names', () => {
      expect(Utils.getUniqueName('name', nameArray)).toEqual('name15');

      expect(Utils.getUniqueName('name-5', nameArray)).toEqual('name-6');

      expect(Utils.getUniqueName('nameOther', nameArray)).toEqual('nameOther1');
    });
  });

  describe('wait', () => {
    it('should return a Deferred promise', () => {
      expect(Utils.wait(3)).toBeInstanceOf(Deferred);
    });

    it('should resolve immediately if the seconds argument is less than or equal to zero', async () => {
      await expect(Utils.wait(0)).resolves.toBeUndefined();
      await expect(Utils.wait(-1)).resolves.toBeUndefined();
    });

    describe('execute', () => {
      it('should reject the promise if a non-numeric deltaTime argument is passed', () => {
        const waitDeferred = Utils.wait(1);
        waitDeferred.execute('notANumber');

        return expect(waitDeferred).rejects.toThrowError();
      });

      it('should execute the onProgress function argument each time the deferred is executed with a non-zero delta time', () => {
        const onProgress = vi.fn();
        const waitDeferred = Utils.wait(1, { onProgress });

        waitDeferred.execute(0);

        expect(onProgress).not.toHaveBeenCalled();

        waitDeferred.execute(100);

        expect(onProgress).toHaveBeenCalledTimes(1);
      });

      it('should resolve the promise once the required number of seconds has elapsed', async () => {
        const waitDeferred = Utils.wait(1);

        waitDeferred.execute(1000);

        await expect(waitDeferred).resolves.toBeUndefined();
      });
    });
  });

  describe('AnimUtils', () => {
    describe('interpolateProperty', () => {
      it('should return a Deferred promise', () => {
        const animated = { weight: 0 };

        expect(Utils.Anim.interpolate(animated, 'weight', 1)).toBeInstanceOf(
          Deferred
        );
      });

      it('should return a rejected promise if the property value is not numeric', async () => {
        const animated = { weight: 'abc' };

        await expect(
          Utils.Anim.interpolate(animated, 'weight', 1)
        ).rejects.toThrowError();
      });

      it('should return a rejected promise if the target value is not numeric', async () => {
        const animated = { weight: 0 };

        await expect(
          // @ts-expect-error targetValue is supposed to be non-numeric
          Utils.Anim.interpolate(animated, 'weight', 'abc')
        ).rejects.toThrowError();
      });

      it('should set the property to the target value and resolve on its own if the ms option is 0 or undefined', async () => {
        const animated = { weight: 0 };

        await expect(
          Utils.Anim.interpolate(animated, 'weight', 1)
        ).resolves.toBeUndefined();

        expect(animated.weight).toEqual(1);

        await expect(
          Utils.Anim.interpolate(animated, 'weight', 2, { ms: 0 })
        ).resolves.toBeUndefined();

        expect(animated.weight).toEqual(2);
      });

      describe('execute', () => {
        it('should reject the promise if a non-numeric deltaTime argument is passed', async () => {
          const animated = { weight: 0 };
          const interpolator = Utils.Anim.interpolate(animated, 'weight', 1, {
            ms: 1000,
          });

          interpolator.execute('abc');

          await expect(interpolator).rejects.toThrowError();
        });

        it('should execute the onProgress functiuon argument', () => {
          const animated = { weight: 0 };
          const onProgress = vi.fn();
          const interpolator = Utils.Anim.interpolate(animated, 'weight', 1, {
            ms: 1000,
            onProgress,
          });
          interpolator.execute(100);

          expect(onProgress).toHaveBeenCalledWith(0.1);
        });

        it('should resolve the promise once the target value is reached and seconds has elapsed', async () => {
          const animated = { weight: 0 };
          const interpolator = Utils.Anim.interpolate(animated, 'weight', 1, {
            ms: 1000,
          });
          interpolator.execute(1000);

          await expect(interpolator).resolves.toBeUndefined();
        });
      });
    });
  });
});
