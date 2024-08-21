import HostObject from './HostObject';
import type { IMessenger } from './Messenger';

/**
 * Base class for all host features. Keeps a reference to the host object managing
 * the feature.
 */
export default abstract class AbstractHostFeature<TOwner extends HostOwner>
  implements IMessenger
{
  abstract name: string;

  #host: HostObject<TOwner>;

  constructor(host: HostObject<TOwner>) {
    this.#host = host;
  }

  /** Gets the host that manages the feature. */
  get host() {
    return this.#host;
  }

  /** Gets the engine owner object of the host. */
  get owner() {
    return this.#host.owner;
  }

  /**
   * Adds a namespace to the host with the name of the feature to contain properties
   * and methods from the feature that users of the host need access to.
   */
  installApi() {
    console.warn('AbstractHostFeature.installApi() not impl. Will be dynamic');
  }

  emit<R>(msg: HostEvent<string, R>, value: R): void {
    this.#host.emit(msg, value);
  }

  listenTo<R>(
    msg: HostEvent<string, R>,
    callback: (evt: CustomEvent<R>) => unknown
  ): void {
    this.#host.listenTo(msg, callback);
  }

  stopListening<R>(
    msg: HostEvent<string, R>,
    callback: (evt: CustomEvent<R>) => unknown
  ): void {
    this.#host.stopListening(msg, callback);
  }

  /** Executes each time the host is updated. */
  update(deltaMs: number) {
    this.emit(AbstractHostFeature.EVENTS.update, deltaMs);
  }

  /**
   * Clean up once the feature is no longer in use. Remove the feature namespace
   * from the host and remove reference to the host.
   */
  discard() {
    console.warn('AbstractHostFeature.discard() not impl. Will be dynamic');
  }

  /**
   * Built-in messages that the feature emits. When the feature is added to a
   * {@link HostObject}, event names will be prefixed by the
   * name of the `feature-class + '.'`.
   */
  static EVENTS: { update: HostEvent<'onUpdate', number> } = {
    update: { event: 'onUpdate' },
  };
}
