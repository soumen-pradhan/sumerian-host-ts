export default class Deferred<TResolve = any, TReject = never> extends Promise<TResolve> {
  #status: 'resolved' | 'rejected' | 'canceled' | 'pending' = 'pending';
  get resolved() {
    return this.#status === 'resolved';
  }
  get rejected() {
    return this.#status === 'rejected';
  }
  get canceled() {
    return this.#status === 'canceled';
  }
  get pending() {
    return this.#status === 'pending';
  }

  #resolve: (v: TResolve) => void;
  resolve(v: TResolve) {
    return this.#resolve(v);
  }

  #reject: (v: TReject) => void;
  reject(v: TReject) {
    return this.#reject(v);
  }

  #cancel: (v: TResolve) => void;
  cancel(v: TResolve) {
    return this.#cancel(v);
  }

  #exec: (
    res: (v: TResolve) => void,
    rej: (v: TReject) => void,
    cancel: (v: TResolve) => void
  ) => void;
  exec() {
    if (this.pending) {
      this.#exec(this.#resolve, this.#reject, this.#cancel);
    }
  }

  constructor(
    exec: (
      res: (v: TResolve) => void,
      rej: (v: TReject) => void,
      cancel: (v: TResolve) => void
    ) => void,
    onResolve: (v: TResolve) => TResolve = (v) => v,
    onReject: (v: TReject) => TReject = (v) => v,
    onCancel: (v: TResolve) => TResolve = onResolve
  ) {
    // local variables required since class fields cannot be set before super call
    let res: (v: TResolve) => void = (_v) => {};
    let rej: (v: TReject) => void = (_v) => {};
    let cancel: (v: TResolve) => void = (_v) => {};

    super((resolve, reject) => {
      // Store the resolver
      res = (value) => {
        if (this.pending) {
          this.#status = 'resolved';
          resolve(onResolve(value));
        }
      };

      // Store the rejecter
      rej = (value) => {
        if (this.pending) {
          this.#status = 'rejected';
          reject(onReject(value));
        }
      };

      // Store the canceler
      cancel = (value) => {
        if (this.pending) {
          this.#status = 'canceled';
          resolve(onCancel(value));
        }
      };

      // Run the executable
      exec(res, rej, cancel);
    });

    this.#resolve = res;
    this.#reject = rej;
    this.#cancel = cancel;
    this.#exec = exec;
  }

  static canceled<TResolve = any>(v: TResolve): Deferred<TResolve, never> {
    return new Deferred<TResolve>((_res, _rej, cancel) => cancel(v));
  }
}
