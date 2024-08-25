import AbstractHostFeature from '../AbstractHostFeature';
import Deferred from '../Deferred';
import { getUniqueName, throwErr } from '../utils';
import AnimationLayer from './AnimationLayer';
import type { AnimationLayerOpts } from './AnimationLayer';
import SingleState, { SingleStateOpts } from './state/SingleState';

export type AnimationTypes = {
  Single: SingleStateOpts;
};

/**
 * Feature for managing animations on an object.
 */
export default class AnimationFeature<
  TOwner extends HostOwner,
> extends AbstractHostFeature<TOwner> {
  override name = AnimationFeature.name;

  #layers: AnimationLayer[] = [];
  #layerMap: Map<string, AnimationLayer> = new Map();
  #paused = false;

  get paused() {
    return this.#paused;
  }

  /** Returns an array of names of the animation layers. */
  get layers() {
    return this.#layers.map((l) => l.name);
  }

  //#region Layer manipulation

  /**
   * Create and store a new animation layer
   * @param name Name for the layer
   * @param opts Options to construct {@link AnimationLayer}
   * @param index Index to insert the new layer at. If none is provided it will be
   * added to the end of the stack. Could be negative to insert at the end.
   * @returns Name and index of the new layer.
   */
  addLayer(
    name: string,
    opts: AnimationLayerOpts = {},
    index?: number
  ): { name: string; index: number } {
    let layerIndex = index;

    // Make sure the given index is within the range of layers
    if (index === undefined || index === -1) {
      layerIndex = this.#layers.length;
    } else {
      layerIndex = this.#validateIndex(index, false);

      if (layerIndex === undefined) {
        // Insert at the beginning if the user passed in a negative index, else at the end
        layerIndex = index < 0 ? 0 : this.#layers.length;

        console.warn(
          `Index ${index} invalid for host:${this.host.id}` +
            `New layer will be added at the closest valid index ${layerIndex}`
        );
      }
    }

    // Make sure the layer name is unique
    const layerName = getUniqueName(name, [...this.#layerMap.keys()]);
    if (layerName !== name) {
      console.warn(
        `Layer name:${name} is not unique. Saving with name:${layerName}`
      );
    }

    const layer = new AnimationLayer({ ...opts, name: layerName });
    this.#layerMap.set(layerName, layer);

    this.#layers.splice(layerIndex, 0, layer);

    // Notify that a layer has been added to the feature
    this.emit(AnimationFeature.EVENTS.addLayer, {
      name: layerName,
      index: layerIndex,
    });

    return { name: layerName, index: layerIndex };
  }

  /**
   * Remove an animation layer from the stack. Animations on this layer will no
   * longer be evaluated.
   * @param name Nae for the layer to remove.
   * @returns Whether or not removal was successful.
   */
  removeLayer(name: string): boolean {
    const layer = this.#layerMap.get(name);

    if (layer === undefined) {
      console.warn(`No layer:${name} exists on host:${this.host.id}`);
      return false;
    }

    layer.discard();

    const index = this.#layers.indexOf(layer);
    this.#layers.splice(index, 1);
    this.#layerMap.delete(name);

    // Notify that a layer has been removed from the feature
    this.emit(AnimationFeature.EVENTS.removeLayer, { name, index });
    return true;
  }

  /**
   * Re-order the layer stack so that the layer with the given name is positioned
   * at the given index.
   * @returns The new index of the layer.
   * @throws If layer does not exist or layer index is out of bounds.
   */
  moveLayer(name: string, index: number): number {
    // Make sure the name is valid
    const layer = this.#layerMap.get(name);

    if (layer === undefined) {
      throwErr(`Cannot move. No layer:${name} exists on host:${this.host.id}`);
    }

    // Make sure the index falls in the range of existing layers
    const layerIndex = this.#validateIndex(index, true);
    const lastIndex = this.#layers.length - 1;

    if (layerIndex === undefined) {
      throwErr(
        `Cannot move layer ${name} from host ${this.host.id} to index ${index}. ` +
          `Index must be in 0-${lastIndex} range.`
      );
    }

    const currentIndex = this.#layers.indexOf(layer);
    if (currentIndex === layerIndex) {
      return currentIndex;
    }

    this.#layers.splice(currentIndex, 1);
    this.#layers.splice(layerIndex, 0, layer);

    return layerIndex;
  }

  /**
   *
   * @param currentName
   * @param newName
   */
  renameLayer(currentName: string, newName: string): string {
    // Make sure the name is valid
    const layer = this.#layerMap.get(currentName);

    if (layer === undefined) {
      throwErr(
        `Cannot rename. No layer:${currentName} exists on host:${this.host.id}`
      );
    }

    // Make sure the layer name is unique
    const name = getUniqueName(newName, [...this.#layerMap.keys()]);

    if (name !== newName) {
      console.warn(
        `Layer ${newName} is not unique. Layer will be renamed to ${name}`
      );
    }

    this.#layerMap.delete(currentName);
    this.#layerMap.set(newName, layer);
    layer.name = newName;

    return newName;
  }

  //#endregion

  //#region State creation

  /** Return a new instance of a SingleState. */
  _createSingleState(opts: SingleStateOpts) {
    return new SingleState(opts);
  }

  //#endregion

  //#region Animation manipulation

  /**
   * Add a new animation to an animation layer.
   * @param layerName Name of the layer to add the animation to
   * @param animName Name to use when calling the animation
   * @param opts Options for new SingleState animation
   * @returns The name of the animation that was added
   */
  addAnimation<TAnim extends keyof AnimationTypes>(
    layerName: string,
    animName: string,
    animType: TAnim,
    opts: AnimationTypes[TAnim] = {}
  ): string {
    animName = this.#validateNewAnimation(layerName, animName);

    const layer = this.#layerMap.get(layerName)!;

    const state = (() => {
      switch (animType) {
        case 'Single':
          return this._createSingleState({
            ...opts,
            name: animName,
            blendMode: layer.blendMode,
          });
        default:
          throwErr(
            `Trying to add unknown animation type ${animType} on layer ${layerName}`
          );
      }
    })();

    const name = layer.addState(state);

    this.emit(AnimationFeature.EVENTS.addAnimation, {
      layerName,
      animName: name,
    });
    return name;
  }

  /**
   * Pause the currently playing animation and play a new animation from the beginning.
   * @returns Resolves once the animation reaches the end of its timeline. Looping animations
   * will only resolve if they are interrupted or manually stopped.
   */
  playAnimation(
    layerName: string,
    animName: string,
    transitionMs?: number,
    easingFn?: EasingFn
  ): Deferred<void> {
    const layer = this.#layerMap.get(layerName);

    if (layer === undefined) {
      const def = new Deferred<void>();
      def.reject(
        `Cannot play animation ${animName} on layer ${layerName} for ` +
          `host ${this.host.id}. No such layer exists.`
      );
      return def;
    }

    // Notify that a new animation has begun
    this.emit(AnimationFeature.EVENTS.playAnimation, { layerName, animName });

    return layer.playAnimation(animName, transitionMs, easingFn, {
      onFinish: () => {
        this.emit(AnimationFeature.EVENTS.stopAnimation, {
          layerName,
          animName,
        });
      },
      onCancel: () => {
        this.emit(AnimationFeature.EVENTS.interruptAnimation, {
          layerName,
          animName,
        });
      },
      // @ts-expect-error TODO unsure how onNext is to be used
      onNext: ({ name, canAdvance, isQueueEnd }) => {
        if (layer.currentAnimation === animName) {
          // Notify that a new animation has begun
          this.emit(AnimationFeature.EVENTS.playNextAnimation, {
            layerName,
            animName,
            nextQueuedAnimation: name,
            canAdvance,
            isQueueEnd,
          });
        }
      },
    });
  }

  //#endregion

  /** Update each animation layer. */
  override update(deltaMs: number): void {
    if (this.#layers.length === 0) {
      return;
    }

    if (this.paused) {
      deltaMs = 0;
    }

    // Re-evaluate internal weights for layers
    this.#updateInternalWeights();

    // Update layers
    this.#layers.forEach((layer) => layer.update(deltaMs));

    super.update(deltaMs);
  }

  /**
   * Make sure a supplied layer index is within the range of layers.
   * @param index Index to validate, could be negative as well.
   * @param existing Whether the index represents and existing
   * layer or a new layer to be added.
   */
  #validateIndex(index: number, existing = true): number | undefined {
    // Index is invalid if there are no layers and we're checking for an existing layer index
    if (this.#layers.length === 0 && existing) {
      return undefined;
    }

    const lastIndex = existing ? this.#layers.length - 1 : this.#layers.length;

    // Count from the end of the array for negative indices
    if (index < 0) {
      index = lastIndex + index + 1;
    }

    return index < 0 || index > lastIndex ? undefined : index;
  }

  /**
   * Make sure the if layer with name exists and return a unique version of the name.
   * @throws If layer does not exit
   */
  #validateNewAnimation(layerName: string, animName: string): string {
    // Make sure the layerName is valid
    const layer = this.#layerMap.get(layerName);

    if (layer === undefined) {
      throwErr(
        `Cannot add animation to layer ${layerName} from host ${this.host.id}. ` +
          `No layer exists with this name.`
      );
    }

    // Make sure the animationName is unique
    const name = getUniqueName(animName, layer.getStateNames());

    if (name !== animName) {
      console.warn(
        `Animation name ${animName} is not unique for layer ${layerName}. ` +
          `Animation will be renamed to ${name}.`
      );
    }

    return name;
  }

  /**
   * Re-evaluate internal weight values of layers starting from the top of the
   * stack. Override layers' weights affect the values of all layers lower in the
   * stack.
   */
  #updateInternalWeights(): void {
    const numLayers = this.#layers.length;
    let weightMultiplier = 1;

    // Update internal weight values on layers in reverse order
    for (let i = numLayers - 1; i >= 0; i--) {
      const layer = this.#layers[i];
      layer.updateInternalWeight(weightMultiplier);

      // If the layer is override, update the multiplier with the remainder of the full weight
      const currentState = layer.currentState;
      if (layer.blendMode === 'Override' && currentState !== undefined) {
        weightMultiplier *= 1 - currentState.internalWeight;
      }
    }
  }

  // prettier-ignore
  static override EVENTS: typeof AbstractHostFeature.EVENTS & {
    addLayer: HostEvent<'onAddLayerEvent', { name: string; index: number }>;
    removeLayer: HostEvent<'onRemoveLayerEvent', { name: string; index: number }>;
    renameLayer: HostEvent<'onRenameLayerEvent', { oldName: string; newName: string }>;
    addAnimation: HostEvent<'onAddAnimationEvent', { layerName: string; animName: string }>;
    removeAnimation: HostEvent<'onRemovedAnimationEvent', { layerName: string; animName: string }>;
    renameAnimation: HostEvent<'onRenameAnimationEvent', { layerName: string; oldName: string; newName: string }>;
    playAnimation: HostEvent<'onPlayEvent', { layerName: string; animName: string }>;
    playNextAnimation: HostEvent<'onNextEvent', { layerName: string; animName: string; nextQueuedAnimation: string; canAdvance: boolean; isQueueEnd: boolean }>;
    pauseAnimation: HostEvent<'onPauseEvent', { layerName: string; animName: string }>;
    resumeAnimation: HostEvent<'onResumeEvent', { layerName: string; animName: string }>;
    interruptAnimation: HostEvent<'onInterruptEvent', { layerName: string; animName: string }>;
    stopAnimation: HostEvent<'onStopEvent', { layerName: string; animName: string }>;
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
