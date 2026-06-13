import { Scene } from '../core/Scene';
import { Entity } from '../core/Entity';
import { Transform3D } from '../components/Transform3D';
import { MeshRenderer } from '../components/MeshRenderer';
import { Camera3D } from '../components/Camera3D';
import { Light, LightType } from '../components/Light';
import { CanvasLayer } from '../components/CanvasLayer';
import { InputActionManager } from '../input/InputAction';
import * as THREE from 'three';

/**
 * Start Menu scene with title, play button, and instructions.
 */
export class StartMenu extends Scene {
    private inputManager: InputActionManager;
    private canvasLayer: CanvasLayer | null = null;
    private menuTime: number = 0;
    private selectedOption: number = 0;
    private onPlay: () => void;
    private onQuit: () => void;

    constructor(inputManager: InputActionManager, onPlay: () => void, onQuit: () => void) {
        super('StartMenu');
        this.inputManager = inputManager;
        this.onPlay = onPlay;
        this.onQuit = onQuit;
    }

    override begin(): void {
        this.createCamera();
        this.createLighting();
        this.createBackground();
        this.createHUD();
    }

    private createCamera(): void {
        const camera = new Entity('MenuCamera');
        camera.addComponent(new Transform3D()).setPosition(0, 0, 10);
        camera.addComponent(new Camera3D());
        this.addEntity(camera);
    }

    private createLighting(): void {
        const ambient = new Entity('AmbientLight');
        ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.5 }));
        this.addEntity(ambient);

        const directional = new Entity('DirectionalLight');
        directional.addComponent(new Transform3D()).setPosition(5, 10, 5);
        directional.addComponent(new Light({ type: LightType.Directional, intensity: 1 }));
        this.addEntity(directional);
    }

    private createBackground(): void {
        // Create floating geometric shapes for visual interest
        for (let i = 0; i < 20; i++) {
            const shape = new Entity(`FloatingShape${i}`);
            const transform = shape.addComponent(new Transform3D());
            transform.setPosition(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10 - 5
            );
            transform.setRotation(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            const size = 0.5 + Math.random() * 1;
            const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);
            
            if (Math.random() > 0.5) {
                shape.addComponent(MeshRenderer.createBox(size, size, size, color.getHex()));
            } else {
                shape.addComponent(MeshRenderer.createSphere(size, color.getHex()));
            }

            this.addEntity(shape);
        }
    }

    private createHUD(): void {
        this.canvasLayer = new CanvasLayer(window.innerWidth, window.innerHeight);
        const hud = new Entity('MenuHUD');
        hud.addComponent(this.canvasLayer);
        this.addEntity(hud);
    }

    override update(deltaTime: number): void {
        this.menuTime += deltaTime;
        this.updateMenuInput();
        this.renderMenu();
        this.animateBackground(deltaTime);
    }

    private updateMenuInput(): void {
        const up = this.inputManager.getAction('MoveUp');
        const down = this.inputManager.getAction('MoveDown');
        const select = this.inputManager.getAction('Jump');

        if (up?.Pressed) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
        }
        if (down?.Pressed) {
            this.selectedOption = Math.min(2, this.selectedOption + 1);
        }
        if (select?.Pressed) {
            this.handleSelection();
        }
    }

    private handleSelection(): void {
        switch (this.selectedOption) {
            case 0: // Play
                this.onPlay();
                break;
            case 1: // Instructions
                // Could show instructions overlay
                break;
            case 2: // Quit
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

        ctx.clearRect(0, 0, width, height);

        // Title
        ctx.save();
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7c5cff';
        ctx.shadowColor = '#7c5cff';
        ctx.shadowBlur = 20;
        ctx.fillText('STELLATE', width / 2, height / 4);
        ctx.restore();

        // Subtitle
        ctx.save();
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Quantum Realm Puzzle Platformer', width / 2, height / 4 + 40);
        ctx.restore();

        // Menu options
        const options = ['PLAY', 'INSTRUCTIONS', 'QUIT'];
        const startY = height / 2;
        const spacing = 60;

        options.forEach((option, index) => {
            const y = startY + index * spacing;
            const isSelected = index === this.selectedOption;

            ctx.save();
            ctx.font = isSelected ? 'bold 36px Arial' : '28px Arial';
            ctx.textAlign = 'center';
            
            if (isSelected) {
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#7c5cff';
                ctx.shadowBlur = 15;
                
                // Draw arrow indicator
                ctx.fillText('►', width / 2 - 100, y);
                ctx.fillText('◄', width / 2 + 100, y);
            } else {
                ctx.fillStyle = '#888';
            }
            
            ctx.fillText(option, width / 2, y);
            ctx.restore();
        });

        // Footer
        ctx.save();
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.fillText('Use Arrow Keys or WASD to navigate, Space to select', width / 2, height - 50);
        ctx.restore();
    }

    private animateBackground(deltaTime: number): void {
        this.Entities.forEach((entity, index) => {
            if (entity.Name.startsWith('FloatingShape')) {
                const transform = entity.getComponent(Transform3D);
                if (transform) {
                    const speed = 0.5 + (index % 3) * 0.3;
                    transform.setRotation(
                        transform.Rotation.x + deltaTime * speed,
                        transform.Rotation.y + deltaTime * speed * 0.7,
                        transform.Rotation.z + deltaTime * speed * 0.5
                    );
                }
            }
        });
    }
}
