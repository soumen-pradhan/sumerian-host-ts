import AbstractHostFeature from './AbstractHostFeature';
import IManagedAnimationLayer from './anim/IManagedAnimationLayer';
import { ITextToSpeechFeatureDependent } from './aws/ITextToSpeechDependent';

export default class LipsyncFeature<
  TOwner extends HostOwner
> extends IManagedAnimationLayer.Mixin(
  ITextToSpeechFeatureDependent.Mixin(AbstractHostFeature)
)<TOwner> {}
