import { Entity } from '../../engine/entity.js';
import { clamp } from '../util/math.js';
import { resolveAabbVsSolids } from '../util/collision.js';

export class Player extends Entity {
  constructor({ x, y }) {
    super({ x, y, name: 'Edward (Afronaut)' });

    this.w = 26;
    this.h = 36;

    this.speed = 3.4;
    this.jumpVel = -12.5;
    this.gravity = 0.50;
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

    void ay;

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

    // Body
    g.rect(r.x, r.y, r.w, r.h, this.alive ? '#7c5cff' : 'rgba(124,92,255,0.3)');
    
    // Eye
    g.rect(r.x + r.w * 0.5 - 2, r.y + 8, 4, 4, 'rgba(255,255,255,0.9)');

    // Limb animation
    const isMoving = Math.abs(this.vx) > 0.1;
    const time = this.scene.game.time;
    
    // Calculate limb swing based on movement
    let armSwing = 0;
    let legSwing = 0;
    
    if (isMoving && this.onGround) {
      armSwing = Math.sin(time * 15) * 8;
      legSwing = Math.sin(time * 15) * 10;
    } else if (!this.onGround) {
      // Jumping/falling pose
      armSwing = -20;
      legSwing = 15;
    }

    // Draw arms
    const armLength = 10;
    const armWidth = 4;
    
    // Left arm
    g.save();
    g.translate(r.x + 4, r.y + 15);
    g.rotate((armSwing * Math.PI) / 180);
    g.rect(-armWidth / 2, 0, armWidth, armLength, '#5a4ab8');
    g.restore();
    
    // Right arm
    g.save();
    g.translate(r.x + r.w - 4, r.y + 15);
    g.rotate((-armSwing * Math.PI) / 180);
    g.rect(-armWidth / 2, 0, armWidth, armLength, '#5a4ab8');
    g.restore();

    // Draw legs
    const legLength = 12;
    const legWidth = 5;
    
    // Left leg
    g.save();
    g.translate(r.x + 8, r.y + r.h);
    g.rotate((legSwing * Math.PI) / 180);
    g.rect(-legWidth / 2, 0, legWidth, legLength, '#4a3aa8');
    g.restore();
    
    // Right leg
    g.save();
    g.translate(r.x + r.w - 8, r.y + r.h);
    g.rotate((-legSwing * Math.PI) / 180);
    g.rect(-legWidth / 2, 0, legWidth, legLength, '#4a3aa8');
    g.restore();
  }
}
