import AbstractHostFeature from '../AbstractHostFeature';
import IFeatureDependent from '../IFeatureDependent';

/**
 * Class factory interface for features that are dependent on the TextToSpeechFeature
 * being present on the host. Speech events will automatically be listened for once a
 * TextToSpeechFeature is added to the host and stopped once it is removed.
 */
export class ITextToSpeechFeatureDependent extends IFeatureDependent {
  _onPlay(event: any) {}
  _onPause(event: any) {}
  _onResume(event: any) {}
  _onStop(event: any) {}
  _onSentence(event: any) {}
  _onWord(event: any) {}
  _onViseme(event: any) {}
  _onSsml(event: any) {}

  static override Mixin<
    TOwner extends HostOwner,
    TBase extends Constructor<AbstractHostFeature<TOwner>>
  >(Base: TBase) {
    return class
      extends IFeatureDependent.Mixin(Base)
      implements ITextToSpeechFeatureDependent
    {
      _onPlay(event: any): void {
        throw new Error('Method not implemented.');
      }
      _onPause(event: any): void {
        throw new Error('Method not implemented.');
      }
      _onResume(event: any): void {
        throw new Error('Method not implemented.');
      }
      _onStop(event: any): void {
        throw new Error('Method not implemented.');
      }
      _onSentence(event: any): void {
        throw new Error('Method not implemented.');
      }
      _onWord(event: any): void {
        throw new Error('Method not implemented.');
      }
      _onViseme(event: any): void {
        throw new Error('Method not implemented.');
      }
      _onSsml(event: any): void {
        throw new Error('Method not implemented.');
      }
    };
  }
}

/**
 * Class factory interface for that registers callback method when a ssml speechmark event is emitted.
 */
export class ISSMLSpeechmark extends ITextToSpeechFeatureDependent {
  /**
   * When ssml events are caught, this will try to parse the speech mark value and
   * execute any function which meets criteria defined in the value. Speech mark
   * value will be treated as stringified json format containing required feature
   * name, function name and argument array to pass in.
   *
   * Example speech mark value might look like:
   * ```{ "feature": "GestureFeature", "method": "switchToGesture", "args": ["genricA", 0.5] }```
   */
  override _onSsml(event: { mark: string }): void {}

  static override Mixin<
    TOwner extends HostOwner,
    TBase extends Constructor<AbstractHostFeature<TOwner>>
  >(Base: TBase) {
    return class
      extends ITextToSpeechFeatureDependent.Mixin(Base)
      implements ISSMLSpeechmark
    {
      override _onSsml({ mark }: { mark: string }): void {}
    };
  }
}
