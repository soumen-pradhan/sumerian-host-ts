import { IName } from '../utils';
import AbstractHostFeature from './AbstractHostFeature';
import Messenger from './Messenger';

/**
 * Object that manages access to all Host features. Contains a reference to
 * engine-specific visuals if applicable.
 */
export default class HostObject<TOwner extends HostOwner> extends Messenger {
  #owner: TOwner;
  #lastUpdateMs: number;
  #features: Map<string, AbstractHostFeature<TOwner>> = new Map();

  constructor({ owner }: { owner: TOwner }) {
    super(owner.id);
    this.#owner = owner;
    this.#lastUpdateMs = this.getNowMs();
  }

  /**
   * This function should be called in the engine's render loop. Executes update
   * loops for all features.
   */
  update() {
    const currentMs = this.getNowMs();
    const deltaMs = this.getDeltaMs();

    this.emit(HostObject.EVENTS.UPDATE, deltaMs);

    this.#lastUpdateMs = currentMs;
  }

  addFeature(feature: AbstractHostFeature<TOwner> & IName, force = false) {
    if (this.#features.has(feature.getName())) {
      const warning = `Feature ${feature.getName()} exists on host ${this.#owner.id}.`;

      if (force) {
        console.warn(warning + ' Existing features will be overwritten.');
      } else {
        console.warn(warning + 'Use "force" argument to overwrite this feature.');
        return false;
      }
    }

    this.#features.set(feature.getName(), feature);
    this.emit(HostObject.EVENTS.ADD_FEATURE, feature.getName());

    return true;
  }

  getOwner = () => this.#owner;
  getNowMs = () => Date.now();
  getDeltaMs = () => this.getNowMs() - this.#lastUpdateMs;

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
