import HostObject from './HostObject';

/**
 * Base class for all host features. Keeps a reference to the host object managing
 * the feature.
 */
export default class AbstractHostFeature<TOwner extends HostOwner> {
  readonly #host: HostObject<TOwner>;

  constructor(host: HostObject<TOwner>) {
    this.#host = host;
  }

  discard() {}

  getHost = () => this.#host;
}

export class PPP<TOwner extends HostOwner> extends AbstractHostFeature<TOwner> {}
