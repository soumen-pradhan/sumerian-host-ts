import * as THREE from 'three';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

export default class ControlGui {
  #gui: GUI;
  #model: THREE.Object3D;

  constructor(name: string, model: THREE.Object3D, localGui: GUI) {
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

  wireframe(show = true) {
    const param = { wireframe: show };

    function showWireframe(model: THREE.Object3D, show: boolean) {
      model.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;

        let mat = (child as THREE.Mesh).material;
        if (!Array.isArray(mat)) mat = [mat];

        for (const m of mat) (m as THREE.MeshBasicMaterial).wireframe = show;
      });
    }

    showWireframe(this.#model, show);

    this.#gui
      .add(param, 'wireframe')
      .onChange((v) => showWireframe(this.#model, v));
  }
}
