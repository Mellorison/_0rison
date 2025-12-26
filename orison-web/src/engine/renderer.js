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

  rect(x, y, w, h, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  circle(x, y, r, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
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
