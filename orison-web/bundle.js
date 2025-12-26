(function () {
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  class Input {
    constructor(target) {
      target = target || window;
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

  class CanvasRenderer {
    constructor(canvas) {
      const ctx = canvas.getContext('2d', { alpha: false });
      this.canvas = canvas;
      this.ctx = ctx;
      this._stack = [];

      this.clearColor = '#0b1020';

      this._cam = { x: 0, y: 0, zoom: 1 };
    }

    beginFrame() {
      const ctx = this.ctx;
      const canvas = this.canvas;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = this.clearColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    endFrame() {
    }

    backgroundGradient(top, bottom) {
      top = top || '#0b1020';
      bottom = bottom || '#070a14';

      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, top);
      grad.addColorStop(1, bottom);

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    vignette(strength) {
      strength = (strength === undefined) ? 0.55 : strength;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      const g = ctx.createRadialGradient(w * 0.5, h * 0.55, Math.min(w, h) * 0.2, w * 0.5, h * 0.55, Math.max(w, h) * 0.65);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,' + strength + ')');

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    pushCamera(x, y, zoom) {
      const ctx = this.ctx;
      this._stack.push({ x: this._cam.x, y: this._cam.y, zoom: this._cam.zoom });
      this._cam = { x: x, y: y, zoom: zoom };

      ctx.save();
      ctx.translate(this.canvas.width * 0.5, this.canvas.height * 0.5);
      ctx.scale(zoom, zoom);
      ctx.translate(-x, -y);
    }

    popCamera() {
      const ctx = this.ctx;
      ctx.restore();
      this._cam = this._stack.pop() || { x: 0, y: 0, zoom: 1 };
    }

    pushScreen() {
      const ctx = this.ctx;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    popScreen() {
      this.ctx.restore();
    }

    rect(x, y, w, h, color) {
      const ctx = this.ctx;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    }

    shadowRect(x, y, w, h, color, opts) {
      opts = opts || {};
      const shadowColor = opts.shadowColor || 'rgba(0,0,0,0.35)';
      const blur = (opts.blur === undefined) ? 14 : opts.blur;
      const offsetX = opts.offsetX || 0;
      const offsetY = (opts.offsetY === undefined) ? 10 : opts.offsetY;

      const ctx = this.ctx;
      ctx.save();
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = blur;
      ctx.shadowOffsetX = offsetX;
      ctx.shadowOffsetY = offsetY;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }

    glowRect(x, y, w, h, color, opts) {
      opts = opts || {};
      const glowColor = opts.glowColor || color;
      const blur = (opts.blur === undefined) ? 18 : opts.blur;

      const ctx = this.ctx;
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = blur;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }

    circle(x, y, r, color) {
      const ctx = this.ctx;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }

    glowCircle(x, y, r, color, opts) {
      opts = opts || {};
      const glowColor = opts.glowColor || color;
      const blur = (opts.blur === undefined) ? 18 : opts.blur;

      const ctx = this.ctx;
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = blur;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    text(str, x, y, opts) {
      opts = opts || {};
      const color = opts.color || 'white';
      const size = opts.size || 14;
      const align = opts.align || 'left';

      const ctx = this.ctx;
      ctx.fillStyle = color;
      ctx.font = size + 'px system-ui, Segoe UI, Arial';
      ctx.textAlign = align;
      ctx.textBaseline = 'top';
      ctx.fillText(str, x, y);
    }
  }

  class Entity {
    constructor(opts) {
      opts = opts || {};
      this.name = opts.name || 'Entity';
      this.x = opts.x || 0;
      this.y = opts.y || 0;
      this.vx = 0;
      this.vy = 0;
      this.visible = true;
      this.active = true;
      this.scene = null;
    }

    added(scene) {
      this.scene = scene;
    }

    removed() {
      this.scene = null;
    }

    update(dt) {
    }

    render(g) {
    }
  }

  class Scene {
    constructor(opts) {
      opts = opts || {};
      this.name = opts.name || 'Scene';
      this.game = null;

      this._entities = [];
      this._toAdd = [];
      this._toRemove = new Set();

      this.paused = false;

      this.cameraX = 0;
      this.cameraY = 0;
      this.cameraZoom = 1;
    }

    begin(game) {
      this.game = game;
    }

    end() {
      for (const e of this._entities) e.removed();
      this._entities = [];
      this._toAdd = [];
      this._toRemove.clear();
      this.game = null;
    }

    add(entity) {
      this._toAdd.push(entity);
      return entity;
    }

    remove(entity) {
      this._toRemove.add(entity);
    }

    _flushQueues() {
      if (this._toAdd.length) {
        for (const e of this._toAdd) {
          e.added(this);
          this._entities.push(e);
        }
        this._toAdd.length = 0;
      }

      if (this._toRemove.size) {
        const removeSet = this._toRemove;
        this._entities = this._entities.filter((e) => {
          if (!removeSet.has(e)) return true;
          e.removed();
          return false;
        });
        removeSet.clear();
      }
    }

    update(dt) {
      this._flushQueues();
      if (this.paused) return;

      for (const e of this._entities) {
        if (!e.active) continue;
        e.update(dt);
      }
    }

    render(renderer) {
      const g = renderer;
      g.pushCamera(this.cameraX, this.cameraY, this.cameraZoom);

      for (const e of this._entities) {
        if (!e.visible) continue;
        e.render(g);
      }

      g.popCamera();
    }
  }

  function nowMs() {
    return performance.now();
  }

  class Game {
    constructor(opts) {
      this.renderer = opts.renderer;
      this.input = opts.input;

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

        if (this.input.wasPressed('Escape')) {
          this.paused = !this.paused;
        }

        if (this.webgl && this.webgl.enabled && this.input.wasPressed('KeyG')) {
          this.webgl.exportGlb();
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

        if (this.webgl && this.webgl.enabled) {
          this.webgl.render(this);
        }

        this.renderer.endFrame();

        // Clear edge-trigger input AFTER the frame has consumed it.
        this.input.beginFrame();
        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    }

    _renderOverlay() {
      const g = this.renderer;
      g.text('Scene: ' + (this.scene ? this.scene.name : 'none'), 12, 10, { color: 'rgba(255,255,255,0.85)', size: 13 });
      g.text('Paused: ' + (this.paused ? 'yes' : 'no'), 12, 28, { color: 'rgba(255,255,255,0.85)', size: 13 });
      if (this.webgl && this.webgl.enabled) {
        g.text('3D: ON  (G to download GLB)', 12, 46, { color: 'rgba(255,255,255,0.75)', size: 13 });
      }
    }
  }

  function aabbIntersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function resolveAabbVsSolids(mover, solids) {
    let onGround = false;

    mover.x += mover.vx;
    for (const s of solids) {
      if (!aabbIntersects(mover, s)) continue;
      if (mover.vx > 0) mover.x = s.x - mover.w;
      else if (mover.vx < 0) mover.x = s.x + s.w;
      mover.vx = 0;
    }

    mover.y += mover.vy;
    for (const s of solids) {
      if (!aabbIntersects(mover, s)) continue;

      if (mover.vy > 0) {
        mover.y = s.y - mover.h;
        onGround = true;
      } else if (mover.vy < 0) {
        mover.y = s.y + s.h;
      }

      mover.vy = 0;
    }

    return { onGround: onGround };
  }

  function createLevel1() {
    const bounds = { w: 1600, h: 900 };

    const solids = [
      { x: 0, y: 820, w: bounds.w, h: 80 },

      { x: 220, y: 720, w: 240, h: 22 },
      { x: 520, y: 640, w: 200, h: 22 },
      { x: 800, y: 560, w: 220, h: 22 },

      { x: 1020, y: 740, w: 280, h: 22 },
      { x: 1280, y: 640, w: 200, h: 22 },

      { x: 340, y: 540, w: 170, h: 22 },
      { x: 140, y: 460, w: 180, h: 22 }
    ];

    const hazards = [
      { x: 650, y: 804, w: 140, h: 16 },
      { x: 1120, y: 804, w: 160, h: 16 }
    ];

    const checkpoint = { x: 980, y: 700, w: 22, h: 60 };
    const twistSwitch = { x: 420, y: 480, w: 28, h: 28 };
    const portal = { x: 1480, y: 760, w: 42, h: 60 };

    const spawn = { x: 80, y: 760 };

    return {
      name: 'Quantum Realm: Cartesian-Twist',
      bounds: bounds,
      spawn: spawn,
      solids: solids,
      hazards: hazards,
      checkpoint: checkpoint,
      twistSwitch: twistSwitch,
      portal: portal
    };
  }

  class Player extends Entity {
    constructor(opts) {
      super({ x: opts.x, y: opts.y, name: 'Edward (Afronaut)' });

      this.w = 26;
      this.h = 36;

      this.speed = 3.4;
      this.jumpVel = -12.5;
      this.gravity = 0.50;
      this.maxFall = 14.0;

      this.onGround = false;
      this.axisTwist = false;

      this.respawnX = opts.x;
      this.respawnY = opts.y;

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
      void ay;

      this.vx = moveX * this.speed;

      if (input.wasPressed('Space') && this.onGround) {
        this.vy = this.jumpVel;
        this.onGround = false;
      }

      this.vy = clamp(this.vy + this.gravity, -999, this.maxFall);

      const solids = this.scene.solids;
      const r = this.rect;
      const mover = { x: r.x, y: r.y, w: r.w, h: r.h, vx: this.vx, vy: this.vy };

      const res = resolveAabbVsSolids(mover, solids);
      this.onGround = res.onGround;
      this.vx = mover.vx;
      this.vy = mover.vy;
      this.setFromRect(mover);
    }

    render(g) {
      const r = this.rect;
      g.rect(r.x, r.y, r.w, r.h, this.alive ? '#7c5cff' : 'rgba(124,92,255,0.3)');
      g.rect(r.x + r.w * 0.5 - 2, r.y + 8, 4, 4, 'rgba(255,255,255,0.9)');
    }
  }

  class GameOverScene extends Scene {
    constructor(opts) {
      super({ name: 'GameOver' });
      this.message = (opts && opts.message) ? opts.message : 'Simulation Ended';
    }

    update(dt) {
      const input = this.game.input;
      if (input.wasPressed('Enter')) {
        this.game.replaceScene(new MenuScene());
      }
    }

    render(g) {
      g.pushScreen();

      g.backgroundGradient('#101a38', '#070a14');
      g.vignette(0.60);

      const cx = g.canvas.width * 0.5;
      const cy = g.canvas.height * 0.5;

      g.text('STELLATE', cx, cy - 120, { align: 'center', size: 40, color: 'rgba(255,255,255,0.92)' });
      g.text(this.message, cx, cy - 50, { align: 'center', size: 16, color: 'rgba(255,255,255,0.75)' });

      g.rect(cx - 150, cy + 20, 300, 56, 'rgba(255,255,255,0.07)');
      g.text('Press Enter for Menu', cx, cy + 37, { align: 'center', size: 16, color: 'rgba(255,255,255,0.85)' });

      g.popScreen();
    }
  }

  function mat4Identity() {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  function mat4Mul(a, b) {
    const out = new Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        out[c * 4 + r] =
          a[0 * 4 + r] * b[c * 4 + 0] +
          a[1 * 4 + r] * b[c * 4 + 1] +
          a[2 * 4 + r] * b[c * 4 + 2] +
          a[3 * 4 + r] * b[c * 4 + 3];
      }
    }
    return out;
  }

  function mat4Ortho(l, r, b, t, n, f) {
    const rl = 1 / (r - l);
    const tb = 1 / (t - b);
    const fn = 1 / (f - n);
    return [
      2 * rl, 0, 0, 0,
      0, 2 * tb, 0, 0,
      0, 0, -2 * fn, 0,
      -(r + l) * rl, -(t + b) * tb, -(f + n) * fn, 1
    ];
  }

  function mat4Translate(tx, ty, tz) {
    const m = mat4Identity();
    m[12] = tx;
    m[13] = ty;
    m[14] = tz;
    return m;
  }

  function mat4Scale(sx, sy, sz) {
    const m = mat4Identity();
    m[0] = sx;
    m[5] = sy;
    m[10] = sz;
    return m;
  }

  function mat4RotateY(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ];
  }

  function mat4Perspective(fovYRad, aspect, near, far) {
    const f = 1 / Math.tan(fovYRad * 0.5);
    const nf = 1 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ];
  }

  function v3Sub(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function v3Cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function v3Norm(a) {
    const d = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / d, a[1] / d, a[2] / d];
  }

  function mat4LookAt(eye, target, up) {
    const z = v3Norm(v3Sub(eye, target));
    const x = v3Norm(v3Cross(up, z));
    const y = v3Cross(z, x);
    return [
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
      -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
      -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
      1
    ];
  }

  function _pad4(n) {
    return (n + 3) & ~3;
  }

  function _u32le(v) {
    const b = new Uint8Array(4);
    const dv = new DataView(b.buffer);
    dv.setUint32(0, v, true);
    return b;
  }

  function _asciiBytes(str) {
    const out = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
    return out;
  }

  function _downloadBytes(bytes, filename, mime) {
    const blob = new Blob([bytes], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function _readUtf8(bytes) {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(bytes);
    }
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }

  function _readAccessor(gltf, accessorIndex, binU8) {
    const acc = gltf.accessors[accessorIndex];
    const view = gltf.bufferViews[acc.bufferView];
    const byteOffset = (view.byteOffset || 0) + (acc.byteOffset || 0);
    const count = acc.count;
    const type = acc.type;
    const comp = acc.componentType;
    const stride = view.byteStride || 0;

    const compsPerElem =
      type === 'SCALAR' ? 1 :
        type === 'VEC2' ? 2 :
          type === 'VEC3' ? 3 :
            type === 'VEC4' ? 4 : 1;

    // Supported component types: float32, uint16, uint32
    let bytesPerComp = 4;
    if (comp === 5123) bytesPerComp = 2;
    else if (comp === 5125) bytesPerComp = 4;
    else if (comp === 5126) bytesPerComp = 4;

    const elemSize = compsPerElem * bytesPerComp;
    const dv = new DataView(binU8.buffer, binU8.byteOffset, binU8.byteLength);

    if (!stride || stride === elemSize) {
      const start = binU8.byteOffset + byteOffset;
      const len = count * compsPerElem;
      if (comp === 5126) {
        return { kind: 'f32', data: new Float32Array(binU8.buffer, start, len), compsPerElem };
      }
      if (comp === 5123) {
        return { kind: 'u16', data: new Uint16Array(binU8.buffer, start, len), compsPerElem };
      }
      if (comp === 5125) {
        return { kind: 'u32', data: new Uint32Array(binU8.buffer, start, len), compsPerElem };
      }
    }

    // Strided (deinterleave)
    if (comp === 5126) {
      const out = new Float32Array(count * compsPerElem);
      for (let i = 0; i < count; i++) {
        const base = byteOffset + i * stride;
        for (let c = 0; c < compsPerElem; c++) {
          out[i * compsPerElem + c] = dv.getFloat32(base + c * 4, true);
        }
      }
      return { kind: 'f32', data: out, compsPerElem };
    }

    // Fallback: unsupported strided type
    return null;
  }

  function buildGlbFromMesh(vertexFloats, indexU16) {
    // vertex layout: [px,py,pz,nx,ny,nz,r,g,b]
    const vCount = Math.floor(vertexFloats.length / 9);
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < vCount; i++) {
      const x = vertexFloats[i * 9 + 0];
      const y = vertexFloats[i * 9 + 1];
      const z = vertexFloats[i * 9 + 2];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    const vertexBytes = new Uint8Array(vertexFloats.buffer, vertexFloats.byteOffset, vertexFloats.byteLength);
    const indexBytes = new Uint8Array(indexU16.buffer, indexU16.byteOffset, indexU16.byteLength);
    const vByteLen = vertexBytes.byteLength;
    const iByteOff = _pad4(vByteLen);
    const iByteLen = indexBytes.byteLength;
    const binByteLen = _pad4(iByteOff + iByteLen);

    const bin = new Uint8Array(binByteLen);
    bin.set(vertexBytes, 0);
    bin.set(indexBytes, iByteOff);

    const gltf = {
      asset: { version: '2.0', generator: 'orison-web procedural exporter' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0, name: 'StellateProtagonist' }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, indices: 3, material: 0 }] }],
      materials: [{
        name: 'AfronautSuit',
        doubleSided: true,
        pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0.0, roughnessFactor: 1.0 }
      }],
      buffers: [{ byteLength: binByteLen }],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: vByteLen, byteStride: 36, target: 34962 },
        { buffer: 0, byteOffset: iByteOff, byteLength: iByteLen, target: 34963 }
      ],
      accessors: [
        { bufferView: 0, byteOffset: 0, componentType: 5126, count: vCount, type: 'VEC3', min: [minX, minY, minZ], max: [maxX, maxY, maxZ] },
        { bufferView: 0, byteOffset: 12, componentType: 5126, count: vCount, type: 'VEC3' },
        { bufferView: 0, byteOffset: 24, componentType: 5126, count: vCount, type: 'VEC3' },
        { bufferView: 1, byteOffset: 0, componentType: 5123, count: indexU16.length, type: 'SCALAR' }
      ]
    };

    let json = JSON.stringify(gltf);
    const jsonPad = _pad4(json.length);
    if (jsonPad !== json.length) json += ' '.repeat(jsonPad - json.length);
    const jsonBytes = _asciiBytes(json);

    // GLB container
    const totalLen = 12 + 8 + jsonBytes.length + 8 + bin.length;
    const out = new Uint8Array(totalLen);
    let o = 0;
    out.set(_u32le(0x46546C67), o); o += 4; // 'glTF'
    out.set(_u32le(2), o); o += 4;
    out.set(_u32le(totalLen), o); o += 4;

    out.set(_u32le(jsonBytes.length), o); o += 4;
    out.set(_u32le(0x4E4F534A), o); o += 4; // 'JSON'
    out.set(jsonBytes, o); o += jsonBytes.length;

    out.set(_u32le(bin.length), o); o += 4;
    out.set(_u32le(0x004E4942), o); o += 4; // 'BIN\0'
    out.set(bin, o); o += bin.length;
    return out;
  }

  function pushBox(verts, inds, opts) {
    const cx = opts.cx || 0;
    const cy = opts.cy || 0;
    const cz = opts.cz || 0;
    const hx = (opts.sx || 1) * 0.5;
    const hy = (opts.sy || 1) * 0.5;
    const hz = (opts.sz || 1) * 0.5;
    const col = opts.col || [1, 1, 1];

    const base = verts.length / 9;

    function v(x, y, z, nx, ny, nz) {
      verts.push(cx + x, cy + y, cz + z, nx, ny, nz, col[0], col[1], col[2]);
    }

    // +X
    v(hx, -hy, -hz, 1, 0, 0);
    v(hx, hy, -hz, 1, 0, 0);
    v(hx, hy, hz, 1, 0, 0);
    v(hx, -hy, hz, 1, 0, 0);

    // -X
    v(-hx, -hy, hz, -1, 0, 0);
    v(-hx, hy, hz, -1, 0, 0);
    v(-hx, hy, -hz, -1, 0, 0);
    v(-hx, -hy, -hz, -1, 0, 0);

    // +Y
    v(-hx, hy, -hz, 0, 1, 0);
    v(-hx, hy, hz, 0, 1, 0);
    v(hx, hy, hz, 0, 1, 0);
    v(hx, hy, -hz, 0, 1, 0);

    // -Y
    v(-hx, -hy, hz, 0, -1, 0);
    v(-hx, -hy, -hz, 0, -1, 0);
    v(hx, -hy, -hz, 0, -1, 0);
    v(hx, -hy, hz, 0, -1, 0);

    // +Z
    v(-hx, -hy, hz, 0, 0, 1);
    v(hx, -hy, hz, 0, 0, 1);
    v(hx, hy, hz, 0, 0, 1);
    v(-hx, hy, hz, 0, 0, 1);

    // -Z
    v(hx, -hy, -hz, 0, 0, -1);
    v(-hx, -hy, -hz, 0, 0, -1);
    v(-hx, hy, -hz, 0, 0, -1);
    v(hx, hy, -hz, 0, 0, -1);

    const face = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
      [12, 13, 14, 15],
      [16, 17, 18, 19],
      [20, 21, 22, 23]
    ];

    for (const f of face) {
      inds.push(base + f[0], base + f[1], base + f[2]);
      inds.push(base + f[0], base + f[2], base + f[3]);
    }
  }

  function pushSphere(verts, inds, opts) {
    const cx = opts.cx || 0;
    const cy = opts.cy || 0;
    const cz = opts.cz || 0;
    const r = opts.r || 1;
    const seg = Math.max(6, opts.seg || 12);
    const rings = Math.max(6, opts.rings || 10);
    const col = opts.col || [1, 1, 1];

    const base = verts.length / 9;
    for (let y = 0; y <= rings; y++) {
      const v = y / rings;
      const phi = v * Math.PI;
      const sp = Math.sin(phi);
      const cp = Math.cos(phi);
      for (let x = 0; x <= seg; x++) {
        const u = x / seg;
        const th = u * Math.PI * 2;
        const st = Math.sin(th);
        const ct = Math.cos(th);
        const nx = ct * sp;
        const ny = cp;
        const nz = st * sp;
        verts.push(
          cx + nx * r,
          cy + ny * r,
          cz + nz * r,
          nx, ny, nz,
          col[0], col[1], col[2]
        );
      }
    }

    const stride = seg + 1;
    for (let y = 0; y < rings; y++) {
      for (let x = 0; x < seg; x++) {
        const i0 = base + y * stride + x;
        const i1 = base + y * stride + x + 1;
        const i2 = base + (y + 1) * stride + x;
        const i3 = base + (y + 1) * stride + x + 1;
        inds.push(i0, i2, i1);
        inds.push(i1, i2, i3);
      }
    }
  }

  class WebglOverlay {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
      this.enabled = !!this.gl;
      this._lastW = 0;
      this._lastH = 0;
      this._spin = 0;
      this._worldKey = '';
      this._worldIndexCount = 0;
      if (!this.enabled) return;
      this._init();
    }

    _compile(type, src) {
      const gl = this.gl;
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(s);
        gl.deleteShader(s);
        throw new Error(err);
      }
      return s;
    }

    _link(vs, fs) {
      const gl = this.gl;
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const err = gl.getProgramInfoLog(p);
        gl.deleteProgram(p);
        throw new Error(err);
      }
      return p;
    }

    _init() {
      const gl = this.gl;

      const vs = this._compile(gl.VERTEX_SHADER, `
        attribute vec3 aPos;
        attribute vec3 aNor;
        attribute vec3 aCol;
        uniform mat4 uMvp;
        uniform mat4 uModel;
        uniform vec3 uLightDir;
        varying vec3 vCol;
        void main(){
          vec3 n = normalize((uModel * vec4(aNor, 0.0)).xyz);
          float ndl = max(dot(n, normalize(uLightDir)), 0.0);
          float lit = 0.28 + 0.72 * ndl;
          vCol = aCol * lit;
          gl_Position = uMvp * vec4(aPos, 1.0);
        }
      `);

      const fs = this._compile(gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying vec3 vCol;
        void main(){
          gl_FragColor = vec4(vCol, 1.0);
        }
      `);

      this.prog = this._link(vs, fs);
      gl.useProgram(this.prog);

      this.aPos = gl.getAttribLocation(this.prog, 'aPos');
      this.aNor = gl.getAttribLocation(this.prog, 'aNor');
      this.aCol = gl.getAttribLocation(this.prog, 'aCol');
      this.uMvp = gl.getUniformLocation(this.prog, 'uMvp');
      this.uModel = gl.getUniformLocation(this.prog, 'uModel');
      this.uLightDir = gl.getUniformLocation(this.prog, 'uLightDir');

      const verts = [];
      const inds = [];

      // Afronaut model (local units ~ pixels)
      // Suit base
      pushBox(verts, inds, { cx: 0, cy: -18, cz: 0, sx: 20, sy: 26, sz: 10, col: [0.92, 0.79, 0.22] });
      // Suit stripes (teal-ish)
      pushBox(verts, inds, { cx: 0, cy: -10, cz: 5.8, sx: 20, sy: 2.4, sz: 0.6, col: [0.32, 0.83, 0.86] });
      pushBox(verts, inds, { cx: 0, cy: -22, cz: 5.8, sx: 20, sy: 2.4, sz: 0.6, col: [0.32, 0.83, 0.86] });
      pushBox(verts, inds, { cx: 0, cy: -34, cz: 5.8, sx: 20, sy: 2.4, sz: 0.6, col: [0.32, 0.83, 0.86] });
      // Legs
      pushBox(verts, inds, { cx: -6, cy: -40, cz: 0, sx: 7, sy: 18, sz: 8, col: [0.92, 0.79, 0.22] });
      pushBox(verts, inds, { cx: 6, cy: -40, cz: 0, sx: 7, sy: 18, sz: 8, col: [0.92, 0.79, 0.22] });
      // Boots
      pushBox(verts, inds, { cx: -6, cy: -52, cz: 1.5, sx: 8, sy: 7, sz: 12, col: [0.07, 0.07, 0.08] });
      pushBox(verts, inds, { cx: 6, cy: -52, cz: 1.5, sx: 8, sy: 7, sz: 12, col: [0.07, 0.07, 0.08] });
      // Arms
      pushBox(verts, inds, { cx: -15, cy: -20, cz: 0, sx: 6, sy: 22, sz: 7, col: [0.92, 0.79, 0.22] });
      pushBox(verts, inds, { cx: 15, cy: -20, cz: 0, sx: 6, sy: 22, sz: 7, col: [0.92, 0.79, 0.22] });
      // Gloves
      pushBox(verts, inds, { cx: -15, cy: -33, cz: 1.0, sx: 6.5, sy: 6, sz: 9, col: [0.07, 0.07, 0.08] });
      pushBox(verts, inds, { cx: 15, cy: -33, cz: 1.0, sx: 6.5, sy: 6, sz: 9, col: [0.07, 0.07, 0.08] });
      // Helmet (glossy black)
      pushSphere(verts, inds, { cx: 0, cy: 2, cz: 0, r: 11, seg: 14, rings: 12, col: [0.06, 0.06, 0.07] });
      // Helmet ring
      pushBox(verts, inds, { cx: 0, cy: -8, cz: 0, sx: 16, sy: 2.2, sz: 16, col: [0.75, 0.56, 0.20] });

      this._meshVertexFloats = new Float32Array(verts);
      this._meshIndexU16 = new Uint16Array(inds);

      this.indexCount = inds.length;
      this.vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, this._meshVertexFloats, gl.STATIC_DRAW);

      this.ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._meshIndexU16, gl.STATIC_DRAW);

      const stride = 9 * 4;
      gl.enableVertexAttribArray(this.aPos);
      gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(this.aNor);
      gl.vertexAttribPointer(this.aNor, 3, gl.FLOAT, false, stride, 3 * 4);
      gl.enableVertexAttribArray(this.aCol);
      gl.vertexAttribPointer(this.aCol, 3, gl.FLOAT, false, stride, 6 * 4);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      this._extLoaded = false;
    }

    loadGlb(arrayBuffer) {
      if (!this.enabled) return;
      const gl = this.gl;
      try {
        const u8 = new Uint8Array(arrayBuffer);
        const dv = new DataView(arrayBuffer);
        const magic = dv.getUint32(0, true);
        if (magic !== 0x46546C67) throw new Error('Not a GLB (bad magic)');
        const version = dv.getUint32(4, true);
        if (version !== 2) throw new Error('Unsupported GLB version: ' + version);

        let off = 12;
        const jsonLen = dv.getUint32(off, true); off += 4;
        const jsonType = dv.getUint32(off, true); off += 4;
        if (jsonType !== 0x4E4F534A) throw new Error('Missing JSON chunk');
        const jsonStr = _readUtf8(u8.subarray(off, off + jsonLen));
        off += jsonLen;

        const binLen = dv.getUint32(off, true); off += 4;
        const binType = dv.getUint32(off, true); off += 4;
        if (binType !== 0x004E4942) throw new Error('Missing BIN chunk');
        const bin = u8.subarray(off, off + binLen);

        const gltf = JSON.parse(jsonStr);
        if (!gltf.meshes || !gltf.meshes.length) throw new Error('No meshes in glb');
        const mesh = gltf.meshes[0];
        if (!mesh.primitives || !mesh.primitives.length) throw new Error('No primitives in mesh');
        const prim = mesh.primitives[0];
        if (!prim.attributes || prim.attributes.POSITION == null) throw new Error('Primitive has no POSITION');

        const posAcc = _readAccessor(gltf, prim.attributes.POSITION, bin);
        if (!posAcc || posAcc.kind !== 'f32' || posAcc.compsPerElem !== 3) throw new Error('Unsupported POSITION accessor');

        const norAcc = prim.attributes.NORMAL != null ? _readAccessor(gltf, prim.attributes.NORMAL, bin) : null;
        const colAcc = prim.attributes.COLOR_0 != null ? _readAccessor(gltf, prim.attributes.COLOR_0, bin) : null;
        const idxAcc = prim.indices != null ? _readAccessor(gltf, prim.indices, bin) : null;

        const vCount = posAcc.data.length / 3;
        const outVerts = new Float32Array(vCount * 9);
        for (let i = 0; i < vCount; i++) {
          const px = posAcc.data[i * 3 + 0];
          const py = posAcc.data[i * 3 + 1];
          const pz = posAcc.data[i * 3 + 2];

          let nx = 0, ny = 0, nz = 1;
          if (norAcc && norAcc.kind === 'f32' && norAcc.compsPerElem >= 3) {
            nx = norAcc.data[i * norAcc.compsPerElem + 0];
            ny = norAcc.data[i * norAcc.compsPerElem + 1];
            nz = norAcc.data[i * norAcc.compsPerElem + 2];
          }

          let r = 0.9, g = 0.9, b = 0.95;
          if (colAcc && colAcc.kind === 'f32') {
            const c0 = colAcc.data[i * colAcc.compsPerElem + 0];
            const c1 = colAcc.data[i * colAcc.compsPerElem + 1];
            const c2 = colAcc.data[i * colAcc.compsPerElem + 2];
            r = c0; g = c1; b = c2;
          }

          const o = i * 9;
          outVerts[o + 0] = px;
          outVerts[o + 1] = py;
          outVerts[o + 2] = pz;
          outVerts[o + 3] = nx;
          outVerts[o + 4] = ny;
          outVerts[o + 5] = nz;
          outVerts[o + 6] = r;
          outVerts[o + 7] = g;
          outVerts[o + 8] = b;
        }

        let outIdx = null;
        if (idxAcc) {
          if (idxAcc.kind === 'u16') outIdx = new Uint16Array(idxAcc.data);
          else if (idxAcc.kind === 'u32') {
            // If indices exceed 65535, this won't render with UNSIGNED_SHORT. For now, downcast if safe.
            let max = 0;
            for (let i = 0; i < idxAcc.data.length; i++) if (idxAcc.data[i] > max) max = idxAcc.data[i];
            if (max > 65535) throw new Error('Index buffer requires UNSIGNED_INT (not supported in WebGL1 in this demo).');
            outIdx = new Uint16Array(idxAcc.data.length);
            for (let i = 0; i < idxAcc.data.length; i++) outIdx[i] = idxAcc.data[i];
          }
        } else {
          outIdx = new Uint16Array(vCount);
          for (let i = 0; i < vCount; i++) outIdx[i] = i;
        }

        if (!this._extVbo) this._extVbo = gl.createBuffer();
        if (!this._extIbo) this._extIbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._extVbo);
        gl.bufferData(gl.ARRAY_BUFFER, outVerts, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._extIbo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, outIdx, gl.STATIC_DRAW);

        this._extIndexCount = outIdx.length;
        this._extLoaded = true;
      } catch (e) {
        this._extLoaded = false;
        console.error('GLB load failed:', e);
      }
    }

    _buildWorldMesh(scene) {
      const gl = this.gl;
      const level = scene.level;
      if (!level) return;

      const key = level.name + ':' + level.solids.length + ':' + level.hazards.length;
      if (key === this._worldKey) return;
      this._worldKey = key;

      const verts = [];
      const inds = [];

      const depth = 90;
      const dz = depth * 0.5;

      // Solids
      for (const s of level.solids) {
        pushBox(verts, inds, {
          cx: s.x + s.w * 0.5,
          cy: s.y + s.h * 0.5,
          cz: 0,
          sx: s.w,
          sy: s.h,
          sz: depth,
          col: [0.18, 0.20, 0.26]
        });
        // top highlight
        pushBox(verts, inds, {
          cx: s.x + s.w * 0.5,
          cy: s.y + 2,
          cz: dz - 6,
          sx: s.w,
          sy: 4,
          sz: 12,
          col: [0.24, 0.28, 0.40]
        });
      }

      // Hazards
      for (const h of level.hazards) {
        pushBox(verts, inds, {
          cx: h.x + h.w * 0.5,
          cy: h.y + h.h * 0.5,
          cz: 0,
          sx: h.w,
          sy: h.h,
          sz: depth,
          col: [0.75, 0.18, 0.18]
        });
      }

      // Checkpoint
      pushBox(verts, inds, {
        cx: level.checkpoint.x + level.checkpoint.w * 0.5,
        cy: level.checkpoint.y + level.checkpoint.h * 0.5,
        cz: 0,
        sx: level.checkpoint.w,
        sy: level.checkpoint.h,
        sz: depth,
        col: [0.20, 0.75, 0.46]
      });

      // Twist switch
      pushBox(verts, inds, {
        cx: level.twistSwitch.x + level.twistSwitch.w * 0.5,
        cy: level.twistSwitch.y + level.twistSwitch.h * 0.5,
        cz: 0,
        sx: level.twistSwitch.w,
        sy: level.twistSwitch.h,
        sz: depth,
        col: [0.50, 0.36, 0.92]
      });

      // Portal
      pushBox(verts, inds, {
        cx: level.portal.x + level.portal.w * 0.5,
        cy: level.portal.y + level.portal.h * 0.5,
        cz: 0,
        sx: level.portal.w,
        sy: level.portal.h,
        sz: depth,
        col: [0.28, 0.66, 0.92]
      });

      const v = new Float32Array(verts);
      const i = new Uint16Array(inds);

      if (!this._worldVbo) this._worldVbo = gl.createBuffer();
      if (!this._worldIbo) this._worldIbo = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, this._worldVbo);
      gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._worldIbo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, i, gl.STATIC_DRAW);

      this._worldIndexCount = i.length;
    }

    exportGlb() {
      if (!this.enabled || !this._meshVertexFloats || !this._meshIndexU16) return;
      const glb = buildGlbFromMesh(this._meshVertexFloats, this._meshIndexU16);
      _downloadBytes(glb, 'stellate_protagonist.glb', 'model/gltf-binary');
    }

    _resizeToMatch() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const cssW = Math.floor(this.canvas.clientWidth || this.canvas.width);
      const cssH = Math.floor(this.canvas.clientHeight || this.canvas.height);
      const w = Math.floor(cssW * dpr);
      const h = Math.floor(cssH * dpr);
      if (w !== this._lastW || h !== this._lastH) {
        this._lastW = w;
        this._lastH = h;
        this.canvas.width = w;
        this.canvas.height = h;
      }
    }

    render(game) {
      if (!this.enabled) return;
      const gl = this.gl;
      this._resizeToMatch();
      const w = this.canvas.width;
      const h = this.canvas.height;
      if (w <= 0 || h <= 0) return;

      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const scene = game.scene;
      if (!scene || !scene.player) return;

      const zoom = scene.cameraZoom || 1;
      const camX = scene.cameraX || 0;
      const camY = scene.cameraY || 0;
      const p = scene.player;

      const threeDTimer = scene._threeDTimer || 0;

      // 3D perspective mode (temporary 5 seconds): render a simple 3D world view for orientation.
      if (threeDTimer > 0) {
        if (!this._extLoaded) {
          this._buildWorldMesh(scene);
        }

        const aspect = w / Math.max(1, h);
        const proj = mat4Perspective(55 * Math.PI / 180, aspect, 1, 5000);

        // Camera in world space, y axis points down (up vector is -Y).
        const eye = [camX + 520, camY - 420, 980];
        const target = [camX + 120, camY + 40, 0];
        const up = [0, -1, 0];
        const view = mat4LookAt(eye, target, up);

        // World draw
        gl.useProgram(this.prog);
        gl.uniform3f(this.uLightDir, -0.4, -0.8, 0.9);

        // Bind world geometry
        if (!this._extLoaded && this._worldVbo && this._worldIbo && this._worldIndexCount > 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, this._worldVbo);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._worldIbo);
          const stride = 9 * 4;
          gl.enableVertexAttribArray(this.aPos);
          gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, stride, 0);
          gl.enableVertexAttribArray(this.aNor);
          gl.vertexAttribPointer(this.aNor, 3, gl.FLOAT, false, stride, 3 * 4);
          gl.enableVertexAttribArray(this.aCol);
          gl.vertexAttribPointer(this.aCol, 3, gl.FLOAT, false, stride, 6 * 4);

          const modelWorld = mat4Identity();
          const mvpWorld = mat4Mul(proj, mat4Mul(view, modelWorld));
          gl.uniformMatrix4fv(this.uMvp, false, new Float32Array(mvpWorld));
          gl.uniformMatrix4fv(this.uModel, false, new Float32Array(modelWorld));
          gl.drawElements(gl.TRIANGLES, this._worldIndexCount, gl.UNSIGNED_SHORT, 0);
        }

        // Optional external environment mesh (loaded from GLB)
        if (this._extLoaded && this._extVbo && this._extIbo && this._extIndexCount > 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, this._extVbo);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._extIbo);
          const strideE = 9 * 4;
          gl.enableVertexAttribArray(this.aPos);
          gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, strideE, 0);
          gl.enableVertexAttribArray(this.aNor);
          gl.vertexAttribPointer(this.aNor, 3, gl.FLOAT, false, strideE, 3 * 4);
          gl.enableVertexAttribArray(this.aCol);
          gl.vertexAttribPointer(this.aCol, 3, gl.FLOAT, false, strideE, 6 * 4);

          const modelExt = mat4Identity();
          const mvpExt = mat4Mul(proj, mat4Mul(view, modelExt));
          gl.uniformMatrix4fv(this.uMvp, false, new Float32Array(mvpExt));
          gl.uniformMatrix4fv(this.uModel, false, new Float32Array(modelExt));
          gl.drawElements(gl.TRIANGLES, this._extIndexCount, gl.UNSIGNED_SHORT, 0);
        }

        // Draw the protagonist model in world space
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        const stride2 = 9 * 4;
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, stride2, 0);
        gl.enableVertexAttribArray(this.aNor);
        gl.vertexAttribPointer(this.aNor, 3, gl.FLOAT, false, stride2, 3 * 4);
        gl.enableVertexAttribArray(this.aCol);
        gl.vertexAttribPointer(this.aCol, 3, gl.FLOAT, false, stride2, 6 * 4);

        this._spin += 0.02;
        const modelP = mat4Mul(
          mat4Translate(p.x, p.y, 0),
          mat4Mul(mat4RotateY(this._spin), mat4Scale(1.15, 1.15, 1.15))
        );
        const mvpP = mat4Mul(proj, mat4Mul(view, modelP));
        gl.uniformMatrix4fv(this.uMvp, false, new Float32Array(mvpP));
        gl.uniformMatrix4fv(this.uModel, false, new Float32Array(modelP));
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
        return;
      }

      // 2D->screen mapping (matches CanvasRenderer pushCamera)
      const screenX = (p.x - camX) * zoom + (w * 0.5);
      const screenY = (p.y - camY) * zoom + (h * 0.5);

      // Ortho projection in screen space (y down)
      const proj = mat4Ortho(0, w, h, 0, -200, 200);
      const view = mat4Identity();

      // Slight idle spin for 3D readability
      this._spin += 0.02;
      const model = mat4Mul(
        mat4Translate(screenX, screenY, 0),
        mat4Mul(mat4RotateY(this._spin), mat4Scale(zoom * 1.1, zoom * 1.1, zoom * 1.1))
      );
      const mvp = mat4Mul(proj, mat4Mul(view, model));

      gl.useProgram(this.prog);
      gl.uniformMatrix4fv(this.uMvp, false, new Float32Array(mvp));
      gl.uniformMatrix4fv(this.uModel, false, new Float32Array(model));
      gl.uniform3f(this.uLightDir, -0.4, -0.8, 0.9);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }
  }

  class PlayScene extends Scene {
    constructor(opts) {
      const level = opts.level;
      super({ name: level && level.name ? level.name : 'Play' });
      this.level = level;

      this.solids = level.solids;
      this.hazards = level.hazards;

      this.checkpoint = { x: level.checkpoint.x, y: level.checkpoint.y, w: level.checkpoint.w, h: level.checkpoint.h };
      this.twistSwitch = { x: level.twistSwitch.x, y: level.twistSwitch.y, w: level.twistSwitch.w, h: level.twistSwitch.h };
      this.portal = { x: level.portal.x, y: level.portal.y, w: level.portal.w, h: level.portal.h };

      this._messageTimer = 0;
      this._message = '';

      this._threeDTimer = 0;
    }

    begin(game) {
      Scene.prototype.begin.call(this, game);
      this.player = this.add(new Player({ x: this.level.spawn.x, y: this.level.spawn.y }));
      this.cameraZoom = 1.35;
      this._centerCameraOnPlayer();
    }

    _centerCameraOnPlayer() {
      this.cameraX = this.player.x;
      this.cameraY = this.player.y - 120;
    }

    _toast(msg, seconds) {
      this._message = msg;
      this._messageTimer = seconds || 2;
    }

    update(dt) {
      Scene.prototype.update.call(this, dt);

      if (this._messageTimer > 0) {
        this._messageTimer -= dt;
        if (this._messageTimer <= 0) this._message = '';
      }

      if (this._threeDTimer > 0) {
        this._threeDTimer -= dt;
        if (this._threeDTimer < 0) this._threeDTimer = 0;
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
        h: this.twistSwitch.h + 32
      });

      if (nearSwitch && input.wasPressed('KeyE')) {
        // Cartesian-Twist in this web MVP is a temporary 3D perspective shift (not an axis-swap).
        this.player.axisTwist = false;
        this._threeDTimer = 5.0;
        this._toast('3D perspective enabled (5 seconds)', 2);
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
        g.glowRect(h.x, h.y, h.w, h.h, 'rgba(255,70,70,' + pulse + ')', { glowColor: 'rgba(255,70,70,' + pulse + ')', blur: 20 });
      }

      g.glowRect(this.checkpoint.x, this.checkpoint.y, this.checkpoint.w, this.checkpoint.h, 'rgba(60,220,140,0.72)', { glowColor: 'rgba(60,220,140,0.55)', blur: 18 });

      g.shadowRect(this.twistSwitch.x, this.twistSwitch.y, this.twistSwitch.w, this.twistSwitch.h, 'rgba(255,255,255,0.12)', { blur: 14, offsetY: 10, shadowColor: 'rgba(0,0,0,0.55)' });
      g.glowRect(this.twistSwitch.x + 6, this.twistSwitch.y + 6, this.twistSwitch.w - 12, this.twistSwitch.h - 12, 'rgba(124,92,255,0.80)', { glowColor: 'rgba(124,92,255,0.75)', blur: 16 });

      {
        const t = this.game.time;
        const pulse = 0.65 + 0.25 * Math.sin(t * 4);
        g.glowRect(this.portal.x, this.portal.y, this.portal.w, this.portal.h, 'rgba(80,200,255,' + pulse + ')', { glowColor: 'rgba(80,200,255,' + pulse + ')', blur: 28 });
        g.rect(this.portal.x + 6, this.portal.y + 10, this.portal.w - 12, this.portal.h - 20, 'rgba(7,10,20,0.92)');
        g.glowCircle(this.portal.x + this.portal.w / 2, this.portal.y + this.portal.h / 2, 10, 'rgba(255,255,255,' + pulse + ')', { glowColor: 'rgba(80,200,255,' + pulse + ')', blur: 26 });
      }

      this.player.render(g);
    }

    _renderHud(g) {
      g.pushScreen();

      g.rect(12, 12, 320, 66, 'rgba(0,0,0,0.35)');
      g.text(this.level.name, 22, 18, { size: 13, color: 'rgba(255,255,255,0.88)' });

      const twist = this.player.axisTwist ? 'ON' : 'OFF';
      g.text('Cartesian-Twist: ' + twist, 22, 38, { size: 13, color: this.player.axisTwist ? 'rgba(124,92,255,0.95)' : 'rgba(255,255,255,0.70)' });
      g.text('E near switch to toggle', 22, 56, { size: 12, color: 'rgba(255,255,255,0.55)' });

      if (this._threeDTimer > 0) {
        const s = this._threeDTimer.toFixed(1);
        g.rect(12, 180, 250, 28, 'rgba(0,0,0,0.35)');
        g.text('3D View: ' + s + 's', 22, 188, { size: 13, color: 'rgba(255,255,255,0.85)' });
      }

      {
        const input = this.game.input;
        const pRect = this.player.rect;
        const nearSwitch = aabbIntersects(pRect, {
          x: this.twistSwitch.x - 16,
          y: this.twistSwitch.y - 16,
          w: this.twistSwitch.w + 32,
          h: this.twistSwitch.h + 32
        });

        if (nearSwitch) {
          g.rect(12, 136, 420, 34, 'rgba(0,0,0,0.35)');
          g.text('Twist switch in range — press E', 22, 145, { size: 13, color: 'rgba(255,255,255,0.92)' });
          g.text('KeyE detected this frame: ' + (input.wasPressed('KeyE') ? 'YES' : 'no'), 22, 163, { size: 12, color: input.wasPressed('KeyE') ? 'rgba(60,220,140,0.95)' : 'rgba(255,255,255,0.55)' });
        } else {
          const dx = Math.round(this.twistSwitch.x - this.player.x);
          const dy = Math.round(this.twistSwitch.y - this.player.y);
          g.rect(12, 136, 420, 34, 'rgba(0,0,0,0.35)');
          g.text('Twist switch direction (dx,dy): ' + dx + ', ' + dy, 22, 145, { size: 13, color: 'rgba(255,255,255,0.72)' });
          g.text('Look for the small glowing purple square', 22, 163, { size: 12, color: 'rgba(255,255,255,0.55)' });
        }
      }

      if (this._message) {
        g.rect(12, 92, 420, 34, 'rgba(0,0,0,0.35)');
        g.text(this._message, 22, 101, { size: 13, color: 'rgba(255,255,255,0.85)' });
      }

      g.popScreen();
    }
  }

  class MenuScene extends Scene {
    constructor() {
      super({ name: 'Menu' });
    }

    begin(game) {
      Scene.prototype.begin.call(this, game);
      this.cameraX = 480;
      this.cameraY = 270;
      this.cameraZoom = 1;
    }

    update(dt) {
      const input = this.game.input;
      if (input.wasPressed('Enter')) {
        this.game.replaceScene(new PlayScene({ level: createLevel1() }));
      }
    }

    render(g) {
      g.pushScreen();

      const cx = g.canvas.width * 0.5;
      const cy = g.canvas.height * 0.5;

      g.text('STELLATE', cx, cy - 120, { align: 'center', size: 44, color: 'rgba(255,255,255,0.92)' });
      g.text('Sci-Fi Puzzle Platformer (MVP)', cx, cy - 65, { align: 'center', size: 16, color: 'rgba(255,255,255,0.72)' });

      g.shadowRect(cx - 150, cy - 5, 300, 56, 'rgba(255,255,255,0.07)', { blur: 18, offsetY: 14, shadowColor: 'rgba(0,0,0,0.45)' });
      g.text('Press Enter to Start', cx, cy + 12, { align: 'center', size: 16, color: 'rgba(255,255,255,0.85)' });

      g.text('Controls', cx, cy + 90, { align: 'center', size: 14, color: 'rgba(255,255,255,0.85)' });
      g.text('Move: WASD / Arrow Keys', cx, cy + 115, { align: 'center', size: 13, color: 'rgba(255,255,255,0.70)' });
      g.text('Jump: Space', cx, cy + 135, { align: 'center', size: 13, color: 'rgba(255,255,255,0.70)' });
      g.text('Interact: E (near switch)', cx, cy + 155, { align: 'center', size: 13, color: 'rgba(255,255,255,0.70)' });
      g.text('Pause: Esc', cx, cy + 175, { align: 'center', size: 13, color: 'rgba(255,255,255,0.70)' });

      g.popScreen();
    }
  }

  function boot() {
    const canvas = document.getElementById('game');
    if (!canvas) return;

    const webglCanvas = document.getElementById('webgl');

    const renderer = new CanvasRenderer(canvas);
    const input = new Input(window);
    const game = new Game({ renderer: renderer, input: input });

    if (webglCanvas) {
      game.webgl = new WebglOverlay(webglCanvas);
    }

    const loadBtn = document.getElementById('loadGlb');
    const glbInput = document.getElementById('glbFile');
    if (loadBtn && glbInput) {
      loadBtn.addEventListener('click', () => glbInput.click());
      glbInput.addEventListener('change', async () => {
        const f = glbInput.files && glbInput.files[0];
        if (!f) return;
        if (!game.webgl || !game.webgl.enabled) return;
        const buf = await f.arrayBuffer();
        game.webgl.loadGlb(buf);
        glbInput.value = '';
      });
    }

    game.replaceScene(new MenuScene());
    game.start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
