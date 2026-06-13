import { Game } from '../core/Game';
import { Scene } from '../core/Scene';
import { InputActionManager } from '../input/InputAction';
import { LevelManager } from './LevelManager';
import { StartMenu } from './StartMenu';
import { PauseMenu } from './PauseMenu';
import { WinScreen } from './WinScreen';

type GameState = 'menu' | 'playing' | 'paused' | 'win';

/**
 * Manages game state transitions without nested callbacks.
 * Uses a clean state machine pattern for scene transitions.
 */
export class GameStateManager {
    private game: Game;
    private inputManager: InputActionManager;
    private currentState: GameState = 'menu';
    private levelManager: LevelManager | null = null;
    private currentScene: Scene | null = null;
    private previousScene: Scene | null = null; // For pause resume

    constructor(game: Game, inputManager: InputActionManager) {
        this.game = game;
        this.inputManager = inputManager;
    }

    /**
     * Initialize and start the game from the menu.
     */
    start(): void {
        this.transitionToMenu();
    }

    /**
     * Transition to the start menu.
     */
    transitionToMenu(): void {
        this.cleanupCurrentScene();
        
        const startMenu = new StartMenu(
            this.inputManager,
            () => this.transitionToPlaying(),
            () => this.transitionToMenu() // Quit just returns to menu
        );
        
        this.game.setScene(startMenu);
        this.currentScene = startMenu;
        this.currentState = 'menu';
    }

    /**
     * Transition to playing state (start game).
     */
    transitionToPlaying(): void {
        this.cleanupCurrentScene();
        
        this.levelManager = new LevelManager(
            this.game,
            this.inputManager,
            () => this.transitionToWin()
        );
        
        this.levelManager.start();
        this.currentScene = this.game.CurrentScene;
        this.currentState = 'playing';
    }

    /**
     * Transition to paused state.
     */
    transitionToPaused(): void {
        if (this.currentState !== 'playing') return;
        
        this.previousScene = this.currentScene;
        
        const pauseMenu = new PauseMenu(
            this.inputManager,
            () => this.transitionToPlayingResume(),
            () => this.transitionToPlayingRestart(),
            () => this.transitionToMenu()
        );
        
        this.game.setScene(pauseMenu);
        this.currentScene = pauseMenu;
        this.currentState = 'paused';
    }

    /**
     * Resume from paused state.
     */
    private transitionToPlayingResume(): void {
        if (this.previousScene) {
            this.game.setScene(this.previousScene);
            this.currentScene = this.previousScene;
            this.previousScene = null;
        }
        this.currentState = 'playing';
    }

    /**
     * Restart the game from paused state.
     */
    private transitionToPlayingRestart(): void {
        this.cleanupCurrentScene();
        this.levelManager = new LevelManager(
            this.game,
            this.inputManager,
            () => this.transitionToWin()
        );
        this.levelManager.start();
        this.currentScene = this.game.CurrentScene;
        this.currentState = 'playing';
    }

    /**
     * Transition to win screen.
     */
    private transitionToWin(): void {
        this.cleanupCurrentScene();
        
        const winScreen = new WinScreen(
            this.inputManager,
            () => this.transitionToPlayingRestart(),
            () => this.transitionToMenu()
        );
        
        this.game.setScene(winScreen);
        this.currentScene = winScreen;
        this.currentState = 'win';
    }

    /**
     * Update the game state manager.
     * Should be called every frame.
     */
    update(): void {
        // Check for pause input
        const pauseAction = this.inputManager.getAction('Pause');
        if (pauseAction?.Pressed && this.currentState === 'playing') {
            this.transitionToPaused();
        }
        
        // Update level manager if playing
        if (this.currentState === 'playing' && this.levelManager) {
            this.levelManager.update();
            this.currentScene = this.game.CurrentScene;
        }
    }

    /**
     * Get the current game state.
     */
    get CurrentState(): GameState {
        return this.currentState;
    }

    /**
     * Clean up the current scene before transitioning.
     */
    private cleanupCurrentScene(): void {
        if (this.currentScene) {
            this.currentScene.end();
        }
        this.levelManager = null;
        this.currentScene = null;
    }
}
