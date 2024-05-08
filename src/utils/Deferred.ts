type Status = 'resolved' | 'rejected' | 'canceled' | 'pending';

export default class Deferred<TResolve = any, TReject = Error> extends Promise<TResolve> {
  // Has to be wrapped in an object to obtain a reference
  #status: { s: Status } = { s: 'pending' };
  get resolved() {
    return this.#status.s === 'resolved';
  }
  get rejected() {
    return this.#status.s === 'rejected';
  }
  get canceled() {
    return this.#status.s === 'canceled';
  }
  get pending() {
    return this.#status.s === 'pending';
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

    const status: { s: Status } = { s: 'pending' };

    super((resolve, reject) => {
      // Store the resolver
      res = (value) => {
        if (status.s === 'pending') {
          status.s = 'resolved';
          resolve(onResolve(value));
        }
      };

      // Store the rejecter
      rej = (value) => {
        if (status.s === 'pending') {
          status.s = 'rejected';
          reject(onReject(value));
        }
      };

      // Store the canceler
      cancel = (value) => {
        if (status.s === 'pending') {
          status.s = 'canceled';
          resolve(onCancel(value));
        }
      };

      // Run the executable
      exec(res, rej, cancel);
    });

    this.#status = status;
    this.#resolve = res;
    this.#reject = rej;
    this.#cancel = cancel;
    this.#exec = exec;
  }

  static canceled<TResolve = any>(v: TResolve): Deferred<TResolve, Error> {
    return new Deferred<TResolve>((_res, _rej, cancel) => cancel(v));
  }

  static from<TResolve = any, TReject = never>(
    promise: Promise<TResolve>
  ): Deferred<TResolve, TReject> {
    return new Deferred((res, rej) => {
      promise.then((v) => res(v)).catch((e) => rej(e));
    });
  }
}
