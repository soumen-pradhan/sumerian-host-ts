import Msg from '../utils/Msg';

export type SpeechMark = { time: number } & (
  | { type: 'sentence' | 'word'; start: number; end: number; value: string }
  | { type: 'viseme'; value: VisemeName }
);

export default class Speech {
  text: string;

  #startMs = 0;
  #localMs = 0;
  offsetMs = 0;
  #endMs = 0;
  #pauseMs = 0;

  #speechMarks: SpeechMark[];
  #currMark?: SpeechMark;
  #currMarkIndex = -1;

  #incrMark() {
    this.#currMarkIndex++;
    this.#currMark =
      this.#currMarkIndex >= this.#speechMarks.length
        ? undefined
        : this.#speechMarks[this.#currMarkIndex];
    return this.#currMark;
  }

  #audio: HTMLMediaElement;
  #audioEnded = true;

  #playing = false;
  get playing() {
    return this.#playing;
  }

  constructor(text: string, speechMarks: SpeechMark[], audio: HTMLMediaElement) {
    if (speechMarks.length < 1) {
      throwErr('SpeechMark array is empty');
    }

    this.text = text;
    this.#speechMarks = speechMarks;

    this.#audio = audio;
    this.#audio.addEventListener('ended', () => {
      this.#audioEnded = true;
    });

    this.#reset();
  }

  #reset(currentTimeMs = 0) {
    this.#startMs = currentTimeMs;
    this.#localMs = 0;
    this.#endMs = this.#speechMarks[this.#speechMarks.length - 1].time;
    this.#pauseMs = 0;

    this.#currMarkIndex = 0;
    this.#currMark = this.#speechMarks[this.#currMarkIndex];

    this.#playing = false;
  }

  get #checkEnded() {
    return (
      this.#audioEnded && this.#currMark === undefined && this.#localMs >= this.#endMs
    );
  }
  play(currentTimeMs: number) {
    this.#audio.currentTime = 0;
    this.#reset(currentTimeMs);

    this.#audio.play().then(() => {
      Msg.emit('viseme', this.#currMark?.value as VisemeName);
      this.#incrMark();
      this.#playing = true;
      this.#audioEnded = false;
    });
  }

  pause(currentTimeMs: number) {
    this.#playing = false;
    this.#pauseMs = currentTimeMs;

    this.#audio.pause();
  }

  resume(currentTimeMs: number) {
    // TODO Check if playing from beginning

    this.#audio.play().then(() => {
      this.#audioEnded = false;

      this.#playing = true;
      this.#startMs += currentTimeMs - this.#pauseMs;
    });
  }

  stop() {
    this.#playing = false;
    this.#audio.pause();
    this.#audio.currentTime = 0;
  }

  update(currentTimeMs: number) {
    if (!this.#playing) {
      return;
    }

    this.#localMs = currentTimeMs - this.#startMs;

    if (this.#currMark !== undefined) {
      while (
        this.#currMark !== undefined &&
        this.#currMark.time + this.offsetMs <= this.#localMs
      ) {
        Msg.emit('viseme', this.#currMark.value as VisemeName);
        this.#incrMark();
      }
    }

    if (this.#checkEnded) {
      // TODO Stop the audio promise ?? Is it required, would it not stop by itself
      this.stop();
      this.#reset();
    }
  }

  static validateText(text: string): string {
    return text
      .replace(/(^\s*<\s*speak\s*)>\s*|(^\s*)/, '<speak>')
      .replace(/(\s*<\s*\/\s*speak\s*>\s*$|\s*$)/, '</speak>');
  }
}
