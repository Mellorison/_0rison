export class Entity {
  constructor({ x = 0, y = 0, name = 'Entity' } = {}) {
    this.name = name;
    this.x = x;
    this.y = y;
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
