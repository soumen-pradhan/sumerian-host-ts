import Deferred from '../Deferred';
import Utils from '../utils';
import IAnimationPlayer from './state/IAnimationPlayer';
import IStateContainer from './state/IStateContainer';

export type BlendMode = 'Override' | 'Additive';

export type AnimationLayerOpts = {
  name?: string;
  blendMode?: BlendMode;
  weight?: number;
};

/**
 * Class for managing a set of animations where only one state can be active at
 * any given time.
 */
export default class AnimationLayer extends IAnimationPlayer.Mixin(
  IStateContainer.Mixin()
) {
  name: string;
  #blendMode: BlendMode;

  #weight: number;
  #internalWeight: number;
  #weightPaused = false;

  #promises: { weight: Deferred<void> };

  constructor(opts: AnimationLayerOpts = {}) {
    super();
    this.IAnimationPlayerInit();

    this.name = opts.name ?? AnimationLayer.name;
    this.#blendMode = opts.blendMode ?? 'Override';

    this.#weight = opts.weight ?? 1;
    this.#internalWeight = this.#weight;

    this.#promises = { weight: Deferred.resolved() };
  }

  get blendMode() {
    return this.#blendMode;
  }
  get weight() {
    return this.#weight;
  }
  set weight(w: number) {
    this.#weight = w;
  }
  get weightPending() {
    return this.#promises.weight.pending;
  }

  /**
   * Pause the current animation state and any interpolation happening on the layer's
   * weight property.
   */
  pause() {
    this.paused = true;
    this.#weightPaused = true;

    return this.pauseAnimation() || this.weightPending;
  }

  /**
   * Resume the current animation state and any interpolation happening on the layer's
   * weight property.
   */
  resume() {
    this.paused = false;
    this.#weightPaused = false;

    const isWeightActive = this.weightPending;

    if (this.currentState) {
      return this.resumeAnimation() || isWeightActive;
    } else {
      return isWeightActive;
    }
  }

  /**
   * Updates the user defined weight over time.
   */
  setWeight(weight: number, ms = 0, easingFn?: EasingFn) {
    if (this.weightPending) {
      this.#promises.weight.cancel();
    }

    weight = Utils.Math.clamp(weight);

    this.#promises.weight = Utils.Anim.interpolate(this, 'weight', weight, {
      ms,
      easingFn: easingFn ?? this.easingFn,
    }) as unknown as Deferred<void>;

    return this.#promises.weight;
  }

  /**
   * Pause any interpolation happening on the layer's weight property.
   */
  pauseWeight() {
    this.#weightPaused = true;

    return this.weightPending;
  }

  /**
   * Resume any interpolation happening on the layer's weight property.
   */
  resumeWeight() {
    this.#weightPaused = false;

    return this.weightPending;
  }

  /**
   * Multiplies the user weight by a factor to determine the internal weight.
   *
   * @param factor - 0-1 multiplier to apply to the user weight.
   */
  updateInternalWeight(factor: number) {
    this.#internalWeight = this.#weight * factor;
    this.currentState?.updateInternalWeight(this.#internalWeight);
  }

  protected override get internalWeight(): number {
    return this.#internalWeight;
  }

  override update(deltaMs: number): void {
    super.update(deltaMs);

    if (!this.paused && !this.#weightPaused) {
      this.#promises.weight.execute(deltaMs);
    }
  }

  /**
   * Cancel any pending promises and discard states controlled by the layer.
   */
  override discard() {
    super.discard();
    this.discardStates();

    this.#promises.weight.cancel();
    // delete this._promises;
  }
}
