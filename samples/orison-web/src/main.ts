import { PlatformerGame } from './game/PlatformerGame';

/**
 * THE MESSENJAH - 2D quantum platformer delivery game
 * Deliver data crystals across Zambian villages in the year 2147.
 */

/**
 * Initialize the game.
 */
function init(): void {
  const canvas = document.querySelector('#game');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    console.error('Canvas not found or is not a canvas element');
    return;
  }

  const platformerGame = new PlatformerGame(canvas);

  window.addEventListener('beforeunload', () => {
    platformerGame.dispose();
  });

  console.log('The Messenjah initialized!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
