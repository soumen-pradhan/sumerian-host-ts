import Deferred from '../../Deferred';
import Utils from '../../utils';

export type AbstractStateOpts = {
  name?: string;
  weight?: number;
};

/**
 * Base class for a state in our animation system.
 */
export default class AbstractState {
  name: string;
  #weight: number;
  #internalWeight: number;
  _paused = false;

  _promises: {
    finish: Deferred<void>;
    weight: Deferred<void>;
    play: Deferred<void>;
  };

  _playCallbacks: {
    onFinish?: () => void;
    onError?: () => void;
    onCancel?: () => void;
  } = {};

  constructor({
    name = AbstractState.name,
    weight = 0,
  }: AbstractStateOpts = {}) {
    this.name = name;
    this.#weight = Utils.Math.clamp(weight);
    this.#internalWeight = this.#weight;

    this._promises = {
      finish: Deferred.resolved(),
      weight: Deferred.resolved(),
      play: Deferred.resolved(),
    };
  }

  /** Gets whether or not the state is currently paused. */
  get paused() {
    return this._paused;
  }

  get weight() {
    return this.#weight;
  }

  protected set weight(wt) {
    this.#weight = wt;
  }

  /** Updates the user defined weight over time. */
  setWeight(weight: number, ms = 0, easingFn?: EasingFn) {
    weight = Utils.Math.clamp(weight);
    this._promises.weight.cancel();

    if (ms <= 0) {
      this.#weight = weight;
    } else {
      this._promises.weight = Utils.Anim.interpolate(this, 'weight', weight, {
        ms,
        easingFn,
      }) as unknown as Deferred<void>;
    }

    return this._promises.weight;
  }

  /** Whether or not the weight is currently being animated. */
  get weightPending() {
    return this._promises.weight.pending;
  }

  get internalWeight() {
    return this.#internalWeight;
  }

  /** Multiplies the user weight by a factor to determine the internal weight. */
  updateInternalWeight(factor: number) {
    this.#internalWeight = this.#weight * Utils.Math.clamp(factor);
  }

  /** Update any values that need to be evaluated every frame. */
  update(deltaMs: number) {
    if (!this.paused) {
      Object.values(this._promises).forEach((promise) =>
        promise.execute(deltaMs)
      );
    }
  }

  /** Start playback of the state from the beginning. */
  play(
    on: {
      onFinish?: () => void;
      onError?: () => void;
      onCancel?: () => void;
    } = {}
  ) {
    this._paused = false;

    this._playCallbacks.onFinish = on.onFinish;
    this._playCallbacks.onError = on.onError;
    this._playCallbacks.onCancel = on.onCancel;

    this._promises.play = new Deferred(undefined, {
      onResolve: on.onFinish,
      onReject: on.onError,
      onCancel: on.onCancel,
    });

    this._promises.finish = Deferred.all([
      this._promises.play,
      this._promises.weight,
    ]) as unknown as Deferred<void>;

    return this._promises.finish;
  }

  /** Pause playback of the state. This prevents pending promises from being executed. */
  pause(): boolean {
    this._paused = true;
    return true;
  }

  /** Resume playback of the state. */
  resume(
    on: {
      onFinish?: () => void;
      onError?: () => void;
      onCancel?: () => void;
    } = {}
  ) {
    this._paused = false;

    if (!this._promises.play.pending) {
      this._playCallbacks.onFinish =
        on.onFinish ?? this._playCallbacks.onFinish;
      this._playCallbacks.onError = on.onError ?? this._playCallbacks.onError;
      this._playCallbacks.onCancel =
        on.onCancel ?? this._playCallbacks.onCancel;

      this._promises.play = new Deferred(undefined, {
        onResolve: this._playCallbacks.onFinish,
        onReject: this._playCallbacks.onError,
        onCancel: this._playCallbacks.onCancel,
      });

      this._promises.finish = Deferred.all([
        this._promises.play,
        this._promises.weight,
      ]) as unknown as Deferred<void>;
    }

    return this._promises.finish;
  }

  /** Cancel playback of the state and cancel any pending promises. */
  cancel(): boolean {
    this._paused = true;

    this._promises.finish.cancel();
    this._promises.weight.cancel();
    this._promises.play.cancel();

    return true;
  }

  /** Stop playback of the state and resolve any pending promises. */
  stop(): boolean {
    this._paused = true;

    this._promises.finish.resolve();
    this._promises.weight.resolve();
    this._promises.play.resolve();

    return true;
  }

  /** Cancel any pending promises and remove reference to them. */
  discard() {
    this.cancel();

    // delete this.#promises;
  }

  /**
   * Force the internal weight to 0. Should be called before switching or transitioning
   * to a new state.
   */
  deactivate() {
    this.updateInternalWeight(0);
  }
}
