export {};

declare global {
  type PropRequired<T, KReq extends keyof T> = Omit<T, KReq> & Required<Pick<T, KReq>>;

  type BlendMode = 'Override' | 'Additive';

  type VisemeName =
    | '@'
    | 'a'
    | 'e'
    | 'E'
    | 'f'
    | 'i'
    | 'k'
    | 'o'
    | 'O'
    | 'p'
    | 'r'
    | 's'
    | 'S'
    | 'sil'
    | 'stand_talk'
    | 'T'
    | 't'
    | 'u';

  /** From {@link @tween-js/tween/dist/tween.d.ts} */

  type EasingFunction = (amount: number) => number;
  type EasingFunctionGroup = {
    In: EasingFunction;
    Out: EasingFunction;
    InOut: EasingFunction;
  };

  type InterpolationFunction = (v: number[], k: number) => number;
}
