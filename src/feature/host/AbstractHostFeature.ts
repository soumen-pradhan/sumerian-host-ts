import HostObject from './HostObject';

export default class AbstractHostFeature {
  name: string = 'AbstractHostFeature';
  host: HostObject;

  constructor(host: HostObject) {
    this.host = host;
  }

  update(deltaMs: number): void {
    throwErr('AbstractHostFeature.update should be overridden');
  }
}
