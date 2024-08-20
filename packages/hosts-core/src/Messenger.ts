export interface IMessenger {
  /**
   * Send a message, causing listener functions for the message on this object
   * to be executed.
   */
  emit<R>(msg: HostEvent<string, R>, value: R): void;

  /** Execute a function when a message is received for this object. */
  listenTo<R>(
    msg: HostEvent<string, R>,
    callback: (evt: CustomEvent<R>) => unknown
  ): void;

  /**
   * Prevent a function from being executed when a message is received for this
   * object.
   */
  stopListening<R>(
    msg: HostEvent<string, R>,
    callback: (evt: CustomEvent<R>) => unknown
  ): void;
}

/**
 * Class that can execute functions when local messages are received. Local messages
 * are prefixed with the instance's id.
 */
export default class Messenger implements IMessenger {
  #id: string;
  #dispatcher: EventTarget = new EventTarget();

  constructor(id: string) {
    this.#id = id;
  }

  emit<R>(msg: HostEvent<string, R>, value: R) {
    const msgEvent = this.#createLocalMsg(msg.event);
    const event = this.#createEvent(msgEvent, value);
    this.#dispatcher.dispatchEvent(event);
  }

  listenTo<R>(
    msg: HostEvent<string, R>,
    callback: (evt: CustomEvent<R>) => unknown
  ) {
    this.#dispatcher.addEventListener(
      this.#createLocalMsg(msg.event),
      callback as EventListenerOrEventListenerObject
    );
  }

  stopListening<R>(
    msg: HostEvent<string, R>,
    callback: (evt: CustomEvent<R>) => unknown
  ) {
    this.#dispatcher.removeEventListener(
      this.#createLocalMsg(msg.event),
      callback as EventListenerOrEventListenerObject
    );
  }

  #createLocalMsg(msg: string) {
    return `${this.#id}.${msg}`;
  }
  #createEvent<T>(msg: string, value: T) {
    return new CustomEvent(msg, { detail: value });
  }

  static EVENTS = {};

  static readonly global = new Messenger('global-messenger');
}
