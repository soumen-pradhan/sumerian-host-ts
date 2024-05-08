type EventTagMap = {
  dbg: CustomEvent<any>;
  viseme: CustomEvent<VisemeName>;
};

export default class Msg {
  static target = new EventTarget();

  static emit<Tag extends keyof EventTagMap, TMsg extends EventTagMap[Tag]['detail']>(
    tag: Tag,
    msg: TMsg
  ) {
    this.target.dispatchEvent(
      new CustomEvent(tag, {
        detail: msg,
      })
    );
  }

  static listen<Tag extends keyof EventTagMap, TMsg extends EventTagMap[Tag]['detail']>(
    tag: Tag,
    listener: (msg: TMsg) => void
  ) {
    this.target.addEventListener(tag, (e) => {
      listener((e as CustomEvent).detail);
    });
  }
}
