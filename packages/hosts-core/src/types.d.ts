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
