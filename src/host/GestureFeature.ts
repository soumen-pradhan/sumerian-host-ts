import AbstractHostFeature from './AbstractHostFeature';
import IManagedAnimationLayer from './anim/IManagedAnimationLayer';
import { ISSMLSpeechmark } from './aws/ITextToSpeechDependent';

export default class GestureFeature<
  TOwner extends HostOwner
> extends IManagedAnimationLayer.Mixin(
  ISSMLSpeechmark.Mixin(AbstractHostFeature)
)<TOwner> {}
