import * as THREE from 'three';
import Deferred from '../../utils/Deferred';
import AbstractHostFeature from './AbstractHostFeature';
import HostObject from './HostObject';
import Speech, { SpeechMark } from '../Speech';

type TextToSpeakFeatureOpts = {
  // TextToSpeechOpts
  listener: THREE.AudioListener;
  attachTo?: THREE.Object3D<THREE.Object3DEventMap>;
  // AbstractTextToSpeechOpts
  speechMarkOffsetMs?: number; // 0
};

type AbstractTextToSpeechOpts = {
  voice: string; // TODO Find valid names
  engine: string; // TODO Find valid names
  language?: string;
  audioFormat: 'mp3';
  sampleRate: number;
  speechMarkOffsetMs?: number; // 0
  minEndMarkDuration?: number; // 0.05
  volume?: number; // 1
  isGlobal?: boolean; // false
};

type SpeakConfig = {};

const AUDIO_GESTURE_WARN =
  'The audio context is not running. ' +
  'Speech will not be able to be played until it is resumed. ' +
  'Use the "TextToSpeechFeature.resumeAudio()" method ' +
  'to try to resume it after a user gesture.';

export default class TextToSpeakFeature extends AbstractHostFeature {
  engineUserAgent = `Three.js-${THREE.REVISION}`;

  #audioEnabled = false;

  #listener: THREE.AudioListener;
  #attachTo: THREE.Object3D<THREE.Object3DEventMap>;

  #speechMarkOffsetMs = 0;

  constructor(host: HostObject, opts: TextToSpeakFeatureOpts) {
    super(host);

    this.#listener = opts.listener;
    this.#attachTo = opts.attachTo ?? host.owner;

    this.#speechMarkOffsetMs = opts.speechMarkOffsetMs ?? 0;

    this.#audioContext = opts.listener.context;

    const onAudioStateChange = () => {
      this.#audioEnabled = this.#audioContext.state === 'running';
      if (!this.#audioEnabled) {
        console.warn(AUDIO_GESTURE_WARN);
        console.trace();
      }
    };
    this.#audioContext.addEventListener('statechange', onAudioStateChange);
    onAudioStateChange();
  }

  override update(deltaMs: number): void {
    if (this.#currentSpeech?.playing) {
      this.#currentSpeech?.update(this.host.nowMs);
    }
  }

  play(text: string, config: SpeakConfig = {}) {
    return this.#startSpeech(text, config, 'play');
  }

  pause() {
    if (this.#currentSpeech?.playing) {
      this.#currentSpeech.pause(this.host.nowMs);
    } else {
      console.warn(
        `Cannot pause speech on host:${this.host.owner.id}. No speech is playing.`
      );
    }
  }

  resume(text: string, config: SpeakConfig = {}) {
    return this.#startSpeech(text, config, 'resume');
  }

  stop() {
    if (this.#currentSpeech?.playing) {
      this.#currentSpeech.stop();
      this.#currentSpeech = undefined;
    } else {
      console.warn(
        `Cannot stop speech on host:${this.host.owner.id}. No speech is playing.`
      );
    }
  }

  // TODO pause, stop

  #currentSpeech?: Speech;

  #startSpeech(text: string, config: SpeakConfig, playMethod: 'play' | 'resume') {
    // TODO currentPromise why is it needed.

    this.#resumeAudio()
      .then(() => {
        // TODO Check if anything is playing right now

        // getSpeech
        if (!this.#audioEnabled) {
          throwErr(
            `Cannot ${playMethod} on host:${this.host.owner.id}. ${AUDIO_GESTURE_WARN}`
          );
        }

        if (playMethod === 'resume') {
          text = this.#currentSpeech?.text ?? text;
        }

        // TODO again currentPromise

        {
          // getSpeech(text, config)
          text = Speech.validateText(text);

          {
            // TODO updateConfig(config, text)
          }

          {
            // updateSpeech(text, config, force = false)
            // TODO add caching here later
            if (playMethod === 'resume' && this.#currentSpeech !== undefined) {
              return this.#currentSpeech;
            }

            const speechMarkPromise = fetch('visemes.json').then((r) => r.json());
            const audioPromise = Promise.resolve({ url: 'speech.mp3' })
              .then(({ url }) => {
                const audio = new Audio(url);
                audio.loop = false; // TODO What to do here.
                audio.crossOrigin = 'anonymous';
                audio.preload = 'auto';

                return { url, audio };
              })
              .then(({ url, audio }) => {
                const threeAudio = new THREE.PositionalAudio(this.#listener);
                this.#attachTo.add(threeAudio);
                threeAudio.setMediaElementSource(audio);

                return { url, audio, threeAudio };
              });

            return Promise.all([
              speechMarkPromise as Promise<SpeechMark[]>, // _synthesizeSpeechmarks
              audioPromise, // _synthesizeAudio
            ]).then(([speechMarks, audioObj]) => {
              return new Speech(text, speechMarks, audioObj.audio);
            });
          }
        }
      })
      .then((speech) => {
        // TODO Check if anyhting is playing right now

        this.#currentSpeech = speech;
        this.#currentSpeech.offsetMs = this.#speechMarkOffsetMs;

        switch (playMethod) {
          case 'play':
            this.#currentSpeech.play(this.host.nowMs);
            break;
          case 'resume':
            this.#currentSpeech.resume(this.host.nowMs);
            break;
        }
      });
  }

  #audioContext: AudioContext;

  #resumeAudio() {
    return new Deferred<void, Error>((resolve, reject) => {
      this.#audioContext
        .resume()
        .then(() => {
          this.#audioEnabled = true;
          resolve();
        })
        .catch((e) => {
          this.#audioEnabled = false;
          reject(e);
        });
    });
  }
}
