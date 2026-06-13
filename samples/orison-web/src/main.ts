import { Game } from './core/Game';
import { Scene } from './core/Scene';
import { Entity } from './core/Entity';
import { Transform3D } from './components/Transform3D';
import { MeshRenderer } from './components/MeshRenderer';
import { Camera3D } from './components/Camera3D';
import { Light, LightType } from './components/Light';
import { CanvasLayer } from './components/CanvasLayer';
import { InputActionManager } from './input/InputAction';
import { ParticleSystem, ParticleOptions } from './components/ParticleSystem';
import { Collider3D } from './components/Collider3D';
import * as THREE from 'three';

import { LevelManager } from './game/LevelManager';
import { StartMenu } from './game/StartMenu';
import { PauseMenu } from './game/PauseMenu';
import { WinScreen } from './game/WinScreen';

// Simple Vector3 helper for distance calculation
class VectorHelper {
  static Distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

/**
 * STELLATE - Quantum Realm Puzzle Platformer
 * Based on the true story of Edward Mukuka Nkoloso and the Zambian Space Program
 */

// Input constants
const MOVE_LEFT = 'MoveLeft';
const MOVE_RIGHT = 'MoveRight';
const MOVE_UP = 'MoveUp';
const MOVE_DOWN = 'MoveDown';
const JUMP = 'Jump';
const ROTATE_LEFT = 'RotateLeft';
const ROTATE_RIGHT = 'RotateRight';
const REWIND = 'Rewind';
const TOGGLE_CAMERA = 'ToggleCamera';
const PAUSE = 'Pause';

/**
 * Initialize the game.
 */
async function init(): Promise<void> {
  const canvas = document.querySelector('#game') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  const game = new Game(canvas);
  const inputManager = new InputActionManager();

  // Setup inputs
  const moveLeft = inputManager.createAction(MOVE_LEFT);
  moveLeft.addKey('KeyA').addKey('ArrowLeft');
  
  const moveRight = inputManager.createAction(MOVE_RIGHT);
  moveRight.addKey('KeyD').addKey('ArrowRight');
  
  const moveUp = inputManager.createAction(MOVE_UP);
  moveUp.addKey('KeyW').addKey('ArrowUp');
  
  const moveDown = inputManager.createAction(MOVE_DOWN);
  moveDown.addKey('KeyS').addKey('ArrowDown');
  
  const jump = inputManager.createAction(JUMP);
  jump.addKey('Space');
  
  const rotateLeft = inputManager.createAction(ROTATE_LEFT);
  rotateLeft.addKey('KeyQ');
  
  const rotateRight = inputManager.createAction(ROTATE_RIGHT);
  rotateRight.addKey('KeyE');
  
  const rewind = inputManager.createAction(REWIND);
  rewind.addKey('ShiftLeft').addKey('ShiftRight');
  
  const toggleCamera = inputManager.createAction(TOGGLE_CAMERA);
  toggleCamera.addKey('KeyC');
  
  const pause = inputManager.createAction(PAUSE);
  pause.addKey('Escape');

  inputManager.setupEventListeners();

  // Game state management
  let gameState: 'menu' | 'playing' | 'paused' | 'win' = 'menu';
  let currentScene: Scene | null = null;

  // Start with menu
  const startMenu = new StartMenu(inputManager, () => {
    // Play button pressed
    gameState = 'playing';
    const levelManager = new LevelManager(game, inputManager, () => {
      // Game complete
      gameState = 'win';
      const winScreen = new WinScreen(
        inputManager,
        () => {
          // Replay
          gameState = 'playing';
          const newLevelManager = new LevelManager(game, inputManager, () => {
            gameState = 'win';
            const newWinScreen = new WinScreen(inputManager, () => {
              gameState = 'playing';
              const replayLevelManager = new LevelManager(game, inputManager, () => {
                gameState = 'win';
                const replayWinScreen = new WinScreen(inputManager, () => {
                  gameState = 'playing';
                  const finalLevelManager = new LevelManager(game, inputManager, () => {
                    gameState = 'win';
                    const finalWinScreen = new WinScreen(inputManager, () => {}, () => {
                      gameState = 'menu';
                      game.setScene(startMenu);
                    });
                    game.setScene(finalWinScreen);
                  });
                  finalLevelManager.start();
                }, () => {
                  gameState = 'menu';
                  game.setScene(startMenu);
                });
                game.setScene(replayWinScreen);
              });
              replayLevelManager.start();
            }, () => {
              gameState = 'menu';
              game.setScene(startMenu);
            });
            game.setScene(newWinScreen);
          });
          newLevelManager.start();
        },
        () => {
          // Menu
          gameState = 'menu';
          game.setScene(startMenu);
        }
      );
      game.setScene(winScreen);
    });
    levelManager.start();
  }, () => {
    // Quit button pressed
    console.log('Quit requested');
  });

  game.setScene(startMenu);
  currentScene = startMenu;

  await game.start();

  // Pause menu creation
  const createPauseMenu = () => {
    return new PauseMenu(
      inputManager,
      () => {
        // Resume
        gameState = 'playing';
        game.setScene(currentScene!);
      },
      () => {
        // Restart
        gameState = 'playing';
        const levelManager = new LevelManager(game, inputManager, () => {
          gameState = 'win';
          const winScreen = new WinScreen(inputManager, () => {
            gameState = 'playing';
            const newLevelManager = new LevelManager(game, inputManager, () => {
              gameState = 'win';
              const newWinScreen = new WinScreen(inputManager, () => {}, () => {
                gameState = 'menu';
                game.setScene(startMenu);
              });
              game.setScene(newWinScreen);
            });
            newLevelManager.start();
          }, () => {
            gameState = 'menu';
            game.setScene(startMenu);
          });
          game.setScene(winScreen);
        });
        levelManager.start();
      },
      () => {
        // Quit to menu
        gameState = 'menu';
        game.setScene(startMenu);
        currentScene = startMenu;
      }
    );
  };

  // Update loop with game state management
  const originalUpdate = game.update.bind(game);
  game.update = (deltaTime: number) => {
    inputManager.update();
    
    // Check for pause input
    const pauseAction = inputManager.getAction('Pause');
    if (pauseAction?.Pressed && gameState === 'playing') {
      gameState = 'paused';
      const pauseMenu = createPauseMenu();
      game.setScene(pauseMenu);
    }
    
    if (gameState === 'playing') {
      // Level manager handles its own updates now
      currentScene = game.CurrentScene;
    }
    
    originalUpdate(deltaTime);
  };

  // Handle window resize
  window.addEventListener('resize', () => {
    game.resize();
  });

  console.log('STELLATE modular engine initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
