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

  /** Add a host feature. Adds dynamically as well. */
  addFeature(feature: AbstractHostFeature<TOwner>, force = false): boolean {
    if (this.#features.has(feature.name)) {
      const warning = `Feature ${feature.name} exists on host ${this.id}.`;

      if (force) {
        console.warn(warning + ' Existing features will be overwritten.');
      } else {
        console.warn(
          warning + 'Use "force" argument to overwrite this feature.'
        );
        return false;
      }
    }

    feature.installApi();
    this.#features.set(feature.name, feature);
    this.emit(HostObject.EVENTS.ADD_FEATURE, feature.name);

    return true;
  }

  /**
   * Remove a feature from the host.
   * @param featureName Name of the type of feature to remove.
   * @returns Whether the feature was successfully removed.
   */
  removeFeature(featureName: string): boolean {
    if (!this.#features.has(featureName)) {
      console.warn(`Feature:${featureName} does not exist on ${this.id}.`);
      return false;
    }

    this.emit(HostObject.EVENTS.REMOVE_FEATURE, featureName);
    this.#features.get(featureName)!.discard();
    return this.#features.delete(featureName);
  }

  hasFeature(featureName: string): boolean {
    return this.#features.has(featureName);
  }

  listFeatures(): string[] {
    return [...this.#features.keys()];
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
