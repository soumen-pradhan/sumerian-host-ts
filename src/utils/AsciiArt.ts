export default class AsciiUtils {
  static #grayscaleRamp =
    '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`\'.';
  static #asciiToGray: Record<string, number> = {};

  static {
    for (let i = 0; i < this.#grayscaleRamp.length; i++) {
      this.#asciiToGray[this.#grayscaleRamp[i]] = Math.round(
        (i * 255) / (this.#grayscaleRamp.length - 1)
      );
    }
  }

  /**
   * Get ascii character corresponding to the grayscale pixel.
   * @param gray will be clamped to range `0..255` (inclusive)
   */
  static getChar(gray: number): string {
    gray = Math.max(Math.min(gray, 255), 0);

    const idx = Math.ceil(((this.#grayscaleRamp.length - 1) * gray) / 255);
    return this.#grayscaleRamp[idx];
  }

  /**
   * Get the gray value for a character.
   * @param char the string that represents the pixel
   * @param defaultVal for any unknown char not in the grayScaleRamp
   */
  static getGray(char: string, defaultVal = 0): number {
    return this.#asciiToGray[char] ?? defaultVal;
  }
}

// ASCII Art
{
  // const asciiArt = ``;
  // const asciiStrs = asciiArt.split('\n');
  // const maxLength = asciiStrs.reduce((acc, x) => Math.max(acc, x.length), 0);
  // for (let i = 0; i < asciiStrs.length; i++) {
  //   asciiStrs[i] = asciiStrs[i].padEnd(maxLength, ' ');
  // }
  // const asciiArt2 = asciiStrs.join('');
  // const width = maxLength;
  // const height = asciiStrs.length;
  // const size = width * height;
  // const data = new Uint8Array(4 * size);
  // for (let i = 0; i < size; i++) {
  //   const stride = i * 4;
  //   const color = AsciiUtils.getGray(asciiArt2[i]);
  //   data[stride] = color;
  //   data[stride + 1] = color;
  //   data[stride + 2] = color;
  //   data[stride + 3] = 255;
  // }
  // // used the buffer to create a DataTexture
  // const texture = new THREE.DataTexture(data, width, height);
  // texture.format = THREE.RGBAFormat;
  // texture.flipY = true;
  // texture.magFilter = THREE.LinearFilter;
  // texture.minFilter = THREE.LinearFilter;
  // texture.needsUpdate = true;
  // const box = new THREE.Mesh(
  //   new THREE.BoxGeometry(1, 1, 1),
  //   new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide })
  // );
  // box.name = 'box0';
  // box.position.set(0, 1, -2);
  // scene.add(box);
  // gui(box).pos();
}
