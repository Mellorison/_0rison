export class Input {
  constructor(target = window) {
    this._down = new Set();
    this._pressed = new Set();
    this._released = new Set();

    target.addEventListener('keydown', (e) => {
      const k = e.code;
      if (!this._down.has(k)) this._pressed.add(k);
      this._down.add(k);
    });

    target.addEventListener('keyup', (e) => {
      const k = e.code;
      this._down.delete(k);
      this._released.add(k);
    });

    target.addEventListener('blur', () => {
      this._down.clear();
      this._pressed.clear();
      this._released.clear();
    });
  }

  beginFrame() {
    this._pressed.clear();
    this._released.clear();
  }

  isDown(code) {
    return this._down.has(code);
  }

  wasPressed(code) {
    return this._pressed.has(code);
  }

  wasReleased(code) {
    return this._released.has(code);
  }

  axisX() {
    const left = this.isDown('ArrowLeft') || this.isDown('KeyA');
    const right = this.isDown('ArrowRight') || this.isDown('KeyD');
    return (right ? 1 : 0) - (left ? 1 : 0);
  }

  axisY() {
    const up = this.isDown('ArrowUp') || this.isDown('KeyW');
    const down = this.isDown('ArrowDown') || this.isDown('KeyS');
    return (down ? 1 : 0) - (up ? 1 : 0);
  }
}
