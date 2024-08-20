type State = 'pending' | 'resolved' | 'rejected' | 'cancelled';

/**
 * A Promise object that can be resolved, rejected or canceled at any time by the
 * user.
 */
export default class Deferred<TReturn> extends Promise<TReturn> {
  #status: { s: State } = { s: 'pending' };

  #res?: (value: TReturn | PromiseLike<TReturn>) => void;
  #rej?: (reason?: unknown) => void;
  #cancel?: (value: TReturn | PromiseLike<TReturn>) => void;
  #exec: (
    res?: (value: TReturn | PromiseLike<TReturn>) => void,
    rej?: (reason?: unknown) => void,
    cancel?: (value: TReturn | PromiseLike<TReturn>) => void,
    ...args: unknown[]
  ) => void;

  constructor(
    exec: (
      res?: (value: TReturn | PromiseLike<TReturn>) => void,
      rej?: (reason?: unknown) => void,
      cancel?: (value: TReturn | PromiseLike<TReturn>) => void,
      ...args: unknown[]
    ) => void = () => {},
    on: {
      onResolve?: (
        value: TReturn | PromiseLike<TReturn>
      ) => TReturn | PromiseLike<TReturn>;
      onReject?: (reason: unknown) => unknown;
      onCancel?: (
        value: TReturn | PromiseLike<TReturn>
      ) => TReturn | PromiseLike<TReturn>;
    } = {}
  ) {
    // These variables to avoid using this before a super call
    const status: { s: State } = { s: 'pending' };

    let res: Parameters<typeof exec>[0];
    let rej: Parameters<typeof exec>[1];
    let cancel: Parameters<typeof exec>[2];

    super((resolve, reject) => {
      // Store the resolver
      res = (value) => {
        if (status.s === 'pending') {
          status.s = 'resolved';

          if (on.onResolve) {
            value = on.onResolve(value);
          }

          resolve(value);
        }
      };

      // Store the rejecter
      rej = (value) => {
        if (status.s === 'pending') {
          status.s = 'rejected';

          if (on.onReject) {
            value = on.onReject(value);
          }

          reject(value);
        }
      };

      // Store the canceller
      cancel = (value) => {
        if (status.s === 'pending') {
          status.s = 'cancelled';

          if (on.onCancel) {
            value = on.onCancel(value);
          }

          resolve(value);
        }
      };

      // Run the executable with custom resolver and rejecter
      exec(res, rej, cancel);
    });

    this.#status = status;

    this.#res = res;
    this.#rej = rej;
    this.#cancel = cancel;
    this.#exec = exec;
  }

  get resolved(): boolean {
    return this.#status.s === 'resolved';
  }
  get rejected(): boolean {
    return this.#status.s === 'rejected';
  }
  get cancelled(): boolean {
    return this.#status.s === 'cancelled';
  }
  get pending(): boolean {
    return this.#status.s === 'pending';
  }

  resolve(value: TReturn): void {
    this.#res?.(value);
  }
  reject(reason?: unknown): void {
    this.#rej?.(reason);
  }
  cancel(value: TReturn): void {
    this.#cancel?.(value);
  }

  /** Run the promise function to try to resolve the promise. Promise must be pending. */
  execute(...args: unknown[]) {
    if (this.pending) {
      this.#exec(this.#res, this.#rej, this.#cancel, ...args);
    }
  }

  static resolved<T>(value?: T | PromiseLike<T>): Deferred<T> {
    return new Deferred<T>((res) => res?.(value as T));
  }

  static rejected<T = never>(reason?: unknown): Deferred<T> {
    return new Deferred<T>((_res, rej) => rej?.(reason));
  }

  static cancelled<T>(value: T): Deferred<T> {
    return new Deferred<T>((_res, _rej, cancel) => cancel?.(value));
  }

  static override all<T extends readonly unknown[] | []>(
    iterable: T,
    on: {
      onResolve?: (v: any) => any;
      onReject?: (v: any) => any;
      onCancel?: (v: any) => any;
    } = {}
  ): Deferred<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
    if (
      iterable === undefined ||
      iterable === null ||
      typeof iterable[Symbol.iterator] !== 'function'
    ) {
      let e = `Cannot execute Deferred.all. First argument must be iterable.`;
      e = on.onReject?.(e) ?? e;

      return Deferred.rejected(e);
    }

    const array = [...iterable];
    const deferred = array.filter((it) => it instanceof Deferred);

    const result = new Deferred(() => {}, {
      onResolve: (v) => {
        deferred.forEach((it) => it.resolve(v));
        deferred.length = 0;

        return on.onResolve?.(v) ?? v;
      },
      onReject: (r) => {
        deferred.forEach((it) => it.reject(r));
        deferred.length = 0;

        return on.onReject?.(r) ?? r;
      },
      onCancel: (v) => {
        deferred.forEach((it) => it.cancel(v));
        deferred.length = 0;

        return on.onCancel?.(v) ?? v;
      },
    });

    const numItems = array.length;
    const itemTracker: {
      failed: boolean;
      numResolved: number;
      resolutions: any[];
    } = {
      failed: false,
      numResolved: 0,
      resolutions: [],
    };

    array.forEach((item, idx) => {
      if (itemTracker.failed) {
        return;
      }

      if (!(item instanceof Promise)) {
        itemTracker.resolutions[idx] = item;
        itemTracker.numResolved += 1;

        if (itemTracker.numResolved === numItems) {
          result.resolve(itemTracker.resolutions);
        }

        return;
      }

      item.then(
        (value) => {
          if (
            !itemTracker.failed &&
            (!(item instanceof Deferred) || !item.cancelled)
          ) {
            itemTracker.resolutions[idx] = value;
            itemTracker.numResolved += 1;

            if (itemTracker.numResolved === numItems) {
              result.resolve(itemTracker.resolutions);
            }
          } else if (!itemTracker.failed) {
            itemTracker.failed = true;
            result.cancel(value);
          }
        },
        (error) => {
          if (!itemTracker.failed) {
            itemTracker.failed = true;
            result.reject(error);
          }
        }
      );
    });

    // @ts-expect-error The type of the result cannot be inferred from code alone
    return result;
  }
}
