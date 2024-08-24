import Deferred from '../../Deferred';
import { AnimUtils } from '../../utils';
import type { BlendMode } from '../AnimationLayer';
import type { AbstractStateOpts } from './AbstractState';
import AbstractState from './AbstractState';

export type SingleStateOpts = AbstractStateOpts & {
  timeScale?: number;
  loopCount?: number;
  blendMode?: BlendMode;
};

/** Class for playing a single animation clip. */
export default class SingleState extends AbstractState {
  #timeScale: number;
  loopCount: number;
  #blendMode: BlendMode;

  declare _promises: (typeof AbstractState)['prototype']['_promises'] & {
    timeScale: Deferred<void>;
  };

  constructor(opts: SingleStateOpts = {}) {
    super({ ...opts, name: opts.name ?? SingleState.name });

    this.#timeScale = opts.timeScale ?? 1;
    this.loopCount = opts.loopCount ?? Infinity;
    this.#blendMode = opts.blendMode ?? 'Override';
    this._promises.timeScale = Deferred.resolved();

    // this._promises = { timeScale: Deferred.resolved() };
  }

  /** Gets and sets the normalized playing time of the current animation */
  get normalizedTime() {
    return 0;
  }

  get timeScale() {
    return this.#timeScale;
  }

  private set timeScale(time: number) {
    this.#timeScale = time;
  }

  /** Gets whether or not the timeScale is currently being animated. */
  get timeScalePending() {
    return this._promises.timeScale.pending;
  }

  /** Updates the timeScale value over time. */
  setTimeScale(timeScale: number, ms: number = 0, easingFn?: EasingFn) {
    this._promises.timeScale.cancel();

    if (ms <= 0) {
      this.#timeScale = timeScale;
    } else {
      this._promises.timeScale = AnimUtils.interpolate(
        this,
        'timeScale',
        timeScale,
        {
          ms,
          easingFn,
        }
      ) as unknown as Deferred<void>;
    }

    return this._promises.timeScale;
  }

  /** Gets the type of blending used for the animation. */
  get blendMode() {
    return this.#blendMode;
  }
}
