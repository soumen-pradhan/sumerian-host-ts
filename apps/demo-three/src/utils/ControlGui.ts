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

  rot() {
    this.#gui.add(this.#model.rotation, 'x').name('euler.x');
    this.#gui.add(this.#model.rotation, 'y').name('euler.y');
    this.#gui.add(this.#model.rotation, 'z').name('euler.z');
    return this;
  }

  scale() {
    this.#gui
      .add(this.#model.scale, 'x')
      .name('scale')
      .onChange((x) => this.#model.scale.set(x, x, x));
    return this;
  }

  scaleInd() {
    this.#gui.add(this.#model.scale, 'x').name('scale.x');
    this.#gui.add(this.#model.scale, 'y').name('scale.y');
    this.#gui.add(this.#model.scale, 'z').name('scale.z');
    return this;
  }

  visible(show = true) {
    this.#model.visible = show;
    this.#gui.add(this.#model, 'visible');
    return this;
  }
}
