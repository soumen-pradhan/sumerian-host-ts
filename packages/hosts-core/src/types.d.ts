/** Make the given keys optional */
type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// default value of T should be {} not any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * All events should confirm to this type, so that functions can
 * infer the parameter value type.
 * The `value` on the event is just a dummy, to store the type info.
 * For example, an event may be, so corresponding emit and listenTo
 * ```
 * const ev = { event: "onEvent" as const, value: 0 }
 * emit(ev, 55)
 * listenTo(ev, num => {})
 * ```
 */
type HostEvent<T, R> = { event: T; value?: R };

type HostOwner = { id: number | string };

/** From {@link @tween-js/tween/dist/tween.d.ts} */

type EasingFn = (amount: number) => number;
type EasingFunctionGroup = {
  In: EasingFn;
  Out: EasingFn;
  InOut: EasingFn;
};

type InterpolationFn = (v: number[], k: number) => number;

type GestureConfig = Record<
  string,
  {
    queueOptions: {
      name: string;
      from: number;
      to: number;
      loopCount?: number;
    }[];
  }
>;

type PoiConfig = {
  name: string;
  maxSpeed: number;
  reference: string;
  forwardAxis: string;
  hasSaccade: boolean;
  animation: string;
  blendStateOptions: {
    clip: string;
    name: string;
  }[];
  blendThresholds: [number, number][];
}[];

type PoiConfigInMem = {
  name: string;
  maxSpeed: number;
  reference: object;
  forwardAxis: string;
  hasSaccade: boolean;
  animation: string;
  blendStateOptions: {
    clip: object;
    name: string;
  }[];
  blendThresholds: [number, number][];
}[];
