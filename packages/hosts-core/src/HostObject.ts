import Messenger from './Messenger';

/**
 * Object that manages access to all Host features. Contains a reference to
 * engine-specific visuals if applicable.
 */
export default class HostObject<TOwner extends HostOwner> extends Messenger {
  #owner: TOwner;
  #lastUpdateMs: number;

  constructor({ owner }: { owner: TOwner }) {
    super(owner.id.toString());
    this.#owner = owner;
    this.#lastUpdateMs = Date.now();
  }

  get owner() {
    return this.#owner;
  }
  get id() {
    return this.#owner.id;
  }
  get nowMs() {
    return Date.now();
  }
  get deltaMs() {
    return this.nowMs - this.#lastUpdateMs;
  }

  /**
   * This function should be called in the engine's render loop. Executes update
   * loops for all features.
   */
  update() {
    const currentMs = this.nowMs;
    const deltaMs = this.deltaMs;

    // Notify listeners an update occured
    this.emit(HostObject.EVENTS.UPDATE, deltaMs);

    this.#lastUpdateMs = currentMs;
  }

  static override EVENTS: typeof Messenger.EVENTS & {
    UPDATE: HostEvent<'onUpdate', number>;
    ADD_FEATURE: HostEvent<'onAddFeature', string>;
    REMOVE_FEATURE: HostEvent<'onRemoveFeature', string>;
  } = {
    ...super.EVENTS,
    UPDATE: { event: 'onUpdate' },
    ADD_FEATURE: { event: 'onAddFeature' },
    REMOVE_FEATURE: { event: 'onRemoveFeature' },
  };
}
