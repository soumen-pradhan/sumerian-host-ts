/**
 * Class that can execute functions when local messages are received. Local messages
 * are prefixed with the instance's id.
 */
export default class Messenger {
  #id: number;
  #dispatcher: EventTarget = new EventTarget();

  constructor(id: number) {
    this.#id = id;
  }

  /**
   * Send a message, causing listener functions for the message on this object
   * to be executed.
   */
  emit<R>(msg: HostEvent<string, R>, value: R) {
    msg.event = this.#createLocalMsg(msg.event);
    const event = this.#createEvent(msg.event, value);
    this.#dispatcher.dispatchEvent(event);
  }

  listenTo<R>(msg: HostEvent<string, R>, callback: (v: R) => void) {
    this.#dispatcher.addEventListener(this.#createLocalMsg(msg.event), (evt) => {
      callback((evt as CustomEvent<R>).detail);
    });
  }

  #createLocalMsg = (msg: string) => `${this.#id}.${msg}`;
  #createEvent = <T>(msg: string, value: T) => new CustomEvent(msg, { detail: value });

  setDispatcher = (dispatcher: EventTarget) => (this.#dispatcher = dispatcher);

  static EVENTS = {};
}
