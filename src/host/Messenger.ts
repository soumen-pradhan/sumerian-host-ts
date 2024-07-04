import { uuid } from '../utils';

/**
 * Class that can execute functions when local messages are received. Local messages
 * are prefixed with the instance's id.
 */
export default class Messenger {
  #id: string;
  #dispatcher: EventTarget = new EventTarget();

  constructor(id: string) {
    this.#id = id;
  }

  /**
   * Send a message, causing listener functions for the message on this object
   * to be executed.
   */
  emit<R>(msg: HostEvent<string, R>, value: R) {
    const msgEvent = this.#createLocalMsg(msg.event);
    const event = this.#createEvent(msgEvent, value);
    this.#dispatcher.dispatchEvent(event);
  }

  /** Execute a function when a message is received for this object. */
  listenTo<R>(msg: HostEvent<string, R>, callback: (evt: CustomEvent<R>) => any) {
    this.#dispatcher.addEventListener(
      this.#createLocalMsg(msg.event),
      callback as EventListenerOrEventListenerObject
    );
  }

  /**
   * Prevent a function from being executed when a message is received for this
   * object.
   */
  stopListening<R>(msg: HostEvent<string, R>, callback: (evt: CustomEvent<R>) => any) {
    this.#dispatcher.removeEventListener(
      this.#createLocalMsg(msg.event),
      callback as EventListenerOrEventListenerObject
    );
  }

  #createLocalMsg = (msg: string) => `${this.#id}.${msg}`;
  #createEvent = <T>(msg: string, value: T) => new CustomEvent(msg, { detail: value });

  static EVENTS = {};

  static readonly global = new Messenger(uuid());
}
