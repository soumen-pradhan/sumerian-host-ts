import AbstractHostFeature from '../AbstractHostFeature';
import IAnimationFeatureDependent from './IAnimationFeatureDependent';

/**
 * Class factory interface for that keeps track of layers and animations on a host.
 * Tracked assets are marked as inactive until layers and animations with matching
 * names are detected as present on the host.
 */
export default class IManagedAnimationLayer extends IAnimationFeatureDependent {
  /**
   * Start tracking keeping track of whether a layer with the given name is present
   * on the host.
   *
   * @param {Object=} options.animations - Animations to keep track of on the layer.
   * Animations are represented as key/value pairs of animation names and their
   * options.
   */
  registerLayer(
    name: string,
    options: { blendTime?: number; easingFn?: EasingFn; animations?: any } = {}
  ) {}

  /**
   * Start tracking keeping track of whether an animation with the given name is
   * present on the host.
   *
   * @param {Object=} options - Options for the animation.
   */
  registerAnimation(layerName: string, animationName: string, options: any = {}) {}

  /** Set layer weights on tracked layers. */
  setLayerWeights(
    nameFilter = () => true,
    weight?: number,
    seconds?: number,
    easingFn?: EasingFn
  ) {}

  /** Set all tracked layers' weights to 1. */
  enable(seconds: number, easingFn: EasingFn) {}

  /** Set all tracked layers' weights to 0. */
  disable(seconds: number, easingFn: EasingFn) {}

  static override Mixin<
    TOwner extends HostOwner,
    TBase extends Constructor<AbstractHostFeature<TOwner>>
  >(Base: TBase) {
    return class
      extends IAnimationFeatureDependent.Mixin(Base)
      implements IManagedAnimationLayer
    {
      registerLayer(
        name: string,
        options?: {
          blendTime?: number | undefined;
          easingFn?: EasingFn | undefined;
          animations?: any;
        }
      ): void {
        throw new Error('Method not implemented.');
      }
      registerAnimation(layerName: string, animationName: string, options?: any): void {
        throw new Error('Method not implemented.');
      }
      setLayerWeights(
        nameFilter?: () => boolean,
        weight?: number | undefined,
        seconds?: number | undefined,
        easingFn?: EasingFn | undefined
      ): void {
        throw new Error('Method not implemented.');
      }
      enable(seconds: number, easingFn: EasingFn): void {
        throw new Error('Method not implemented.');
      }
      disable(seconds: number, easingFn: EasingFn): void {
        throw new Error('Method not implemented.');
      }
    };
  }
}
