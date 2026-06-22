import { PlatformerScene } from './PlatformerScene';

/**
 * The Messenjah - Complete 2D platformer game manager.
 * Orchestrates the game loop, menus, pause/resume, and win screen.
 */
export class PlatformerGame {
  private canvas: HTMLCanvasElement;
  private platformer: PlatformerScene | null = null;
  private gameState: 'menu' | 'playing' | 'paused' | 'win' = 'menu';
  private menuOverlay: HTMLDivElement | null = null;
  private pauseOverlay: HTMLDivElement | null = null;
  private winOverlay: HTMLDivElement | null = null;
  private lastTime: number = 0;
  private running: boolean = false;
  private deliveredCount: number = 0;
  private collectiblesFound: number = 0;
  private quantumEnergy: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.showMenu();
  }

  private showMenu(): void {
    this.gameState = 'menu';
    if (this.menuOverlay) return;

    this.menuOverlay = document.createElement('div');
    this.menuOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a0a3e 0%, #2a1a5e 50%, #1a0a3e 100%);
      color: #00ffcc;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: Arial, sans-serif;
      text-align: center;
    `;

    this.menuOverlay.innerHTML = `
      <div style="font-size: 64px; font-weight: bold; color: #00ffcc; text-shadow: 0 0 20px #00ffcc, 0 0 40px #00ffcc; margin-bottom: 10px;">THE</div>
      <div style="font-size: 56px; font-weight: bold; color: #ff66ff; text-shadow: 0 0 20px #ff66ff, 0 0 40px #ff66ff; margin-bottom: 40px;">MESSENJAH</div>
      <div style="font-size: 18px; color: #ffd700; margin-bottom: 40px; max-width: 500px; line-height: 1.5;">
        Deliver quantum data crystals across Zambian villages in the year 2147.<br>
        Collect artifacts, upgrade your abilities, and save the quantum network!
      </div>
      <div style="font-size: 16px; color: #00ffff; margin-bottom: 30px;">
        Controls: Arrow Keys / WASD to move | Space to jump | E to interact
      </div>
      <button id="pg-start-btn" style="padding: 15px 50px; font-size: 24px; background: linear-gradient(135deg, #00ffcc, #0099aa); color: #1a0a3e; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; box-shadow: 0 0 20px rgba(0,255,204,0.5); transition: transform 0.2s; outline: none;" onfocus="this.style.outline='3px solid #ff66ff'; this.style.outlineOffset='2px';" onblur="this.style.outline='none';">
        START GAME
      </button>
    `;

    document.body.appendChild(this.menuOverlay);

    const startBtn = this.menuOverlay.querySelector('#pg-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startGame());
      startBtn.addEventListener('mouseenter', () => (startBtn as HTMLButtonElement).style.transform = 'scale(1.05)');
      startBtn.addEventListener('mouseleave', () => (startBtn as HTMLButtonElement).style.transform = 'scale(1)');
    }
  }

  private startGame(): void {
    if (this.menuOverlay) {
      this.menuOverlay.remove();
      this.menuOverlay = null;
    }
    this.gameState = 'playing';
    this.platformer = new PlatformerScene(this.canvas);
    this.setupEventListeners();

    // Wait for async RAPIER initialization to complete before starting the loop
    this.platformer.onReady(() => {
      this.handleResize();
      this.lastTime = performance.now();
      this.running = true;
      this.gameLoop();
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleResize = (): void => {
    if (this.platformer) {
      const canvas = this.canvas;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
      this.platformer.resize(canvas.width, canvas.height);
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Escape') {
      if (this.gameState === 'playing') {
        this.pauseGame();
      } else if (this.gameState === 'paused') {
        this.resumeGame();
      }
    }
  };

  private pauseGame(): void {
    if (!this.platformer || this.gameState !== 'playing') return;
    this.gameState = 'paused';
    this.showPauseOverlay();
  }

  private resumeGame(): void {
    if (this.gameState !== 'paused') return;
    this.gameState = 'playing';
    if (this.pauseOverlay) {
      this.pauseOverlay.remove();
      this.pauseOverlay = null;
    }
    this.lastTime = performance.now();
  }

  private restartGame(): void {
    this.cleanup();
    this.startGame();
  }

  private returnToMenu(): void {
    this.cleanup();
    this.showMenu();
  }

  private showPauseOverlay(): void {
    if (this.pauseOverlay) return;

    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      color: #00ffcc;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: Arial, sans-serif;
      text-align: center;
    `;

    this.pauseOverlay.innerHTML = `
      <div style="font-size: 48px; font-weight: bold; color: #00ffcc; text-shadow: 0 0 20px #00ffcc; margin-bottom: 30px;">PAUSED</div>
      <button id="pg-resume-btn" style="padding: 12px 40px; font-size: 20px; background: #00ffcc; color: #1a0a3e; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; margin-bottom: 15px; outline: none;" onfocus="this.style.outline='3px solid #ff66ff';" onblur="this.style.outline='none';">RESUME</button>
      <button id="pg-restart-btn" style="padding: 12px 40px; font-size: 20px; background: #ff66ff; color: #1a0a3e; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; margin-bottom: 15px; outline: none;" onfocus="this.style.outline='3px solid #00ffcc';" onblur="this.style.outline='none';">RESTART</button>
      <button id="pg-quit-btn" style="padding: 12px 40px; font-size: 20px; background: #444; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; outline: none;" onfocus="this.style.outline='3px solid #00ffcc';" onblur="this.style.outline='none';">QUIT TO MENU</button>
    `;

    document.body.appendChild(this.pauseOverlay);

    const resumeBtn = this.pauseOverlay.querySelector('#pg-resume-btn');
    const restartBtn = this.pauseOverlay.querySelector('#pg-restart-btn');
    const quitBtn = this.pauseOverlay.querySelector('#pg-quit-btn');

    if (resumeBtn) resumeBtn.addEventListener('click', () => this.resumeGame());
    if (restartBtn) restartBtn.addEventListener('click', () => this.restartGame());
    if (quitBtn) quitBtn.addEventListener('click', () => this.returnToMenu());
  }

  private showWinScreen(): void {
    this.gameState = 'win';
    this.running = false;

    if (this.platformer) {
      this.deliveredCount = this.platformer.getDeliveredCount();
      this.collectiblesFound = this.platformer.getCollectiblesFound();
      this.quantumEnergy = this.platformer.getQuantumEnergy();
      this.platformer.dispose();
      this.platformer = null;
    }

    if (this.winOverlay) return;

    this.winOverlay = document.createElement('div');
    this.winOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a0a3e 0%, #2a1a5e 50%, #1a0a3e 100%);
      color: #00ffcc;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: Arial, sans-serif;
      text-align: center;
    `;

    this.winOverlay.innerHTML = `
      <div style="font-size: 56px; font-weight: bold; color: #ffd700; text-shadow: 0 0 30px #ffd700; margin-bottom: 20px;">CONGRATULATIONS!</div>
      <div style="font-size: 28px; color: #fff; margin-bottom: 30px;">You have completed THE MESSENJAH</div>
      <div style="font-size: 22px; color: #aaa; margin-bottom: 15px;">Deliveries Completed: ${this.deliveredCount}/15</div>
      <div style="font-size: 22px; color: #ff66ff; margin-bottom: 15px;">Artifacts Found: ${this.collectiblesFound}/21</div>
      <div style="font-size: 22px; color: #00ffff; margin-bottom: 30px;">Total Energy: ${this.quantumEnergy}</div>
      <div style="font-size: 18px; color: #888; margin-bottom: 30px; max-width: 500px; line-height: 1.5;">
        Inspired by the Zambian Space Program<br>
        Edward Mukuka Nkoloso - Visionary<br>
        Thank you for playing!
      </div>
      <button id="pg-play-again-btn" style="padding: 15px 40px; font-size: 20px; background: #00ffcc; color: #1a0a3e; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; margin-bottom: 15px; outline: none;" onfocus="this.style.outline='3px solid #ff66ff';" onblur="this.style.outline='none';">PLAY AGAIN</button>
      <button id="pg-menu-btn" style="padding: 15px 40px; font-size: 20px; background: #444; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; outline: none;" onfocus="this.style.outline='3px solid #00ffcc';" onblur="this.style.outline='none';">MAIN MENU</button>
    `;

    document.body.appendChild(this.winOverlay);

    const playAgainBtn = this.winOverlay.querySelector('#pg-play-again-btn');
    const menuBtn = this.winOverlay.querySelector('#pg-menu-btn');

    if (playAgainBtn) playAgainBtn.addEventListener('click', () => {
      this.winOverlay?.remove();
      this.winOverlay = null;
      this.restartGame();
    });
    if (menuBtn) menuBtn.addEventListener('click', () => {
      this.winOverlay?.remove();
      this.winOverlay = null;
      this.returnToMenu();
    });
  }

  private gameLoop = (): void => {
    if (!this.running || this.gameState !== 'playing') return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.platformer) {
      this.platformer.update(deltaTime);
      this.platformer.render();

      if (this.platformer.isGameComplete()) {
        this.showWinScreen();
        return;
      }
    }

    requestAnimationFrame(this.gameLoop);
  };

  private cleanup(): void {
    this.running = false;
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('keydown', this.handleKeyDown);

    if (this.pauseOverlay) {
      this.pauseOverlay.remove();
      this.pauseOverlay = null;
    }
    if (this.winOverlay) {
      this.winOverlay.remove();
      this.winOverlay = null;
    }
    if (this.platformer) {
      this.platformer.dispose();
      this.platformer = null;
    }
  }

  dispose(): void {
    this.cleanup();
    if (this.menuOverlay) {
      this.menuOverlay.remove();
      this.menuOverlay = null;
    }
  }
}
