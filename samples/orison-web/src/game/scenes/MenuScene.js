import { Scene } from '../../engine/scene.js';
import { createLevel1 } from '../level/level1.js';
import { PlayScene } from './PlayScene.js';

export class MenuScene extends Scene {
  constructor() {
    super({ name: 'Menu' });
  }

  begin(game) {
    super.begin(game);
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

    g.backgroundGradient('#101a38', '#070a14');
    g.vignette(0.60);

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
