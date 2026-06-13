import { Scene } from '../core/Scene';
import { Entity } from '../core/Entity';
import { CanvasLayer } from '../components/CanvasLayer';
import { InputActionManager } from '../input/InputAction';

/**
 * Win screen with credits and replay option.
 */
export class WinScreen extends Scene {
    private inputManager: InputActionManager;
    private canvasLayer: CanvasLayer | null = null;
    private menuTime: number = 0;
    private onReplay: () => void;
    private onMenu: () => void;

    constructor(inputManager: InputActionManager, onReplay: () => void, onMenu: () => void) {
        super('WinScreen');
        this.inputManager = inputManager;
        this.onReplay = onReplay;
        this.onMenu = onMenu;
    }

    override begin(): void {
        this.createHUD();
    }

    private createHUD(): void {
        this.canvasLayer = new CanvasLayer(window.innerWidth, window.innerHeight);
        const hud = new Entity('WinHUD');
        hud.addComponent(this.canvasLayer);
        this.addEntity(hud);
    }

    override update(deltaTime: number): void {
        this.menuTime += deltaTime;
        this.updateMenuInput();
        this.renderWinScreen();
    }

    private updateMenuInput(): void {
        const select = this.inputManager.getAction('Jump');
        const escape = this.inputManager.getAction('Pause');

        if (select?.Pressed) {
            this.onReplay();
        }
        if (escape?.Pressed) {
            this.onMenu();
        }
    }

    private renderWinScreen(): void {
        if (!this.canvasLayer) return;

        const ctx = this.canvasLayer.Context;
        if (!ctx) return;

        const width = this.canvasLayer.width;
        const height = this.canvasLayer.height;

        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Title
        ctx.save();
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 30;
        ctx.fillText('CONGRATULATIONS!', width / 2, height / 4);
        ctx.restore();

        // Subtitle
        ctx.save();
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('You have completed STELLATE', width / 2, height / 4 + 50);
        ctx.restore();

        // Stats
        ctx.save();
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Levels Completed: 6', width / 2, height / 2 - 40);
        ctx.fillText('Quantum Realm Mastered', width / 2, height / 2);
        ctx.restore();

        // Credits
        ctx.save();
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        const credits = [
            'Inspired by the Zambian Space Program',
            'Edward Mukuka Nkoloso - Visionary',
            '',
            'Game Design & Development',
            '',
            'Thank you for playing!'
        ];
        const startY = height / 2 + 60;
        credits.forEach((line, i) => {
            ctx.fillText(line, width / 2, startY + i * 30);
        });
        ctx.restore();

        // Options
        ctx.save();
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7c5cff';
        ctx.shadowColor = '#7c5cff';
        ctx.shadowBlur = 10;
        ctx.fillText('Press SPACE to Play Again', width / 2, height - 100);
        ctx.restore();

        ctx.save();
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.fillText('Press ESC for Main Menu', width / 2, height - 60);
        ctx.restore();
    }
}
