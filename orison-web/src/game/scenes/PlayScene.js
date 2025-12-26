import { Scene } from '../../engine/scene.js';
import { aabbIntersects } from '../util/collision.js';
import { Player } from '../entities/Player.js';
import { GameOverScene } from './GameOverScene.js';

export class PlayScene extends Scene {
  constructor({ level }) {
    super({ name: level?.name ?? 'Play' });
    this.level = level;

    this.solids = level.solids;
    this.hazards = level.hazards;

    this.checkpoint = { ...level.checkpoint };
    this.twistSwitch = { ...level.twistSwitch };
    this.portal = { ...level.portal };

    this._messageTimer = 0;
    this._message = '';
  }

  begin(game) {
    super.begin(game);

    this.player = this.add(new Player({ x: this.level.spawn.x, y: this.level.spawn.y }));

    this.cameraZoom = 1.35;
    this._centerCameraOnPlayer();
  }

  _centerCameraOnPlayer() {
    this.cameraX = this.player.x;
    this.cameraY = this.player.y - 120;
  }

  _toast(msg, seconds = 2) {
    this._message = msg;
    this._messageTimer = seconds;
  }

  update(dt) {
    super.update(dt);

    if (this._messageTimer > 0) {
      this._messageTimer -= dt;
      if (this._messageTimer <= 0) this._message = '';
    }

    this._centerCameraOnPlayer();

    const input = this.game.input;

    const pRect = this.player.rect;

    if (aabbIntersects(pRect, this.checkpoint)) {
      this.player.respawnX = this.checkpoint.x + this.checkpoint.w / 2;
      this.player.respawnY = this.checkpoint.y + this.checkpoint.h;
    }

    for (const h of this.hazards) {
      if (aabbIntersects(pRect, h)) {
        this.player.kill();
        break;
      }
    }

    if (aabbIntersects(pRect, this.portal)) {
      this.game.replaceScene(new GameOverScene({ message: 'Exit found. Simulation complete.' }));
      return;
    }

    const nearSwitch = aabbIntersects(pRect, {
      x: this.twistSwitch.x - 16,
      y: this.twistSwitch.y - 16,
      w: this.twistSwitch.w + 32,
      h: this.twistSwitch.h + 32,
    });

    if (nearSwitch && input.wasPressed('KeyE')) {
      this.player.axisTwist = !this.player.axisTwist;
      this._toast(this.player.axisTwist ? 'Cartesian-Twist engaged (axes swapped)' : 'Cartesian-Twist disengaged', 2.0);
    }

    const b = this.level.bounds;
    this.cameraX = Math.max(480 / this.cameraZoom, Math.min(this.cameraX, b.w - 480 / this.cameraZoom));
    this.cameraY = Math.max(270 / this.cameraZoom, Math.min(this.cameraY, b.h - 270 / this.cameraZoom));
  }

  render(g) {
    // Screen-space atmosphere first.
    g.backgroundGradient('#111b3d', '#070a14');

    g.pushCamera(this.cameraX, this.cameraY, this.cameraZoom);
    this._renderWorld(g);
    g.popCamera();

    g.vignette(0.45);
    this._renderHud(g);
  }

  _renderWorld(g) {
    const b = this.level.bounds;

    // Subtle world fog sheet.
    g.rect(0, 0, b.w, b.h, 'rgba(255,255,255,0.02)');

    for (let x = 0; x < b.w; x += 64) {
      for (let y = 0; y < b.h; y += 64) {
        if (((x / 64) ^ (y / 64)) & 1) {
          g.rect(x, y, 64, 64, 'rgba(255,255,255,0.02)');
        }
      }
    }

    for (const s of this.solids) {
      g.shadowRect(s.x, s.y, s.w, s.h, 'rgba(255,255,255,0.12)', { blur: 16, offsetY: 10, shadowColor: 'rgba(0,0,0,0.55)' });
      g.rect(s.x + 1, s.y + 1, s.w - 2, s.h - 2, 'rgba(255,255,255,0.05)');
    }

    for (const h of this.hazards) {
      const t = this.game.time;
      const pulse = 0.55 + 0.35 * Math.sin(t * 6);
      g.glowRect(h.x, h.y, h.w, h.h, `rgba(255,70,70,${pulse})`, { glowColor: `rgba(255,70,70,${pulse})`, blur: 20 });
    }

    g.glowRect(this.checkpoint.x, this.checkpoint.y, this.checkpoint.w, this.checkpoint.h, 'rgba(60,220,140,0.72)', { glowColor: 'rgba(60,220,140,0.55)', blur: 18 });

    g.shadowRect(this.twistSwitch.x, this.twistSwitch.y, this.twistSwitch.w, this.twistSwitch.h, 'rgba(255,255,255,0.12)', { blur: 14, offsetY: 10, shadowColor: 'rgba(0,0,0,0.55)' });
    g.glowRect(this.twistSwitch.x + 6, this.twistSwitch.y + 6, this.twistSwitch.w - 12, this.twistSwitch.h - 12, 'rgba(124,92,255,0.80)', { glowColor: 'rgba(124,92,255,0.75)', blur: 16 });

    {
      const t = this.game.time;
      const pulse = 0.65 + 0.25 * Math.sin(t * 4);
      g.glowRect(this.portal.x, this.portal.y, this.portal.w, this.portal.h, `rgba(80,200,255,${pulse})`, { glowColor: `rgba(80,200,255,${pulse})`, blur: 28 });
      g.rect(this.portal.x + 6, this.portal.y + 10, this.portal.w - 12, this.portal.h - 20, 'rgba(7,10,20,0.92)');
      g.glowCircle(this.portal.x + this.portal.w / 2, this.portal.y + this.portal.h / 2, 10, `rgba(255,255,255,${pulse})`, { glowColor: `rgba(80,200,255,${pulse})`, blur: 26 });
    }

    this.player.render(g);
  }

  _renderHud(g) {
    g.pushScreen();

    g.rect(12, 12, 320, 66, 'rgba(0,0,0,0.35)');
    g.text(this.level.name, 22, 18, { size: 13, color: 'rgba(255,255,255,0.88)' });

    const twist = this.player.axisTwist ? 'ON' : 'OFF';
    g.text(`Cartesian-Twist: ${twist}`, 22, 38, { size: 13, color: this.player.axisTwist ? 'rgba(124,92,255,0.95)' : 'rgba(255,255,255,0.70)' });
    g.text('E near switch to toggle', 22, 56, { size: 12, color: 'rgba(255,255,255,0.55)' });

    if (this._message) {
      g.rect(12, 92, 420, 34, 'rgba(0,0,0,0.35)');
      g.text(this._message, 22, 101, { size: 13, color: 'rgba(255,255,255,0.85)' });
    }

    g.popScreen();
  }
}
