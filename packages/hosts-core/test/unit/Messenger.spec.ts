import { describe, expect, it, vi } from 'vitest';
import { Messenger } from '../../src';

describe('Messenger', () => {
  describe('constructor.GlobalMessenger', () => {
    it('should be an instance of Messenger', () => {
      expect(Messenger.global).toBeInstanceOf(Messenger);
    });
  });

  describe('listenTo', () => {
    const testEvent: HostEvent<'testListenTo', number> = {
      event: 'testListenTo',
    };

    it('can execute a listener when a message is received', () => {
      const messenger = new Messenger('listenTo');
      const listener = vi.fn(() => 1);

      messenger.listenTo(testEvent, listener);
      messenger.emit(testEvent, 2);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('can execute a listener multiple times if listenTo is called with the same message and listener multiple times', () => {
      const messenger = new Messenger('listenTo');

      const listener = vi.fn(() => 1);

      messenger.listenTo(testEvent, listener);
      messenger.emit(testEvent, 2);
      messenger.emit(testEvent, 3);
      messenger.emit(testEvent, 4);

      expect(listener).toHaveBeenCalledTimes(3);
    });
  });

  describe('stopListening', () => {
    const testEvent: HostEvent<'testStopListening', number> = {
      event: 'testStopListening',
    };

    it('can stop a specific listener from being executed when a message is received', () => {
      const messenger = new Messenger('stopListening');

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      messenger.listenTo(testEvent, listener1);
      messenger.listenTo(testEvent, listener2);
      messenger.stopListening(testEvent, listener1);
      messenger.emit(testEvent, 1);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });
});
