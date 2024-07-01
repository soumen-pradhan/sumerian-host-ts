import AbstractHostFeature from '../AbstractHostFeature';
import IFeatureDependent from '../IFeatureDependent';

/**
 * Class factory interface for features that are dependent on the AnimationFeature
 * being present on the host. Layer and animation events will automatically be
 * listened for once a AnimationFeature is added to the host and stopped once it
 * is removed.
 */
export default class IAnimationFeatureDependent extends IFeatureDependent {
  _onLayerAdded(event: { name: string }) {}
  _onLayerRemoved(event: { name: string }) {}
  _onLayerRenamed(event: { oldName: string; newName: string }) {}
  _onAnimationAdded(event: { layerName: string; animationName: string }) {}
  _onAnimationRemoved(event: { layerName: string; animationName: string }) {}
  _onAnimationRenamed(event: { layerName: string; oldName: string; newName: string }) {}

  static override Mixin<
    TOwner extends HostOwner,
    TBase extends Constructor<AbstractHostFeature<TOwner>>
  >(Base: TBase) {
    return class
      extends IFeatureDependent.Mixin(Base)
      implements IAnimationFeatureDependent
    {
      _onLayerAdded(event: { name: string }): void {}
      _onLayerRemoved(event: { name: string }): void {}
      _onLayerRenamed(event: { oldName: string; newName: string }): void {}
      _onAnimationAdded(event: { layerName: string; animationName: string }): void {}
      _onAnimationRemoved(event: { layerName: string; animationName: string }): void {}
      _onAnimationRenamed(event: {
        layerName: string;
        oldName: string;
        newName: string;
      }) {}
    };
  }
}
