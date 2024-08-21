import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockFeature, MockHost } from './mocks';
import AbstractHostFeature from '../../src/AbstractHostFeature';

describe('AbstractHostFeature', () => {
  let hostFeature: MockFeature;
  let mockHost: MockHost;

  const opts = { owner: { id: 'mock-owner' } };

  beforeEach(() => {
    mockHost = new MockHost(opts);
    hostFeature = new MockFeature(mockHost);
    mockHost.addFeature(hostFeature);
  });

  describe('host', () => {
    it('should return the object that owns the feature', () => {
      expect(mockHost).toEqual(hostFeature.host);
    });
  });

  describe('owner', () => {
    it('should return the object that owns the host that owns the feature', () => {
      expect(opts.owner).toEqual(hostFeature.owner);
    });
  });

  describe('listenTo', () => {
    it("should execute the host's listenTo method", () => {
      const hostFn = vi.spyOn(mockHost, 'listenTo');

      const event: HostEvent<'msg', void> = { event: 'msg' };
      const listener = () => {};

      hostFeature.listenTo(event, listener);

      expect(hostFn).toHaveBeenCalledWith(event, listener);
    });
  });

  describe('stopListening', () => {
    it("should execute the host's stopListening method", () => {
      const hostFn = vi.spyOn(mockHost, 'stopListening');

      const event: HostEvent<'msg', void> = { event: 'msg' };
      const listener = () => {};
      hostFeature.stopListening(event, listener);

      expect(hostFn).toHaveBeenCalledWith(event, listener);
    });
  });

  describe('emit', () => {
    it("should execute the host's emit method", () => {
      const hostFn = vi.spyOn(mockHost, 'emit');
      const event: HostEvent<'msg', string> = { event: 'msg' };
      hostFeature.emit(event, 'value');

      expect(hostFn).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should emit the update event with the value passed to update', () => {
      const emitSpy = vi.spyOn(hostFeature, 'emit');
      hostFeature.update(0.01);

      expect(emitSpy).toHaveBeenCalledWith(
        AbstractHostFeature.EVENTS.update,
        0.01
      );
    });
  });
});
