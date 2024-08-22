import AbstractHostFeature from '../AbstractHostFeature';

/** Feature for managing animations on an object. */
export default class AnimationFeature<
  TOwner extends HostOwner,
> extends AbstractHostFeature<TOwner> {
  override name = AnimationFeature.name;
}
