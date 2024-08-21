import { beforeEach, describe, expect, it } from 'vitest';
import { HostObject } from '../../src';
import { MockFeature } from './mocks';

describe('HostObject', () => {
  let host: HostObject<{ id: string }>;

  beforeEach(() => {
    host = new HostObject({ owner: { id: 'host-spec' } });
  });

  describe('id', () => {
    it("should return the owner's id", () => {
      const actual = host.id;
      const expected = host.owner.id;
      expect(actual).toEqual(expected);
    });
  });

  describe('now', () => {
    it('should return a number greater than zero', () => {
      expect(host.nowMs).toBeGreaterThan(0);
    });
  });

  describe('deltaTime', () => {
    it('should return the number of milliseconds since the last time update was called', async () => {
      host.update();

      await new Promise((res) => setTimeout(res, 100));
      expect(host.deltaMs / 1000).toBeCloseTo(0.1, 0);
    });
  });

  describe('update', () => {
    it('should emit the update event', async () => {
      const promise = new Promise<void>((resolve) => {
        host.listenTo(HostObject.EVENTS.UPDATE, () => {
          resolve();
        });
      });

      host.update();

      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('addFeature', () => {
    it('should emit the addFeature event with the name of the feature that has been added', async () => {
      const promise = new Promise((resolve) => {
        host.listenTo(
          HostObject.EVENTS.ADD_FEATURE,
          ({ detail: featureName }) => {
            resolve(featureName);
          }
        );
      });

      host.addFeature(new MockFeature(host));

      await expect(promise).resolves.toEqual('MockFeature');
    });

    it('should only add a feature type that already exists if force argument is true', () => {
      host.addFeature(new MockFeature(host));

      expect(host.addFeature(new MockFeature(host))).toBeFalsy();
      expect(host.addFeature(new MockFeature(host), true)).toBeTruthy();
    });
  });

  describe('hasFeature', () => {
    it('should return true if the host owns a feature with the given name', () => {
      host.addFeature(new MockFeature(host));
      expect(host.hasFeature('MockFeature')).toBeTruthy();
    });

    it('should return false if the host does not own a feature with the given name', () => {
      expect(host.hasFeature('SomeOtherHostFeature')).toBeFalsy();
    });
  });

  describe('listFeatures', () => {
    it('should return an array of the names of installed features', () => {
      host.addFeature(new MockFeature(host));
      expect(host.listFeatures()).toContain('MockFeature');
    });
  });

  describe('removeFeature', () => {
    it('should return false if no feature with the given name was installed', () => {
      expect(host.removeFeature('SomeOtherHostFeature')).toBeFalsy();
    });

    it('should return true if a feature is successfully uninstalled', () => {
      host.addFeature(new MockFeature(host));
      expect(host.removeFeature('MockFeature')).toBeTruthy();
    });

    it('should emit the removeFeature event with the name of the feature that has been removed', async () => {
      host.addFeature(new MockFeature(host));

      const promise = new Promise((resolve) => {
        host.listenTo(
          HostObject.EVENTS.REMOVE_FEATURE,
          ({ detail: featureName }) => {
            resolve(featureName);
          }
        );
      });

      host.removeFeature('MockFeature');

      await expect(promise).resolves.toEqual('MockFeature');
    });
  });
});
