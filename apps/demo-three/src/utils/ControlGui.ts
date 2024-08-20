import { Object3D } from 'three';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

export default class ControlGui {
  #gui: GUI;
  #model: Object3D;

  constructor(name: string, model: Object3D, localGui: GUI) {
    this.#gui = localGui.addFolder(name);
    this.#gui.close();
    this.#model = model;
  }

  pos() {
    this.#gui.add(this.#model.position, 'x');
    this.#gui.add(this.#model.position, 'y');
    this.#gui.add(this.#model.position, 'z');
    return this;
  }

  visible(show = true) {
    this.#model.visible = show;
    this.#gui.add(this.#model, 'visible');
    return this;
  }
}
