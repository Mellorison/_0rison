import { Entity } from '../../engine/entity.js';
import { clamp } from '../util/math.js';
import { resolveAabbVsSolids } from '../util/collision.js';

export class Player extends Entity {
  constructor({ x, y }) {
    super({ x, y, name: 'Edward (Afronaut)' });

    this.w = 26;
    this.h = 36;

    this.speed = 3.4;
    this.jumpVel = -10.0;
    this.gravity = 0.55;
    this.maxFall = 14.0;

    this.onGround = false;

    this.axisTwist = false;

    this.respawnX = x;
    this.respawnY = y;

    this.alive = true;
    this._deadTimer = 0;
  }

  get rect() {
    return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h };
  }

  setFromRect(r) {
    this.x = r.x + r.w / 2;
    this.y = r.y + r.h;
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    this._deadTimer = 0.55;
  }

  respawn() {
    this.alive = true;
    this._deadTimer = 0;
    this.vx = 0;
    this.vy = 0;
    this.x = this.respawnX;
    this.y = this.respawnY;
  }

  update(dt) {
    const input = this.scene.game.input;

    if (!this.alive) {
      this._deadTimer -= dt;
      if (this._deadTimer <= 0) {
        this.respawn();
      }
      return;
    }

    const ax = input.axisX();
    const ay = input.axisY();

    let moveX = ax;
    let moveY = 0;

    if (this.axisTwist) {
      moveX = ay;
    }

    this.vx = moveX * this.speed;

    if (input.wasPressed('Space') && this.onGround) {
      this.vy = this.jumpVel;
      this.onGround = false;
    }

    this.vy = clamp(this.vy + this.gravity, -999, this.maxFall);

    const solids = this.scene.solids;

    const r = this.rect;
    const mover = {
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
      vx: this.vx,
      vy: this.vy,
    };

    const res = resolveAabbVsSolids(mover, solids);

    this.onGround = res.onGround;
    this.vx = mover.vx;
    this.vy = mover.vy;

    this.setFromRect(mover);

    if (moveY !== 0) {
      this.y += moveY * this.speed;
    }
  }

  render(g) {
    const r = this.rect;

    g.rect(r.x, r.y, r.w, r.h, this.alive ? '#7c5cff' : 'rgba(124,92,255,0.3)');
    g.rect(r.x + r.w * 0.5 - 2, r.y + 8, 4, 4, 'rgba(255,255,255,0.9)');
  }
}
