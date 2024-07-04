import HostObject from './HostObject';

/**
 * Base class for all host features. Keeps a reference to the host object managing
 * the feature.
 */
export default class AbstractHostFeature<TOwner extends HostOwner> {
  #host: HostObject<TOwner>;

  constructor(host: HostObject<TOwner>) {
    this.#host = host;
  }

  discard() {}

  getHost = () => this.#host;

  /**
   * Built-in messages that the feature emits. When the feature is added to a
   * {@link HostObject}, event names will be prefixed by the
   * name of the `feature-class + '.'`.
   */
  static EVENTS: { update: HostEvent<'onUpdate', any> } = {
    update: { event: 'onUpdate' },
  };
}

export class PPP<TOwner extends HostOwner> extends AbstractHostFeature<TOwner> {}
