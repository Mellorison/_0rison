import { BaseGameScene } from './BaseGameScene';
import { Entity } from '../core/Entity';
import { Transform3D } from '../components/Transform3D';
import { MeshRenderer } from '../components/MeshRenderer';
import { RigidBody3D, RigidBodyType } from '../components/RigidBody3D';
import { Collider3D, ColliderShape } from '../components/Collider3D';
import { InteractiveComponent } from '../components/InteractiveComponent';
import { MovingPlatform } from '../components/MovingPlatform';
import * as THREE from 'three';

/**
 * Level 1: The Threshold
 * Introduction to movement and world rotation.
 */
export class Level1 extends BaseGameScene {
    private tutorialStep: number = 0;
    private tutorialText: string = '';

    protected initLevel(): void {
        // Starting platform
        this.createPlatform(0, -2, 0, 8, 1, 0x55aa55);
        
        // Tutorial sign
        this.createSign(0, 0, 0, 'Welcome to STELLATE\nUse WASD or Arrow Keys to move\nSpace to jump');

        // Step 1: Basic movement platforms
        this.createPlatform(-4, 0, 0, 3, 1, 0xaaaaaa);
        this.createPlatform(-8, 2, 0, 3, 1, 0xaaaaaa);
        
        // Step 2: Jump tutorial
        this.createSign(-8, 4, 0, 'Press SPACE to jump');
        this.createPlatform(-8, 5, 0, 3, 1, 0x8888ff);
        this.createPlatform(-8, 7, 0, 3, 1, 0x8888ff);

        // Step 3: Rotation tutorial
        this.createSign(-8, 9, 0, 'Press Q or E to rotate the world\nSome paths are hidden in 2D');
        this.createPlatform(-4, 9, -5, 4, 1, 0xff9999); // Only visible from side
        
        // Step 4: Camera toggle
        this.createSign(0, 9, -5, 'Press C to toggle camera mode');
        this.createPlatform(4, 9, -5, 4, 1, 0x99ff99);
        
        // Step 5: Portal
        this.createPortal(4, 12, -5);
    }

    private createSign(x: number, y: number, z: number, text: string): void {
        const sign = new Entity('Sign');
        sign.addComponent(new Transform3D()).setPosition(x, y, z);
        this.addEntity(sign);
        // Store text for HUD rendering
        (sign as any).text = text;
    }

    private createPortal(x: number, y: number, z: number): void {
        const portal = new Entity('LevelPortal');
        portal.addComponent(new Transform3D()).setPosition(x, y, z);
        portal.addComponent(MeshRenderer.createTorus(1, 0.2, 0x00ffff));
        this.addEntity(portal);
    }

    override updateHUD(deltaTime: number): void {
        super.updateHUD(deltaTime);
        
        if (!this.canvasLayer) return;
        const ctx = this.canvasLayer.Context;
        
        // Show tutorial text when near signs
        if (!this.player) return;
        const pt = this.player.getComponent(Transform3D);
        if (!pt) return;

        this.Entities.filter(e => e.Name === 'Sign').forEach(sign => {
            const st = sign.getComponent(Transform3D);
            if (st) {
                const dist = pt.Position.distanceTo(st.Position);
                if (dist < 3) {
                    this.tutorialText = (sign as any).text;
                }
            }
        });

        if (this.tutorialText) {
            ctx.save();
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            
            const lines = this.tutorialText.split('\n');
            const startY = this.canvasLayer.height - 100;
            lines.forEach((line, i) => {
                ctx.fillText(line, this.canvasLayer.width / 2, startY + i * 25);
            });
            ctx.restore();
        }
    }
}

/**
 * Level 2: Logic Gates
 * Introduction to switches and interactive puzzles.
 */
export class Level2 extends BaseGameScene {
    private doorActive: boolean = false;
    private bridgeActive: boolean = false;

    protected initLevel(): void {
        // Starting platform
        this.createPlatform(0, -2, 0, 6, 1, 0x333333);
        this.createSign(0, 0, 0, 'Level 2: Logic Gates\nActivate switches to open paths');

        // Puzzle 1: Two switches needed to open door
        this.createPlatform(-6, 0, 0, 4, 1, 0x444444);
        
        // Switch 1
        const switch1 = new Entity('Switch1');
        switch1.addComponent(new Transform3D()).setPosition(-6, 0.5, 0);
        switch1.addComponent(MeshRenderer.createBox(0.6, 0.3, 0.6, 0xff4444));
        switch1.addComponent(new InteractiveComponent({
            isToggle: true,
            onActivate: () => {
                this.doorActive = true;
                this.score += 50;
            },
            onDeactivate: () => {
                this.doorActive = false;
            }
        }));
        this.addEntity(switch1);

        // Switch 2 (requires rotation to see)
        this.createPlatform(-6, 0, -8, 4, 1, 0x444444);
        const switch2 = new Entity('Switch2');
        switch2.addComponent(new Transform3D()).setPosition(-6, 0.5, -8);
        switch2.addComponent(MeshRenderer.createBox(0.6, 0.3, 0.6, 0x44ff44));
        switch2.addComponent(new InteractiveComponent({
            isToggle: true,
            onActivate: () => {
                this.bridgeActive = true;
                this.score += 50;
            },
            onDeactivate: () => {
                this.bridgeActive = false;
            }
        }));
        this.addEntity(switch2);

        // Door (opens when both switches active)
        const door = new Entity('Door');
        door.addComponent(new Transform3D()).setPosition(-3, 2, 0);
        door.addComponent(MeshRenderer.createBox(2, 3, 0.5, 0x888888));
        door.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        door.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(2, 3, 0.5) }));
        this.addEntity(door);
        this.platforms.push(door);
        (door as any).isDoor = true;

        // Bridge (appears when second switch active)
        const bridge = new Entity('Bridge');
        bridge.addComponent(new Transform3D()).setPosition(-6, 2, -4);
        bridge.addComponent(MeshRenderer.createBox(4, 0.5, 8, 0x6666ff));
        bridge.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        bridge.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(4, 0.5, 8) }));
        bridge.Active = false; // Hidden initially
        this.addEntity(bridge);
        this.platforms.push(bridge);
        (bridge as any).isBridge = true;

        // Portal beyond door
        this.createPortal(-3, 6, 0);
    }

    private createSign(x: number, y: number, z: number, text: string): void {
        const sign = new Entity('Sign');
        sign.addComponent(new Transform3D()).setPosition(x, y, z);
        this.addEntity(sign);
        (sign as any).text = text;
    }

    private createPortal(x: number, y: number, z: number): void {
        const portal = new Entity('LevelPortal');
        portal.addComponent(new Transform3D()).setPosition(x, y, z);
        portal.addComponent(MeshRenderer.createTorus(1, 0.2, 0xff00ff));
        this.addEntity(portal);
    }

    override update(deltaTime: number): void {
        super.update(deltaTime);
        this.updatePuzzleElements();
    }

    private updatePuzzleElements(): void {
        // Update door visibility based on switches
        const door = this.getEntity('Door');
        if (door) {
            door.Active = !this.doorActive;
        }

        // Update bridge visibility
        const bridge = this.getEntity('Bridge');
        if (bridge) {
            bridge.Active = this.bridgeActive;
        }
    }
}

/**
 * Level 3: The Singularity
 * Complex moving platform puzzles with timing challenges.
 */
export class Level3 extends BaseGameScene {
    protected initLevel(): void {
        // Starting platform
        this.createPlatform(0, -2, 0, 6, 1, 0x111111);
        this.createSign(0, 0, 0, 'Level 3: The Singularity\nTime your jumps on moving platforms');

        // Puzzle 1: Horizontal moving platform
        this.createPlatform(6, 0, 0, 3, 1, 0x222222);
        
        const moving1 = new Entity('Moving1');
        moving1.addComponent(new Transform3D()).setPosition(10, 0, 0);
        moving1.addComponent(MeshRenderer.createBox(3, 0.5, 3, 0x00ffff));
        moving1.addComponent(new RigidBody3D({ type: RigidBodyType.Kinematic }));
        moving1.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(3, 0.5, 3) }));
        moving1.addComponent(new MovingPlatform(new THREE.Vector3(8, 0, 0), 3));
        this.addEntity(moving1);
        this.platforms.push(moving1);

        // Puzzle 2: Vertical moving platform (requires timing)
        this.createPlatform(18, 0, 0, 3, 1, 0x222222);
        
        const moving2 = new Entity('Moving2');
        moving2.addComponent(new Transform3D()).setPosition(22, 2, 0);
        moving2.addComponent(MeshRenderer.createBox(3, 0.5, 3, 0xff00ff));
        moving2.addComponent(new RigidBody3D({ type: RigidBodyType.Kinematic }));
        moving2.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(3, 0.5, 3) }));
        moving2.addComponent(new MovingPlatform(new THREE.Vector3(0, 6, 0), 2.5));
        this.addEntity(moving2);
        this.platforms.push(moving2);

        // Puzzle 3: Circular moving platform (requires rotation)
        this.createPlatform(22, 8, 0, 3, 1, 0x222222);
        
        const moving3 = new Entity('Moving3');
        moving3.addComponent(new Transform3D()).setPosition(22, 10, -5);
        moving3.addComponent(MeshRenderer.createBox(3, 0.5, 3, 0xffff00));
        moving3.addComponent(new RigidBody3D({ type: RigidBodyType.Kinematic }));
        moving3.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(3, 0.5, 3) }));
        moving3.addComponent(new MovingPlatform(new THREE.Vector3(0, 0, 10), 4));
        this.addEntity(moving3);
        this.platforms.push(moving3);

        // Puzzle 4: Synchronized platforms
        this.createPlatform(22, 10, 5, 3, 1, 0x222222);
        
        const moving4a = new Entity('Moving4a');
        moving4a.addComponent(new Transform3D()).setPosition(26, 10, 5);
        moving4a.addComponent(MeshRenderer.createBox(2, 0.5, 2, 0x00ff00));
        moving4a.addComponent(new RigidBody3D({ type: RigidBodyType.Kinematic }));
        moving4a.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(2, 0.5, 2) }));
        moving4a.addComponent(new MovingPlatform(new THREE.Vector3(4, 0, 0), 2));
        this.addEntity(moving4a);
        this.platforms.push(moving4a);

        const moving4b = new Entity('Moving4b');
        moving4b.addComponent(new Transform3D()).setPosition(32, 10, 5);
        moving4b.addComponent(MeshRenderer.createBox(2, 0.5, 2, 0x00ff00));
        moving4b.addComponent(new RigidBody3D({ type: RigidBodyType.Kinematic }));
        moving4b.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(2, 0.5, 2) }));
        moving4b.addComponent(new MovingPlatform(new THREE.Vector3(-4, 0, 0), 2));
        this.addEntity(moving4b);
        this.platforms.push(moving4b);

        // Final platform with portal
        this.createPlatform(34, 12, 5, 4, 1, 0x444444);
        this.createPortal(34, 14, 5);
    }

    private createSign(x: number, y: number, z: number, text: string): void {
        const sign = new Entity('Sign');
        sign.addComponent(new Transform3D()).setPosition(x, y, z);
        this.addEntity(sign);
        (sign as any).text = text;
    }

    private createPortal(x: number, y: number, z: number): void {
        const portal = new Entity('LevelPortal');
        portal.addComponent(new Transform3D()).setPosition(x, y, z);
        portal.addComponent(MeshRenderer.createTorus(1, 0.2, 0xffffff));
        this.addEntity(portal);
    }
}

/**
 * Level 4: Quantum Entanglement
 * Dimension shift puzzles - platforms exist in different dimensions.
 */
export class Level4 extends BaseGameScene {
    protected initLevel(): void {
        // Starting platform
        this.createPlatform(0, -2, 0, 6, 1, 0x1a1a2e);
        this.createSign(0, 0, 0, 'Level 4: Quantum Entanglement\nShift dimensions to reveal hidden paths\nPress Shift to toggle dimension');

        // Dimension A platforms (visible in normal mode)
        this.createPlatform(6, 0, 0, 4, 1, 0x4a4a8a);
        this.createPlatform(12, 2, 0, 4, 1, 0x4a4a8a);
        
        // Dimension B platforms (only visible when shifted)
        const dimB1 = new Entity('DimB1');
        dimB1.addComponent(new Transform3D()).setPosition(6, 0, -5);
        dimB1.addComponent(MeshRenderer.createBox(4, 1, 4, 0x8a4a8a));
        dimB1.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        dimB1.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(4, 1, 4) }));
        dimB1.Active = false; // Hidden in normal dimension
        this.addEntity(dimB1);
        this.platforms.push(dimB1);
        (dimB1 as any).isDimensionB = true;

        const dimB2 = new Entity('DimB2');
        dimB2.addComponent(new Transform3D()).setPosition(12, 4, -5);
        dimB2.addComponent(MeshRenderer.createBox(4, 1, 4, 0x8a4a8a));
        dimB2.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        dimB2.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(4, 1, 4) }));
        dimB2.Active = false;
        this.addEntity(dimB2);
        this.platforms.push(dimB2);
        (dimB2 as any).isDimensionB = true;

        // Mixed dimension puzzle
        this.createPlatform(18, 4, 0, 3, 1, 0x6a6aaa);
        
        // Platform that exists in both dimensions but different positions
        const shared1 = new Entity('Shared1');
        shared1.addComponent(new Transform3D()).setPosition(22, 4, 0);
        shared1.addComponent(MeshRenderer.createBox(3, 1, 3, 0xaa6aaa));
        shared1.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        shared1.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(3, 1, 3) }));
        this.addEntity(shared1);
        this.platforms.push(shared1);

        // Final platform with portal
        this.createPlatform(26, 6, 0, 4, 1, 0x8a8aaa);
        this.createPortal(26, 8, 0);
    }

    private createSign(x: number, y: number, z: number, text: string): void {
        const sign = new Entity('Sign');
        sign.addComponent(new Transform3D()).setPosition(x, y, z);
        this.addEntity(sign);
        (sign as any).text = text;
    }

    private createPortal(x: number, y: number, z: number): void {
        const portal = new Entity('LevelPortal');
        portal.addComponent(new Transform3D()).setPosition(x, y, z);
        portal.addComponent(MeshRenderer.createTorus(1, 0.2, 0xffaa00));
        this.addEntity(portal);
    }

    override update(deltaTime: number): void {
        super.update(deltaTime);
        this.updateDimensionPlatforms();
    }

    private updateDimensionPlatforms(): void {
        const isShifted = this.dimensionShiftEffect > 0.5;
        
        this.Entities.forEach(entity => {
            if ((entity as any).isDimensionB) {
                entity.Active = isShifted;
            }
        });
    }
}

/**
 * Level 5: Temporal Paradox
 * Time rewind puzzles - use time rewind to solve puzzles.
 */
export class Level5 extends BaseGameScene {
    private puzzleSolved: boolean = false;
    private timeGates: Entity[] = [];

    protected initLevel(): void {
        // Starting platform
        this.createPlatform(0, -2, 0, 6, 1, 0x1e1e3e);
        this.createSign(0, 0, 0, 'Level 5: Temporal Paradox\nHold Shift to rewind time\nUse it to retry difficult jumps');

        // Puzzle 1: Fast moving platform (requires rewind if missed)
        this.createPlatform(8, 0, 0, 3, 1, 0x3e3e5e);
        
        const fastMoving = new Entity('FastMoving');
        fastMoving.addComponent(new Transform3D()).setPosition(12, 0, 0);
        fastMoving.addComponent(MeshRenderer.createBox(2, 0.5, 2, 0xff3366));
        fastMoving.addComponent(new RigidBody3D({ type: RigidBodyType.Kinematic }));
        fastMoving.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(2, 0.5, 2) }));
        fastMoving.addComponent(new MovingPlatform(new THREE.Vector3(6, 0, 0), 1.5)); // Very fast
        this.addEntity(fastMoving);
        this.platforms.push(fastMoving);

        // Puzzle 2: Disappearing platforms
        this.createPlatform(18, 0, 0, 3, 1, 0x3e3e5e);
        
        const fading1 = new Entity('Fading1');
        fading1.addComponent(new Transform3D()).setPosition(22, 2, 0);
        fading1.addComponent(MeshRenderer.createBox(3, 0.5, 3, 0x66ff33));
        fading1.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        fading1.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(3, 0.5, 3) }));
        this.addEntity(fading1);
        this.platforms.push(fading1);
        (fading1 as any).isFading = true;
        (fading1 as any).fadeTimer = 0;

        const fading2 = new Entity('Fading2');
        fading2.addComponent(new Transform3D()).setPosition(26, 4, 0);
        fading2.addComponent(MeshRenderer.createBox(3, 0.5, 3, 0x66ff33));
        fading2.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        fading2.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(3, 0.5, 3) }));
        this.addEntity(fading2);
        this.platforms.push(fading2);
        (fading2 as any).isFading = true;
        (fading2 as any).fadeTimer = 1;

        // Puzzle 3: Time gate (only opens after rewinding past a point)
        this.createPlatform(30, 4, 0, 4, 1, 0x3e3e5e);
        
        const timeGate = new Entity('TimeGate');
        timeGate.addComponent(new Transform3D()).setPosition(34, 6, 0);
        timeGate.addComponent(MeshRenderer.createBox(1, 3, 0.5, 0x33ffff));
        timeGate.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        timeGate.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(1, 3, 0.5) }));
        this.addEntity(timeGate);
        this.platforms.push(timeGate);
        (timeGate as any).isTimeGate = true;
        this.timeGates.push(timeGate);

        // Final platform with portal
        this.createPlatform(38, 6, 0, 4, 1, 0x5e5e7e);
        this.createPortal(38, 8, 0);
    }

    private createSign(x: number, y: number, z: number, text: string): void {
        const sign = new Entity('Sign');
        sign.addComponent(new Transform3D()).setPosition(x, y, z);
        this.addEntity(sign);
        (sign as any).text = text;
    }

    private createPortal(x: number, y: number, z: number): void {
        const portal = new Entity('LevelPortal');
        portal.addComponent(new Transform3D()).setPosition(x, y, z);
        portal.addComponent(MeshRenderer.createTorus(1, 0.2, 0x33ffff));
        this.addEntity(portal);
    }

    override update(deltaTime: number): void {
        super.update(deltaTime);
        this.updateFadingPlatforms(deltaTime);
    }

    private updateFadingPlatforms(deltaTime: number): void {
        this.Entities.forEach(entity => {
            if ((entity as any).isFading) {
                (entity as any).fadeTimer += deltaTime;
                const cycle = Math.sin((entity as any).fadeTimer * 2);
                entity.Active = cycle > 0;
            }
        });
    }
}

/**
 * Level 6: Event Horizon
 * Complex multi-mechanic puzzle combining all game mechanics.
 */
export class Level6 extends BaseGameScene {
    private puzzleState: number = 0;
    private switchesActivated: number = 0;
    private dimensionShifted: boolean = false;

    protected initLevel(): void {
        // Starting platform
        this.createPlatform(0, -2, 0, 6, 1, 0x0f0f1f);
        this.createSign(0, 0, 0, 'Level 6: Event Horizon\nFinal Challenge\nUse all mechanics to reach the portal');

        // Phase 1: Rotation + Moving Platforms
        this.createPlatform(8, 0, 0, 3, 1, 0x2f2f3f);
        
        const moving1 = new Entity('Moving1');
        moving1.addComponent(new Transform3D()).setPosition(12, 0, 0);
        moving1.addComponent(MeshRenderer.createBox(2, 0.5, 2, 0xff6699));
        moving1.addComponent(new RigidBody3D({ type: RigidBodyType.Kinematic }));
        moving1.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(2, 0.5, 2) }));
        moving1.addComponent(new MovingPlatform(new THREE.Vector3(0, 0, 6), 3));
        this.addEntity(moving1);
        this.platforms.push(moving1);

        // Platform only visible from side (requires rotation)
        this.createPlatform(12, 0, 8, 3, 1, 0x3f3f5f);

        // Phase 2: Switch Puzzle (3 switches required)
        this.createPlatform(18, 0, 8, 4, 1, 0x4f4f6f);
        this.createSign(18, 2, 8, 'Activate all 3 switches');

        // Switch 1 (visible)
        const switch1 = new Entity('Switch1');
        switch1.addComponent(new Transform3D()).setPosition(18, 0.5, 8);
        switch1.addComponent(MeshRenderer.createBox(0.6, 0.3, 0.6, 0xff0000));
        switch1.addComponent(new InteractiveComponent({
            isToggle: true,
            onActivate: () => {
                this.switchesActivated++;
                this.checkSwitches();
            },
            onDeactivate: () => {
                this.switchesActivated--;
            }
        }));
        this.addEntity(switch1);

        // Switch 2 (requires dimension shift)
        this.createPlatform(18, 0, 0, 3, 1, 0x4f4f6f);
        const switch2 = new Entity('Switch2');
        switch2.addComponent(new Transform3D()).setPosition(18, 0.5, 0);
        switch2.addComponent(MeshRenderer.createBox(0.6, 0.3, 0.6, 0x00ff00));
        switch2.addComponent(new InteractiveComponent({
            isToggle: true,
            onActivate: () => {
                this.switchesActivated++;
                this.checkSwitches();
            },
            onDeactivate: () => {
                this.switchesActivated--;
            }
        }));
        this.addEntity(switch2);
        (switch2 as any).isDimensionB = true;
        switch2.Active = false;

        // Switch 3 (requires timing on moving platform)
        const moving2 = new Entity('Moving2');
        moving2.addComponent(new Transform3D()).setPosition(24, 2, 8);
        moving2.addComponent(MeshRenderer.createBox(2, 0.5, 2, 0x9966ff));
        moving2.addComponent(new RigidBody3D({ type: RigidBodyType.Kinematic }));
        moving2.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(2, 0.5, 2) }));
        moving2.addComponent(new MovingPlatform(new THREE.Vector3(4, 0, 0), 2));
        this.addEntity(moving2);
        this.platforms.push(moving2);

        const switch3 = new Entity('Switch3');
        switch3.addComponent(new Transform3D()).setPosition(24, 2.5, 8);
        switch3.addComponent(MeshRenderer.createBox(0.6, 0.3, 0.6, 0x0000ff));
        switch3.addComponent(new InteractiveComponent({
            isToggle: true,
            onActivate: () => {
                this.switchesActivated++;
                this.checkSwitches();
            },
            onDeactivate: () => {
                this.switchesActivated--;
            }
        }));
        this.addEntity(switch3);

        // Door that opens when all switches active
        const door = new Entity('FinalDoor');
        door.addComponent(new Transform3D()).setPosition(28, 4, 8);
        door.addComponent(MeshRenderer.createBox(2, 4, 0.5, 0x888888));
        door.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        door.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(2, 4, 0.5) }));
        this.addEntity(door);
        this.platforms.push(door);
        (door as any).isFinalDoor = true;

        // Phase 3: Final challenge - fading platforms + time pressure
        this.createPlatform(32, 4, 8, 3, 1, 0x5f5f7f);
        
        const fade1 = new Entity('Fade1');
        fade1.addComponent(new Transform3D()).setPosition(36, 6, 8);
        fade1.addComponent(MeshRenderer.createBox(2, 0.5, 2, 0xffff00));
        fade1.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        fade1.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(2, 0.5, 2) }));
        this.addEntity(fade1);
        this.platforms.push(fade1);
        (fade1 as any).isFading = true;
        (fade1 as any).fadeTimer = 0;

        const fade2 = new Entity('Fade2');
        fade2.addComponent(new Transform3D()).setPosition(40, 8, 8);
        fade2.addComponent(MeshRenderer.createBox(2, 0.5, 2, 0xffff00));
        fade2.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        fade2.addComponent(new Collider3D({ shape: ColliderShape.Box, size: new THREE.Vector3(2, 0.5, 2) }));
        this.addEntity(fade2);
        this.platforms.push(fade2);
        (fade2 as any).isFading = true;
        (fade2 as any).fadeTimer = 0.5;

        // Final platform with portal
        this.createPlatform(44, 8, 8, 4, 1, 0x7f7f9f);
        this.createPortal(44, 10, 8);
    }

    private createSign(x: number, y: number, z: number, text: string): void {
        const sign = new Entity('Sign');
        sign.addComponent(new Transform3D()).setPosition(x, y, z);
        this.addEntity(sign);
        (sign as any).text = text;
    }

    private createPortal(x: number, y: number, z: number): void {
        const portal = new Entity('LevelPortal');
        portal.addComponent(new Transform3D()).setPosition(x, y, z);
        portal.addComponent(MeshRenderer.createTorus(1.5, 0.3, 0xffd700));
        this.addEntity(portal);
    }

    override update(deltaTime: number): void {
        super.update(deltaTime);
        this.updateFadingPlatforms(deltaTime);
        this.updateDimensionPlatforms();
    }

    private checkSwitches(): void {
        const door = this.getEntity('FinalDoor');
        if (door) {
            door.Active = this.switchesActivated < 3;
        }
    }

    private updateFadingPlatforms(deltaTime: number): void {
        this.Entities.forEach(entity => {
            if ((entity as any).isFading) {
                (entity as any).fadeTimer += deltaTime;
                const cycle = Math.sin((entity as any).fadeTimer * 3);
                entity.Active = cycle > 0;
            }
        });
    }

    private updateDimensionPlatforms(): void {
        const isShifted = this.dimensionShiftEffect > 0.5;
        
        this.Entities.forEach(entity => {
            if ((entity as any).isDimensionB) {
                entity.Active = isShifted;
            }
        });
    }
}
