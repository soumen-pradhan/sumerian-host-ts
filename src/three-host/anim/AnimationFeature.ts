import * as THREE from 'three';

import { AnimationFeature as CoreAnimationFeature } from '../../host/anim';
import HostObject from '../HostObject';
import { IName } from '../../utils';

export default class AnimationFeature
  extends CoreAnimationFeature<THREE.Object3D>
  implements IName
{
  #mixer = new THREE.AnimationMixer(this.getHost().getOwner());

  constructor(host: HostObject) {
    super(host);
  }

  getMixer = () => this.#mixer;

  getName = () => AnimationFeature.name;
  setName = () => {};
}
