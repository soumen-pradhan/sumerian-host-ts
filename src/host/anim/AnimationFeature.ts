import AbstractHostFeature from '../AbstractHostFeature';
import HostObject from '../HostObject';
import AnimationLayer from './AnimationLayer';

/** Feature for managing animations on an object. */
export default class AnimationFeature<
  TOwner extends HostOwner
> extends AbstractHostFeature<TOwner> {
  #layers: AnimationLayer[] = [];
  #layerMap: Record<string, AnimationLayer> = {};
  #paused = false;

  constructor(host: HostObject<TOwner>) {
    super(host);
  }

  /** Create and store a new animation layer */
  addLayer(name: string, opts: {} = {}, index?: number) {}

  // prettier-ignore
  static override EVENTS: typeof AbstractHostFeature.EVENTS & {
    addLayer: HostEvent<'onAddLayerEvent', { name: string; index: number }>;
    removeLayer: HostEvent<'onRemoveLayerEvent', { name: string; index: number }>;
    renameLayer: HostEvent<'onRenameLayerEvent', { oldName: string; newName: string }>;
    addAnimation: HostEvent<'onAddAnimationEvent', { layerName: string; animationName: string }>;
    removeAnimation: HostEvent<'onRemovedAnimationEvent', { layerName: string; animationName: string }>;
    renameAnimation: HostEvent<'onRenameAnimationEvent', { layerName: string; oldName: string; newName: string }>;
    playAnimation: HostEvent<'onPlayEvent', { layerName: string; animationName: string }>;
    playNextAnimation: HostEvent<'onNextEvent', any>;
    pauseAnimation: HostEvent<'onPauseEvent', { layerName: string; animationName: string }>;
    resumeAnimation: HostEvent<'onResumeEvent', { layerName: string; animationName: string }>;
    interruptAnimation: HostEvent<'onInterruptEvent', { layerName: string; animationName: string }>;
    stopAnimation: HostEvent<'onStopEvent', { layerName: string; animationName: string }>;
  } = {
    ...super.EVENTS,
    addLayer: { event: 'onAddLayerEvent' },
    removeLayer: { event: 'onRemoveLayerEvent' },
    renameLayer: { event: 'onRenameLayerEvent' },
    addAnimation: { event: 'onAddAnimationEvent' },
    removeAnimation: { event: 'onRemovedAnimationEvent' },
    renameAnimation: { event: 'onRenameAnimationEvent' },
    playAnimation: { event: 'onPlayEvent' },
    playNextAnimation: { event: 'onNextEvent' },
    pauseAnimation: { event: 'onPauseEvent' },
    resumeAnimation: { event: 'onResumeEvent' },
    interruptAnimation: { event: 'onInterruptEvent' },
    stopAnimation: { event: 'onStopEvent' },
  };
}
