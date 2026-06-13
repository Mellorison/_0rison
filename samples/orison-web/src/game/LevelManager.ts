import { Game } from '../core/Game';
import { Scene } from '../core/Scene';
import { InputActionManager } from '../input/InputAction';
import { Level1, Level2, Level3, Level4, Level5, Level6 } from './Levels';
import { BaseGameScene } from './BaseGameScene';
import { Transform3D } from '../components/Transform3D';

/**
 * Manages game levels and transitions.
 */
export class LevelManager {
    private game: Game;
    private inputManager: InputActionManager;
    private currentLevelIndex: number = 0;
    private levels: (new (name: string, input: InputActionManager) => Scene)[] = [
        Level1,
        Level2,
        Level3,
        Level4,
        Level5,
        Level6
    ];
    private onGameComplete: () => void;

    constructor(game: Game, inputManager: InputActionManager, onGameComplete: () => void) {
        this.game = game;
        this.inputManager = inputManager;
        this.onGameComplete = onGameComplete;
    }

    start(): void {
        this.loadLevel(0);
    }

    loadLevel(index: number): void {
        if (index < 0 || index >= this.levels.length) return;
        
        this.currentLevelIndex = index;
        const LevelClass = this.levels[index];
        const scene = new LevelClass(`${index + 1}`, this.inputManager);
        this.game.setScene(scene);
    }

    nextLevel(): void {
        const nextIndex = this.currentLevelIndex + 1;
        if (nextIndex < this.levels.length) {
            this.loadLevel(nextIndex);
        } else {
            this.onGameComplete();
        }
    }

    update(): void {
        const currentScene = this.game.CurrentScene;
        if (!currentScene) return;

        // Check for level completion (portal reached)
        const player = currentScene.getEntity('Player');
        const portal = currentScene.getEntity('LevelPortal');

        if (player && portal) {
            const pt = player.getComponent(Transform3D);
            const portT = portal.getComponent(Transform3D);
            
            if (pt && portT) {
                const dist = pt.Position.distanceTo(portT.Position);
                if (dist < 1.5) {
                    this.nextLevel();
                }
            }
        }
    }
}
