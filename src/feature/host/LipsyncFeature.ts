import Msg from '../../utils/Msg';
import FreeBlendState from '../state/FreeBlendState';
import AbstractHostFeature from './AbstractHostFeature';
import HostObject from './HostObject';
import TextToSpeakFeature from './TextToSpeakFeature';

export default class LipSyncFeature extends AbstractHostFeature {
  #textToSpeechFeature: TextToSpeakFeature;
  #visemeState: FreeBlendState;

  constructor(
    host: HostObject,
    opts: {
      textToSpeechFeature: TextToSpeakFeature;
      visemeState: FreeBlendState;
    }
  ) {
    super(host);

    this.#textToSpeechFeature = opts.textToSpeechFeature;
    this.#visemeState = opts.visemeState;
  }

  startListening() {
    Msg.listen('viseme', (msg) => {});
  }

  //#region TextToSpeechFeatureDependentInterface

  onPlay() {}
  onPause() {}
  onResume() {}
  onStop() {}

  //#endregion

  //#region ManagedAnimationLayerInterface

  registerLayer() {}
  registerAnimation() {}
  setLayerWt() {}
  enable() {}
  disable() {}

  //#endregion

  //#region AnimationFeatureDependentInterface

  onLayerAdded() {}
  onLayerRemoved() {}
  onLayerRenamed() {}
  onAnimationAdded() {}
  onAnimationRemoved() {}
  onAnimationRenamed() {}

  //#endregion

  //#region FeatureDependentInterface

  // Find 
  onFeatureAdded() {}
  onFeatureRemoved() {}
  discard() {}

  //#endregion

  //#region AbsractHostFeature
  EVENTS = {
    update: 'onUpdate',
  };
  SERVICES = {};
  //#endregion
}
