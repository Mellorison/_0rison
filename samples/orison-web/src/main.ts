import { Game } from './core/Game';
import { InputActionManager } from './input/InputAction';
import { ExplorationScene } from './game/ExplorationScene';
import { EnhancedRenderer } from './rendering/EnhancedRenderer';
import { StartScreen } from './ui/StartScreen';
import { PlatformerScene } from './game/PlatformerScene';

/**
 * MESSENGER - Browser-based spherical planet delivery game
 * Deliver letters and packages across a tiny planet!
 */

// Set to true to test platformer, false for exploration
const TEST_PLATFORMER = true;

/**
 * Initialize the game.
 */
async function init(): Promise<void> {
  const canvas = document.querySelector('#game') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  if (TEST_PLATFORMER) {
    // Test platformer scene directly
    const platformer = new PlatformerScene(canvas);
    await platformer.initialize();

    let lastTime = performance.now();
    function gameLoop() {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      platformer.update(deltaTime);
      platformer.render();

      requestAnimationFrame(gameLoop);
    }

    gameLoop();

    window.addEventListener('resize', () => {
      platformer.resize(canvas.width, canvas.height);
    });

    console.log('Platformer initialized!');
    return;
  }

  // Original exploration game
  const game = new Game(canvas, true);
  const inputManager = new InputActionManager();
  inputManager.setupEventListeners();

  const renderer = game.Renderer as EnhancedRenderer;
  if (!renderer) {
    console.error('Failed to get enhanced renderer');
    return;
  }

  new StartScreen(async (name, customization) => {
    const explorationScene = new ExplorationScene(inputManager, renderer, false);
    explorationScene.setCustomization(customization);
    game.setUsePhysics(false);
    await game.start();
    game.setScene(explorationScene);

    window.addEventListener('resize', () => {
      game.resize();
    });

    console.log('Messenger initialized - welcome, ' + name + '!');
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
