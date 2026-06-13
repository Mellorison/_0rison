import { Game } from '../core/Game';
import { Scene } from '../core/Scene';
import { Entity } from '../core/Entity';
import { Transform3D } from '../components/Transform3D';
import { MeshRenderer } from '../components/MeshRenderer';
import { Camera3D } from '../components/Camera3D';
import { Light, LightType } from '../components/Light';
import { CanvasLayer } from '../components/CanvasLayer';
import { InputActionManager } from '../input/InputAction';
import { ParticleSystem, ParticleOptions } from '../components/ParticleSystem';
import { RigidBody3D, RigidBodyType } from '../components/RigidBody3D';
import { Collider3D, ColliderShape } from '../components/Collider3D';
import * as THREE from 'three';

/**
 * Base Scene for Stellate game, containing player, camera, and common logic.
 */
export abstract class BaseGameScene extends Scene {
    protected player: Entity | null = null;
    protected camera: Entity | null = null;
    protected hud: Entity | null = null;
    protected canvasLayer: CanvasLayer | null = null;
    protected inputManager: InputActionManager;
    protected platforms: Entity[] = [];
    protected score: number = 0;
    protected animationTime: number = 0;
    
    // Character parts
    protected playerModel: Entity | null = null;
    protected headModel: Entity | null = null;
    protected antenna: Entity | null = null;
    protected leftArm: Entity | null = null;
    protected rightArm: Entity | null = null;
    protected leftLeg: Entity | null = null;
    protected rightLeg: Entity | null = null;
    protected leftFoot: Entity | null = null;
    protected rightFoot: Entity | null = null;
    protected visor: Entity | null = null;
    protected chest: Entity | null = null;
    protected backpack: Entity | null = null;
    protected limbRotations = { leftArmRot: 0, rightArmRot: 0, leftLegRot: 0, rightLegRot: 0 };

    // Movement & Camera state
    protected isGrounded: boolean = false;
    protected cameraMode: '2.5D' | '3D' = '2.5D';
    protected currentRotationAngle: number = 0;
    protected targetRotationAngle: number = 0;
    protected worldRotation: number = 0;
    protected isRotating: boolean = false;
    protected dimensionShiftEffect: number = 0;
    protected screenShake: number = 0;
    
    // Time Rewind (Braid style)
    protected history: any[] = [];
    protected isRewinding: boolean = false;
    protected maxHistory: number = 600;
    public isGameWon: boolean = false;

    constructor(name: string, inputManager: InputActionManager) {
        super(name);
        this.inputManager = inputManager;
        console.log('BaseGameScene constructor called with inputManager:', !!inputManager);
    }

    override begin(): void {
        console.log('BaseGameScene begin called');
        this.setupCommon();
        this.initLevel();
    }

    protected abstract initLevel(): void;

    private setupCommon(): void {
        this.createLighting();
        this.createPlayer();
        this.createCamera();
        this.createHUD();
    }

    protected createPlayer(): void {
        this.player = new Entity('Player');
        const transform = this.player.addComponent(new Transform3D());
        transform.setPosition(0, 5, 0); // Start higher to avoid sticking in floor

        const rb = this.player.addComponent(new RigidBody3D({
            type: RigidBodyType.Dynamic,
            linearDamping: 0.5
        }));

        this.player.addComponent(new Collider3D({
            shape: ColliderShape.Capsule,
            radius: 0.4,
            height: 1.0,
            friction: 0.5,
            restitution: 0
        }));

        this.addEntity(this.player);
        this.createCharacterParts();
    }

    protected createCharacterParts(): void {
        // Torso
        this.playerModel = new Entity('AfronautTorso');
        this.playerModel.addComponent(new Transform3D());
        this.playerModel.addComponent(MeshRenderer.createBox(0.6, 0.8, 0.4, 0xeeeeee));
        this.addEntity(this.playerModel);

        // Zambian Flag on chest
        this.chest = new Entity('ChestPanel');
        this.chest.addComponent(new Transform3D());
        this.chest.addComponent(MeshRenderer.createBox(0.4, 0.3, 0.05, 0x008000));
        this.addEntity(this.chest);

        // Head (helmet)
        this.headModel = new Entity('Helmet');
        this.headModel.addComponent(new Transform3D());
        this.headModel.addComponent(MeshRenderer.createBox(0.5, 0.5, 0.5, 0xdddddd));
        this.addEntity(this.headModel);

        // Visor
        this.visor = new Entity('Visor');
        this.visor.addComponent(new Transform3D());
        this.visor.addComponent(MeshRenderer.createBox(0.4, 0.25, 0.05, 0xffd700));
        this.addEntity(this.visor);

        // Antenna
        this.antenna = new Entity('Antenna');
        this.antenna.addComponent(new Transform3D());
        this.antenna.addComponent(MeshRenderer.createBox(0.05, 0.4, 0.05, 0xff0000));
        this.addEntity(this.antenna);

        // Limbs
        this.leftArm = this.createLimb('LeftArm', -0.4, 0.1, 0.2, 0.45, 0xeeeeee);
        this.rightArm = this.createLimb('RightArm', 0.4, 0.1, 0.2, 0.45, 0xeeeeee);
        this.leftLeg = this.createLimb('LeftLeg', -0.18, -0.55, 0.22, 0.4, 0xdddddd);
        this.rightLeg = this.createLimb('RightLeg', 0.18, -0.55, 0.22, 0.4, 0xdddddd);
        
        // Feet
        this.leftFoot = this.createLimb('LeftFoot', -0.18, -0.85, 0.25, 0.15, 0x1a1a3a, 0.3);
        this.rightFoot = this.createLimb('RightFoot', 0.18, -0.85, 0.25, 0.15, 0x1a1a3a, 0.3);

        // Backpack
        this.backpack = new Entity('Backpack');
        this.backpack.addComponent(new Transform3D());
        this.backpack.addComponent(MeshRenderer.createBox(0.5, 0.6, 0.2, 0xcccccc));
        this.addEntity(this.backpack);
    }

    private createLimb(name: string, x: number, y: number, w: number, h: number, color: number, d: number = 0.2): Entity {
        const limb = new Entity(name);
        const t = limb.addComponent(new Transform3D());
        t.setPosition(x, y, 0);
        limb.addComponent(MeshRenderer.createBox(w, h, d, color));
        this.addEntity(limb);
        return limb;
    }

    protected createCamera(): void {
        this.camera = new Entity('MainCamera');
        this.camera.addComponent(new Transform3D()).setPosition(0, 5, 15);
        this.camera.addComponent(new Camera3D());
        this.addEntity(this.camera);
    }

    protected createLighting(): void {
        const sun = new Entity('Sun');
        sun.addComponent(new Transform3D()).setPosition(10, 20, 10);
        sun.addComponent(new Light({ type: LightType.Directional, intensity: 1.2, castShadow: true }));
        this.addEntity(sun);

        const ambient = new Entity('AmbientLight');
        ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.6 }));
        this.addEntity(ambient);
    }

    protected createHUD(): void {
        this.hud = new Entity('HUD');
        this.canvasLayer = this.hud.addComponent(new CanvasLayer(window.innerWidth, window.innerHeight));
        this.addEntity(this.hud);
    }

    override update(deltaTime: number): void {
        super.update(deltaTime);
        
        this.handleCameraToggle();
        this.handleRewind(deltaTime);
        if (!this.isRewinding) {
            this.handleRotation(deltaTime);
            this.handlePlayerMovement(deltaTime);
            this.updateCharacterAnimation(deltaTime);
            this.updateCharacterParts();
            this.captureState();
        }

        this.updateCameraPosition(deltaTime);
        this.updateDimensionShift(deltaTime);
        this.updateScreenShake(deltaTime);
        this.updateHUD(deltaTime);
    }

    protected handlePlayerMovement(deltaTime: number): void {
        if (!this.player) return;
        const rb = this.player.getComponent(RigidBody3D);
        if (!rb) {
            console.error('Player has no RigidBody3D component');
            return;
        }

        // Check if rigid body is initialized
        if (!rb.RigidBody || (rb.RigidBody as any).handle === undefined) {
            console.error('Player RigidBody is not initialized');
            return;
        }

        const moveLeft = this.inputManager.getAction('MoveLeft');
        const moveRight = this.inputManager.getAction('MoveRight');
        const jump = this.inputManager.getAction('Jump');

        let moveDir = (moveRight?.Value || 0) - (moveLeft?.Value || 0);
        if (moveLeft?.Held) moveDir = -1;
        if (moveRight?.Held) moveDir = 1;

        const velocity = rb.getLinearVelocity();
        const moveSpeed = 8;
        
        // Horizontal movement based on world rotation
        let vx = 0, vz = 0;
        const cos = Math.cos(this.currentRotationAngle);
        const sin = Math.sin(this.currentRotationAngle);
        
        vx = moveDir * moveSpeed * cos;
        vz = moveDir * moveSpeed * sin;

        // Wake up the body and set velocity
        rb.setLinearVelocity(new THREE.Vector3(vx, velocity.y, vz));

        // Debug: Log if movement is applied
        if (moveDir !== 0) {
            console.log(`Player moving: ${moveDir}, vx: ${vx}, vz: ${vz}, current vel:`, velocity);
        }

        this.checkGrounded();
        if (jump?.Pressed && this.isGrounded) {
            rb.applyImpulse(new THREE.Vector3(0, 12, 0));
            this.screenShake = 0.2;
        }
    }

    protected handleCameraToggle(): void {
        const toggleCamera = this.inputManager.getAction('ToggleCamera');
        if (!toggleCamera) {
            console.error('ToggleCamera action not found');
            return;
        }
        if (toggleCamera.Pressed) {
            this.cameraMode = this.cameraMode === '2.5D' ? '3D' : '2.5D';
            console.log(`Camera mode switched to: ${this.cameraMode}`);
        }
    }

    protected checkGrounded(): void {
        if (!this.player) return;
        const rb = this.player.getComponent(RigidBody3D);
        if (!rb) return;

        // Use physics velocity to help determine grounded state
        const velocity = rb.getLinearVelocity();
        
        this.isGrounded = false;
        
        // If falling or jumping, not grounded
        if (Math.abs(velocity.y) > 0.1) {
            return;
        }

        const transform = this.player.getComponent(Transform3D);
        if (!transform) return;

        const py = transform.Position.y;
        const px = transform.Position.x;
        const pz = transform.Position.z;

        for (const platform of this.platforms) {
            const pt = platform.getComponent(Transform3D);
            if (!pt) continue;
            
            // Basic box check with a bit more tolerance
            const dx = Math.abs(px - pt.Position.x);
            const dz = Math.abs(pz - pt.Position.z);
            const dy = py - pt.Position.y;

            // Player height is ~1.0, capsule radius 0.4. 
            // Distance from center to bottom is ~0.9
            if (dx < 3 && dz < 3 && dy > 0.7 && dy < 1.3) {
                this.isGrounded = true;
                break;
            }
        }
        
        if (py < -10) { // Fall off world
            transform.setPosition(0, 10, 0);
            rb.setLinearVelocity(new THREE.Vector3(0, 0, 0));
            rb.setTranslation({ x: 0, y: 10, z: 0 }, true);
        }
    }

    protected handleRotation(deltaTime: number): void {
        const rotateLeft = this.inputManager.getAction('RotateLeft');
        const rotateRight = this.inputManager.getAction('RotateRight');

        if (this.cameraMode === '2.5D' && !this.isRotating) {
            if (rotateLeft?.Pressed) {
                this.targetRotationAngle -= Math.PI / 2;
                this.worldRotation = (this.worldRotation + 3) % 4;
                this.isRotating = true;
            }
            if (rotateRight?.Pressed) {
                this.targetRotationAngle += Math.PI / 2;
                this.worldRotation = (this.worldRotation + 1) % 4;
                this.isRotating = true;
            }
        }

        if (this.isRotating) {
            const diff = this.targetRotationAngle - this.currentRotationAngle;
            this.currentRotationAngle += diff * deltaTime * 10;
            if (Math.abs(diff) < 0.01) {
                this.currentRotationAngle = this.targetRotationAngle;
                this.isRotating = false;
                this.snapPlayerToPlane();
            }
        }
    }

    protected snapPlayerToPlane(): void {
        if (!this.player) return;
        const transform = this.player.getComponent(Transform3D);
        const rb = this.player.getComponent(RigidBody3D);
        if (!transform) return;

        const pos = transform.Position.clone();
        // Snap to nearest 2D plane (FEZ style)
        if (this.worldRotation === 0 || this.worldRotation === 2) {
            pos.z = Math.round(pos.z / 2) * 2; // Snap to even grid
        } else {
            pos.x = Math.round(pos.x / 2) * 2;
        }
        
        transform.setPosition(pos.x, pos.y, pos.z);
        if (rb) rb.setTranslation(pos, true);
    }

    protected updateCameraPosition(deltaTime: number): void {
        if (!this.camera || !this.player) return;
        const pT = this.player.getComponent(Transform3D);
        const cT = this.camera.getComponent(Transform3D);
        if (!pT || !cT) return;

        const distance = 15;
        const targetX = pT.Position.x + Math.sin(this.currentRotationAngle) * distance;
        const targetZ = pT.Position.z + Math.cos(this.currentRotationAngle) * distance;
        const targetY = pT.Position.y + 2;

        cT.setPosition(
            cT.Position.x + (targetX - cT.Position.x) * deltaTime * 5,
            cT.Position.y + (targetY - cT.Position.y) * deltaTime * 5,
            cT.Position.z + (targetZ - cT.Position.z) * deltaTime * 5
        );
        
        cT.lookAt(pT.Position);
    }

    protected updateCharacterAnimation(deltaTime: number): void {
        this.animationTime += deltaTime;
        const rb = this.player?.getComponent(RigidBody3D);
        const velocity = rb?.getLinearVelocity() || { x: 0, y: 0, z: 0 };
        const isMoving = Math.abs(velocity.x) > 0.1 || Math.abs(velocity.z) > 0.1;

        let leftArmRot = 0, rightArmRot = 0, leftLegRot = 0, rightLegRot = 0;
        if (isMoving && this.isGrounded) {
            const swing = Math.sin(this.animationTime * 12) * 0.6;
            leftArmRot = swing; rightArmRot = -swing;
            leftLegRot = -swing * 0.8; rightLegRot = swing * 0.8;
        }

        this.limbRotations = { leftArmRot, rightArmRot, leftLegRot, rightLegRot };

        // Antenna
        if (this.antenna) {
            this.antenna.getComponent(Transform3D)?.setRotation(Math.sin(this.animationTime * 8) * 0.3, 0, Math.cos(this.animationTime * 8) * 0.3);
        }
    }

    protected updateCharacterParts(): void {
        if (!this.player) return;
        const pT = this.player.getComponent(Transform3D);
        if (!pT) return;

        const parts = [
            { e: this.playerModel, off: { x: 0, y: 0, z: 0 }, rot: 0 },
            { e: this.headModel, off: { x: 0, y: 0.65, z: 0 }, rot: 0 },
            { e: this.leftArm, off: { x: -0.4, y: 0.1, z: 0 }, rot: this.limbRotations.leftArmRot },
            { e: this.rightArm, off: { x: 0.4, y: 0.1, z: 0 }, rot: this.limbRotations.rightArmRot },
            { e: this.leftLeg, off: { x: -0.18, y: -0.55, z: 0 }, rot: this.limbRotations.leftLegRot },
            { e: this.rightLeg, off: { x: 0.18, y: -0.55, z: 0 }, rot: this.limbRotations.rightLegRot },
            { e: this.leftFoot, off: { x: -0.18, y: -0.85, z: 0.05 }, rot: this.limbRotations.leftLegRot },
            { e: this.rightFoot, off: { x: 0.18, y: -0.85, z: 0.05 }, rot: this.limbRotations.rightLegRot },
            { e: this.backpack, off: { x: 0, y: 0.1, z: -0.35 }, rot: 0 },
            { e: this.chest, off: { x: 0, y: 0.1, z: 0.21 }, rot: 0 },
            { e: this.visor, off: { x: 0, y: 0.65, z: 0.26 }, rot: 0 },
            { e: this.antenna, off: { x: 0.2, y: 1.0, z: 0 }, rot: 0 },
        ];

        parts.forEach(p => {
            if (p.e) {
                const t = p.e.getComponent(Transform3D);
                if (t) {
                    const angle = pT.Rotation.y;
                    const rx = p.off.x * Math.cos(angle) + p.off.z * Math.sin(angle);
                    const rz = -p.off.x * Math.sin(angle) + p.off.z * Math.cos(angle);
                    t.setPosition(pT.Position.x + rx, pT.Position.y + p.off.y, pT.Position.z + rz);
                    t.setRotation(p.rot, angle, 0);
                }
            }
        });
    }

    protected handleRewind(deltaTime: number): void {
        const rewind = this.inputManager.getAction('Rewind');
        this.isRewinding = rewind?.Held || false;

        if (this.isRewinding && this.history.length > 0) {
            const state = this.history.pop();
            this.applyState(state);
        }
    }

    protected captureState(): void {
        if (!this.player) return;
        const t = this.player.getComponent(Transform3D);
        const rb = this.player.getComponent(RigidBody3D);
        if (!t) return;

        this.history.push({
            pos: t.Position.clone(),
            rot: t.Rotation.clone(),
            vel: rb ? rb.getLinearVelocity() : { x: 0, y: 0, z: 0 },
            score: this.score,
            worldRot: this.worldRotation,
            rotAngle: this.currentRotationAngle
        });

        if (this.history.length > this.maxHistory) this.history.shift();
    }

    protected applyState(state: any): void {
        if (!this.player || !state) return;
        const t = this.player.getComponent(Transform3D);
        const rb = this.player.getComponent(RigidBody3D);
        if (t) {
            t.setPosition(state.pos.x, state.pos.y, state.pos.z);
            t.setRotation(state.rot.x, state.rot.y, state.rot.z);
        }
        if (rb) {
            rb.setTranslation(state.pos, true);
            rb.setLinearVelocity(state.vel);
        }
        this.score = state.score;
        this.worldRotation = state.worldRot;
        this.currentRotationAngle = state.rotAngle;
        this.targetRotationAngle = state.rotAngle;
    }

    protected updateDimensionShift(deltaTime: number): void {
        if (this.isRotating) {
            this.dimensionShiftEffect = Math.min(1, this.dimensionShiftEffect + deltaTime * 5);
        } else {
            this.dimensionShiftEffect = Math.max(0, this.dimensionShiftEffect - deltaTime * 2);
        }
    }

    protected updateScreenShake(deltaTime: number): void {
        if (this.screenShake > 0) {
            this.screenShake -= deltaTime;
            if (this.camera) {
                const t = this.camera.getComponent(Transform3D);
                if (t) t.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake, 0);
            }
        }
    }

    protected updateHUD(deltaTime: number): void {
        if (!this.canvasLayer) return;
        const ctx = this.canvasLayer.Context;
        const canvas = this.canvasLayer.Canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // FEZ Style HUD
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(20, 20, 250, 80);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Courier New';
        ctx.fillText(`STELLATE: LEVEL ${this.Name}`, 40, 55);
        ctx.font = '20px Courier New';
        ctx.fillText(`QUANTUM DATA: ${this.score}`, 40, 85);

        // Controls hint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Courier New';
        ctx.fillText('Q/E: ROTATE | SHIFT: REWIND | SPACE: JUMP', 40, canvas.height - 40);

        if (this.isRewinding) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#f00';
            ctx.font = 'bold 48px Courier New';
            ctx.fillText('REWINDING', canvas.width / 2 - 120, canvas.height / 2);
        }

        if (this.isGameWon) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0f0';
            ctx.font = 'bold 64px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('MISSION SUCCESS', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = '24px Courier New';
            ctx.fillStyle = '#fff';
            ctx.fillText('EDWARD NKOLOSO HAS REACHED THE SINGULARITY', canvas.width / 2, canvas.height / 2 + 40);
            ctx.fillText('ZAMBIA IS IN SPACE!', canvas.width / 2, canvas.height / 2 + 80);
        }
    }

    protected createPlatform(x: number, y: number, z: number, w: number, h: number, color: number): Entity {
        const platform = new Entity('Platform');
        platform.addComponent(new Transform3D()).setPosition(x, y, z);
        platform.addComponent(MeshRenderer.createBox(w, h, w, color)); // Depth same as width for FEZ style blocks
        
        platform.addComponent(new RigidBody3D({ type: RigidBodyType.Static }));
        platform.addComponent(new Collider3D({ 
            shape: ColliderShape.Box, 
            size: new THREE.Vector3(w, h, w),
            friction: 1.0,
            restitution: 0.1
        }));
        
        this.addEntity(platform);
        this.platforms.push(platform);
        return platform;
    }
}
