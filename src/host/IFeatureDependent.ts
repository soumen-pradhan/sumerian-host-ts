import AbstractHostFeature from './AbstractHostFeature';

/**
 * Class factory interface for features that are dependent on other features being
 * present on the host. Event dependencies will be listened for when a feature of
 * matching type is added to the host and will stop being listened for when one
 * is removed. If the feature is already present when constructed, events will
 * be listened for right away.
 */
export default class IFeatureDependent {
  /** Start listening for event dependencies that match the given feature type. */
  _onFeatureAdded(featureName: string) {}
  /** Stop listening for event dependencies that match the given feature type. */
  _onFeatureRemoved(featureName: string) {}
  discard() {}

  static Mixin<
    TOwner extends HostOwner,
    TBase extends Constructor<AbstractHostFeature<TOwner>>
  >(Base: TBase) {
    return class extends Base implements IFeatureDependent {
      #initialized = false;

      init() {
        if (this.#initialized) {
          throwErr(`${IFeatureDependent.name} already initialized`);
        }

        this.#initialized = true;
      }

      _onFeatureAdded(featureName: string): void {
        throwErr('Method not implemented.');
      }
      _onFeatureRemoved(featureName: string): void {
        throwErr('Method not implemented.');
      }
      override discard(): void {}
    };
  }
}
