export {};

declare global {
  type PropRequired<T, KReq extends keyof T> = Omit<T, KReq> & Required<Pick<T, KReq>>;

  type BlendMode = 'Override' | 'Additive';

  /** From {@link @tween-js/tween/dist/tween.d.ts} */

  type EasingFunction = (amount: number) => number;
  type EasingFunctionGroup = {
    In: EasingFunction;
    Out: EasingFunction;
    InOut: EasingFunction;
  };

  type InterpolationFunction = (v: number[], k: number) => number;
}
