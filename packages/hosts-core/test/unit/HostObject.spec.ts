import { beforeEach, describe, expect, it } from 'vitest';
import { HostObject } from '../../src';

describe('HostObject', () => {
  let host: HostObject<{ id: string }> | undefined;

  beforeEach(() => {
    host = new HostObject({ owner: { id: 'host-spec' } });
  });

  describe('id', () => {
    it("should return the owner's id", () => {
      const actual = host!.id;
      const expected = host!.owner.id;
      expect(actual).toEqual(expected);
    });
  });

  describe('now', () => {
    it('should return a number greater than zero', () => {
      expect(host!.nowMs).toBeGreaterThan(0);
    });
  });

  describe('deltaTime', () => {
    it('should return the number of milliseconds since the last time update was called', async () => {
      host!.update();

      await new Promise((res) => setTimeout(res, 100));
      expect(host!.deltaMs / 1000).toBeCloseTo(0.1, 0);
    });
  });

  describe('update', () => {
    it('should emit the update event', async () => {
      const promise = new Promise<void>((resolve) => {
        host!.listenTo(HostObject.EVENTS.UPDATE, () => {
          resolve();
        });
      });

      host!.update();

      await expect(promise).resolves.toBeUndefined();
    });
  });
});
