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
  const canvas = document.querySelector('#game');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    console.error('Canvas not found or is not a canvas element');
    return;
  }
  const htmlCanvas = canvas as HTMLCanvasElement;

  if (TEST_PLATFORMER) {
    // Test platformer scene directly
    const platformer = new PlatformerScene(htmlCanvas);

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
  const game = new Game(htmlCanvas, true);
  const inputManager = new InputActionManager();
  inputManager.setupEventListeners();

  const renderer = game.Renderer;
  if (!renderer || !(renderer instanceof EnhancedRenderer)) {
    console.error('Failed to get enhanced renderer or renderer is not an EnhancedRenderer');
    return;
  }
  const enhancedRenderer = renderer as EnhancedRenderer;

  new StartScreen(async (name, customization) => {
    const explorationScene = new ExplorationScene(inputManager, enhancedRenderer, false);
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
