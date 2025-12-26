export class Scene {
  constructor({ name = 'Scene' } = {}) {
    this.name = name;
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
