import { Scene } from '../../engine/scene.js';
import { MenuScene } from './MenuScene.js';

export class GameOverScene extends Scene {
  constructor({ message = 'Simulation Ended' } = {}) {
    super({ name: 'GameOver' });
    this.message = message;
  }

  update(dt) {
    const input = this.game.input;
    if (input.wasPressed('Enter')) {
      this.game.replaceScene(new MenuScene());
    }
  }

  render(g) {
    g.pushScreen();

    const cx = g.canvas.width * 0.5;
    const cy = g.canvas.height * 0.5;

    g.text('STELLATE', cx, cy - 120, { align: 'center', size: 40, color: 'rgba(255,255,255,0.92)' });
    g.text(this.message, cx, cy - 50, { align: 'center', size: 16, color: 'rgba(255,255,255,0.75)' });

    g.rect(cx - 150, cy + 20, 300, 56, 'rgba(255,255,255,0.07)');
    g.text('Press Enter for Menu', cx, cy + 37, { align: 'center', size: 16, color: 'rgba(255,255,255,0.85)' });

    g.popScreen();
  }
}
