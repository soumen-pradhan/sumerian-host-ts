import { GLTF } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

export class ControlGui {
  #gui: GUI;
  #model: GLTF['scene'];

  constructor(name: string, model: GLTF['scene'], localGui: GUI) {
    this.#gui = localGui.addFolder(name);
    this.#gui.close();
    this.#model = model;
  }
}
