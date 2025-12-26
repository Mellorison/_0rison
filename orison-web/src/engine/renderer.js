export class CanvasRenderer {
  constructor(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    this.canvas = canvas;
    this.ctx = ctx;
    this._stack = [];

    this.clearColor = '#0b1020';

    this._cam = { x: 0, y: 0, zoom: 1 };
  }

  beginFrame() {
    const { ctx, canvas } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.clearColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  endFrame() {
  }

  backgroundGradient(top = '#0b1020', bottom = '#070a14') {
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

  vignette(strength = 0.55) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const g = ctx.createRadialGradient(w * 0.5, h * 0.55, Math.min(w, h) * 0.2, w * 0.5, h * 0.55, Math.max(w, h) * 0.65);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${strength})`);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  pushCamera(x, y, zoom) {
    const ctx = this.ctx;
    this._stack.push({ ...this._cam });
    this._cam = { x, y, zoom };

    ctx.save();
    ctx.translate(this.canvas.width * 0.5, this.canvas.height * 0.5);
    ctx.scale(zoom, zoom);
    ctx.translate(-x, -y);
  }

  popCamera() {
    const ctx = this.ctx;
    ctx.restore();
    this._cam = this._stack.pop() ?? { x: 0, y: 0, zoom: 1 };
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

  shadowRect(x, y, w, h, color, { shadowColor = 'rgba(0,0,0,0.35)', blur = 14, offsetX = 0, offsetY = 10 } = {}) {
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

  glowRect(x, y, w, h, color, { glowColor = color, blur = 18 } = {}) {
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

  glowCircle(x, y, r, color, { glowColor = color, blur = 18 } = {}) {
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

  text(str, x, y, { color = 'white', size = 14, align = 'left' } = {}) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.font = `${size}px system-ui, Segoe UI, Arial`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillText(str, x, y);
  }
}
