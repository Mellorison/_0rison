import { Game } from './engine/game.js';
import { Scene } from './engine/scene.js';
import { Entity } from './engine/entity.js';
import { Input } from './engine/input.js';
import { CanvasRenderer } from './engine/renderer.js';

class Player extends Entity {
  constructor(opts) {
    super({ ...opts, name: 'Player' });
    this.w = 26;
    this.h = 26;
    this.speed = 220;
    this.dashSpeed = 520;
    this.dashTimer = 0;
  }

  update(dt) {
    const input = this.scene.game.input;

    const ax = input.axisX();
    const ay = input.axisY();

    const wantDash = input.wasPressed('Space');
    if (wantDash) {
      this.dashTimer = 0.10;
    }

    const spd = this.dashTimer > 0 ? this.dashSpeed : this.speed;
    this.dashTimer = Math.max(0, this.dashTimer - dt);

    this.x += ax * spd * dt;
    this.y += ay * spd * dt;

    this.x = Math.max(0, Math.min(this.x, 900));
    this.y = Math.max(0, Math.min(this.y, 500));

    this.scene.cameraX = this.x;
    this.scene.cameraY = this.y;
  }

  render(g) {
    g.rect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h, '#7c5cff');
    g.rect(this.x - 2, this.y - 2, 4, 4, 'rgba(255,255,255,0.9)');
  }
}

class DemoScene extends Scene {
  constructor() {
    super({ name: 'DemoScene' });
  }

  begin(game) {
    super.begin(game);

    this.cameraX = 480;
    this.cameraY = 270;
    this.cameraZoom = 1.25;

    this.player = this.add(new Player({ x: 480, y: 270 }));

    for (let i = 0; i < 40; i++) {
      const e = this.add(new Entity({ x: Math.random() * 960, y: Math.random() * 540, name: 'Dot' }));
      e.render = (g) => g.circle(e.x, e.y, 2, 'rgba(255,255,255,0.25)');
    }
  }

  render(g) {
    super.render(g);

    g.text('Move: WASD / Arrow Keys', this.cameraX - 210, this.cameraY - 220, { color: 'rgba(255,255,255,0.75)', size: 14 });
    g.text('Dash: Space', this.cameraX - 210, this.cameraY - 200, { color: 'rgba(255,255,255,0.75)', size: 14 });
    g.text('Pause: Esc', this.cameraX - 210, this.cameraY - 180, { color: 'rgba(255,255,255,0.75)', size: 14 });
  }
}

const canvas = document.getElementById('game');
const renderer = new CanvasRenderer(canvas);
const input = new Input(window);

const game = new Game({ renderer, input });

game.replaceScene(new DemoScene());

game.start();
