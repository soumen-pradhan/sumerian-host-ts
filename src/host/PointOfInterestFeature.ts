import { IName } from '../utils';
import AbstractHostFeature from './AbstractHostFeature';
import HostObject from './HostObject';
import IManagedAnimationLayer from './anim/IManagedAnimationLayer';
import { ISSMLSpeechmark } from './aws/ITextToSpeechDependent';

export default class PointOfInterestFeature<TOwner extends HostOwner>
  extends IManagedAnimationLayer.Mixin(ISSMLSpeechmark.Mixin(AbstractHostFeature))<TOwner>
  implements IName
{
  constructor(host: HostObject<TOwner>) {
    super(host);
  }

  getName = () => PointOfInterestFeature.name;
  setName = () => {};
}
