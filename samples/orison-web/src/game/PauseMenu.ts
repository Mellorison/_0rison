import { Scene } from '../core/Scene';
import { Entity } from '../core/Entity';
import { CanvasLayer } from '../components/CanvasLayer';
import { InputActionManager } from '../input/InputAction';

/**
 * Pause menu with resume, restart, and quit options.
 */
export class PauseMenu extends Scene {
    private inputManager: InputActionManager;
    private canvasLayer: CanvasLayer | null = null;
    private selectedOption: number = 0;
    private onResume: () => void;
    private onRestart: () => void;
    private onQuit: () => void;

    constructor(inputManager: InputActionManager, onResume: () => void, onRestart: () => void, onQuit: () => void) {
        super('PauseMenu');
        this.inputManager = inputManager;
        this.onResume = onResume;
        this.onRestart = onRestart;
        this.onQuit = onQuit;
    }

    override begin(): void {
        this.createHUD();
    }

    private createHUD(): void {
        this.canvasLayer = new CanvasLayer(window.innerWidth, window.innerHeight);
        const hud = new Entity('PauseHUD');
        hud.addComponent(this.canvasLayer);
        this.addEntity(hud);
    }

    override update(deltaTime: number): void {
        this.updateMenuInput();
        this.renderMenu();
    }

    private updateMenuInput(): void {
        const up = this.inputManager.getAction('MoveUp');
        const down = this.inputManager.getAction('MoveDown');
        const select = this.inputManager.getAction('Jump');
        const pause = this.inputManager.getAction('Pause');

        if (up?.Pressed) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
        }
        if (down?.Pressed) {
            this.selectedOption = Math.min(2, this.selectedOption + 1);
        }
        if (select?.Pressed) {
            this.handleSelection();
        }
        if (pause?.Pressed) {
            this.onResume();
        }
    }

    private handleSelection(): void {
        switch (this.selectedOption) {
            case 0: // Resume
                this.onResume();
                break;
            case 1: // Restart
                this.onRestart();
                break;
            case 2: // Quit to Menu
                this.onQuit();
                break;
        }
    }

    private renderMenu(): void {
        if (!this.canvasLayer) return;

        const ctx = this.canvasLayer.Context;
        if (!ctx) return;

        const width = this.canvasLayer.width;
        const height = this.canvasLayer.height;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);

        // Title
        ctx.save();
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('PAUSED', width / 2, height / 3);
        ctx.restore();

        // Menu options
        const options = ['RESUME', 'RESTART', 'QUIT TO MENU'];
        const startY = height / 2;
        const spacing = 60;

        options.forEach((option, index) => {
            const y = startY + index * spacing;
            const isSelected = index === this.selectedOption;

            ctx.save();
            ctx.font = isSelected ? 'bold 32px Arial' : '28px Arial';
            ctx.textAlign = 'center';
            
            if (isSelected) {
                ctx.fillStyle = '#7c5cff';
                ctx.shadowColor = '#7c5cff';
                ctx.shadowBlur = 10;
                
                ctx.fillText('►', width / 2 - 80, y);
                ctx.fillText('◄', width / 2 + 80, y);
            } else {
                ctx.fillStyle = '#aaa';
            }
            
            ctx.fillText(option, width / 2, y);
            ctx.restore();
        });

        // Footer
        ctx.save();
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.fillText('Press ESC to resume', width / 2, height - 50);
        ctx.restore();
    }
}
