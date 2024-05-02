function throwErr(msg?: any): never {
  throw new Error(msg);
}

(window as any).throwErr = throwErr;

export {};

declare global {
  function throwErr(msg?: any): never;
}
