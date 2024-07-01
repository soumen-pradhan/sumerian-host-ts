export {};

declare global {
  type PropRequired<T, KReq extends keyof T> = Omit<T, KReq> & Required<Pick<T, KReq>>;

  //#region For Host and Features

  // default value of T should be {} not any
  type Constructor<T = {}> = new (...args: any[]) => T;

  type HostOwner = { id: number };

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

  //#endregion

  /** From {@link @tween-js/tween/dist/tween.d.ts} */

  type EasingFn = (amount: number) => number;
  type EasingFunctionGroup = {
    In: EasingFn;
    Out: EasingFn;
    InOut: EasingFn;
  };

  type InterpolationFn = (v: number[], k: number) => number;
}
