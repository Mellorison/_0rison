import { clamp, nowMs } from './time.js';

export class Game {
  constructor({ renderer, input }) {
    this.renderer = renderer;
    this.input = input;

    this.targetFps = 60;
    this.fixedTimestep = true;

    this._accumMs = 0;
    this._lastMs = nowMs();

    this.sceneStack = [];

    this.time = 0;
    this.frames = 0;

    this.paused = false;
    this.running = false;
  }

  get scene() {
    return this.sceneStack.length ? this.sceneStack[this.sceneStack.length - 1] : null;
  }

  pushScene(scene) {
    this.sceneStack.push(scene);
    scene.begin(this);
    return scene;
  }

  popScene() {
    const s = this.sceneStack.pop();
    if (s) s.end();
    return s;
  }

  replaceScene(scene) {
    while (this.sceneStack.length) this.popScene();
    return this.pushScene(scene);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._lastMs = nowMs();

    const tick = () => {
      if (!this.running) return;

      const t = nowMs();
      let deltaMs = t - this._lastMs;
      this._lastMs = t;

      deltaMs = clamp(deltaMs, 0, 100);

      this.input.beginFrame();

      if (this.input.wasPressed('Escape')) {
        this.paused = !this.paused;
      }

      this.renderer.beginFrame();

      if (this.fixedTimestep) {
        const stepMs = 1000 / this.targetFps;
        this._accumMs += deltaMs;

        while (this._accumMs >= stepMs) {
          if (!this.paused && this.scene) {
            this.scene.update(stepMs / 1000);
          }
          this.time += stepMs / 1000;
          this.frames++;
          this._accumMs -= stepMs;
        }

        if (this.scene) {
          this.scene.render(this.renderer);
        }
      } else {
        const dt = deltaMs / 1000;
        if (!this.paused && this.scene) {
          this.scene.update(dt);
        }
        if (this.scene) {
          this.scene.render(this.renderer);
        }
        this.time += dt;
        this.frames++;
      }

      this._renderOverlay();

      this.renderer.endFrame();
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
  }

  _renderOverlay() {
    const g = this.renderer;
    g.text(`Scene: ${this.scene?.name ?? 'none'}`, 12, 10, { color: 'rgba(255,255,255,0.85)', size: 13 });
    g.text(`Paused: ${this.paused ? 'yes' : 'no'}`, 12, 28, { color: 'rgba(255,255,255,0.85)', size: 13 });
  }
}
