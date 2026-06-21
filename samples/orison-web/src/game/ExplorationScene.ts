import { Scene } from '../core/Scene';
import { Entity } from '../core/Entity';
import { Transform3D } from '../components/Transform3D';
import { InputActionManager } from '../input/InputAction';
import { EnhancedRenderer } from '../rendering/EnhancedRenderer';
import { CubeToSpherePlanet } from '../world/CubeToSpherePlanet';
import { PlanetEnvironment } from '../world/PlanetEnvironment';
import { MultiplayerManager } from '../networking/MultiplayerManager';
import { QuestSystem } from './QuestSystem';
import { EmoteSystem } from './EmoteSystem';
import { NPC } from './NPC';
import { StartScreen, CharacterCustomization } from '../ui/StartScreen';
import { AssetManager } from '../assets/AssetManager';
import { AnimationController } from '../assets/AnimationController';
import * as THREE from 'three';

/**
 * Messenger-style spherical planet exploration scene.
 * Integrates: spherical world, NPCs, quests, emotes, character customization.
 */
export class ExplorationScene extends Scene {
  private inputManager: InputActionManager;
  private enhancedRenderer: EnhancedRenderer;
  private world: CubeToSpherePlanet | null = null;
  private environment: PlanetEnvironment | null = null;
  private questSystem: QuestSystem | null = null;
  private emoteSystem: EmoteSystem | null = null;
  private multiplayerManager: MultiplayerManager | null = null;
  private playerEntity: Entity | null = null;
  private multiplayerEnabled: boolean = false;
  private camera: THREE.PerspectiveCamera;

  // Customization
  private customization: CharacterCustomization | null = null;

  // Player state
  private moveSpeed: number = 8.0;
  private rotationSpeed: number = 10.0;
  private jumpForce: number = 5.0;
  private gravity: number = 20.0;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private isGrounded: boolean = true;
  private surfaceNormal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private interactingNPC: NPC | null = null;
  private dialoguePanel: HTMLDivElement | null = null;
  private particles: THREE.Points | null = null;
  private assetManager: AssetManager = AssetManager.getInstance();
  private animationController: AnimationController | null = null;

  // Character animation
  private charParts: {
    root: THREE.Group;
    torso: THREE.Mesh;
    head: THREE.Mesh;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    mailbag: THREE.Mesh;
  } | null = null;
  private animTime: number = 0;
  private isWalking: boolean = false;
  private isRunning: boolean = false;
  private currentSpeed: number = 0;

  constructor(
    inputManager: InputActionManager,
    renderer: EnhancedRenderer,
    enableMultiplayer: boolean = false
  ) {
    super();
    this.inputManager = inputManager;
    this.enhancedRenderer = renderer;
    this.camera = renderer.ThreeCamera;
    this.multiplayerEnabled = enableMultiplayer;
  }

  /**
   * Sets character customization from start screen.
   */
  setCustomization(customization: CharacterCustomization): void {
    this.customization = customization;
  }

  override async begin(): Promise<void> {
    await this.initialize();
    super.begin();
  }

  async initialize(): Promise<void> {
    // Create cube-to-sphere deformed planet (Messenger signature look)
    this.world = new CubeToSpherePlanet(this.enhancedRenderer.ThreeScene);

    // Generate planet environment
    this.environment = new PlanetEnvironment(this.world);
    await this.environment.generatePlanet();

    // Create quest system with NPCs
    this.questSystem = new QuestSystem(this.world, this.enhancedRenderer.ThreeScene);
    const npcs = this.questSystem.createQuestNPCs();
    for (const npc of npcs) {
      this.addEntity(npc);
    }

    // Add atmospheric floating particles
    this.createAtmosphericParticles();

    // Create emote system
    this.emoteSystem = new EmoteSystem(this.enhancedRenderer.ThreeScene, (emoji) => {
      if (this.playerEntity) {
        const transform = this.playerEntity.getComponent(Transform3D);
        if (transform) {
          this.emoteSystem?.playEmote(emoji, transform.Position);
        }
      }
    });

    // Create player
    await this.createPlayer();

    // Snap camera to player immediately (don't start from default position)
    if (this.playerEntity && this.world) {
      const transform = this.playerEntity.getComponent(Transform3D);
      if (transform) {
        this.surfaceNormal = this.world.getSurfaceNormal(transform.Position);
        const offset = new THREE.Vector3(0, 2.5, 5);
        const alignQuat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), this.surfaceNormal
        );
        offset.applyQuaternion(alignQuat);
        this.camera.position.copy(transform.Position).add(offset);
        const lookAt = transform.Position.clone().add(this.surfaceNormal.multiplyScalar(2));
        this.camera.lookAt(lookAt);
      }
    }

    // Setup inputs
    this.setupInputs();

    // Create dialogue UI
    this.createDialogueUI();

    // Multiplayer
    if (this.multiplayerEnabled) {
      this.multiplayerManager = new MultiplayerManager('ws://localhost:8080');
      this.multiplayerManager.connect();
    }

    // Initial camera
    this.camera.position.set(0, 45, 50);
    this.camera.lookAt(0, 0, 0);

    console.log('Messenger-style spherical world initialized');
  }

  private setupInputs(): void {
    this.inputManager.createAction('MoveForward').addKey('KeyW').addKey('ArrowUp');
    this.inputManager.createAction('MoveBackward').addKey('KeyS').addKey('ArrowDown');
    this.inputManager.createAction('MoveLeft').addKey('KeyA').addKey('ArrowLeft');
    this.inputManager.createAction('MoveRight').addKey('KeyD').addKey('ArrowRight');
    this.inputManager.createAction('Jump').addKey('Space');
    this.inputManager.createAction('Sprint').addKey('ShiftLeft').addKey('ShiftRight');
    this.inputManager.createAction('Interact').addKey('KeyE');
  }

  private async createPlayer(): Promise<void> {
    this.playerEntity = new Entity('Player');
    const transform = new Transform3D();

    // Place on surface
    if (this.world) {
      const pos = this.world.latLonToPosition(0, 0, 1.2);
      transform.setPosition(pos.x, pos.y, pos.z);
    }

    this.playerEntity.addComponent(transform);

    // Build character mesh with customization (async for GLTF loading)
    await this.buildCharacterMesh(transform.ThreeObject);

    this.addEntity(this.playerEntity);
  }

  private async buildCharacterMesh(group: THREE.Object3D): Promise<void> {
    const charGroup = group as THREE.Group;

    try {
      // Try to load character model (supports .glb, .gltf, .fbx)
      const modelData = await this.assetManager.loadGLTF('characterMedium.fbx');
      const characterModel = modelData.scene;
      characterModel.scale.set(0.05, 0.05, 0.05); // Scale down FBX model
      charGroup.add(characterModel);

      // Set up animation controller
      this.animationController = new AnimationController(modelData);

      // Load separate animation files
      try {
        const idleAnim = await this.assetManager.loadAnimation('Animations/idle.fbx');
        if (idleAnim.length > 0) {
          this.animationController.addAnimations(idleAnim);
        }
      } catch (e) {
        console.warn('Failed to load idle animation:', e);
      }

      try {
        const runAnim = await this.assetManager.loadAnimation('Animations/run.fbx');
        if (runAnim.length > 0) {
          this.animationController.addAnimations(runAnim);
        }
      } catch (e) {
        console.warn('Failed to load run animation:', e);
      }

      try {
        const jumpAnim = await this.assetManager.loadAnimation('Animations/jump.fbx');
        if (jumpAnim.length > 0) {
          this.animationController.addAnimations(jumpAnim);
        }
      } catch (e) {
        console.warn('Failed to load jump animation:', e);
      }

      // Start with idle animation if available
      if (this.animationController.hasAnimation('idle')) {
        this.animationController.play('idle');
      } else if (modelData.animations && modelData.animations.length > 0) {
        // Fallback to first animation from model
        const firstAnim = modelData.animations[0].name.toLowerCase();
        this.animationController.play(firstAnim);
      }

      // Store reference for animation (if model has bones)
      // Note: FBX model structure may differ, so we use the root only
      this.charParts = {
        root: characterModel,
        torso: characterModel.children[0] as THREE.Mesh || characterModel as any,
        head: characterModel.children[1] as THREE.Mesh || characterModel as any,
        leftArm: characterModel.children[2] as THREE.Mesh || characterModel as any,
        rightArm: characterModel.children[3] as THREE.Mesh || characterModel as any,
        leftLeg: characterModel.children[4] as THREE.Mesh || characterModel as any,
        rightLeg: characterModel.children[5] as THREE.Mesh || characterModel as any,
        mailbag: characterModel.children[6] as THREE.Mesh || characterModel as any
      };
    } catch (error) {
      console.warn('Failed to load character model, using procedural fallback:', error);
      this.buildProceduralCharacter(charGroup);
    }
  }

  private buildProceduralCharacter(charGroup: THREE.Group): void {
    const c = this.customization;
    const bodyColor = c ? parseInt(c.shirtColor.replace('#', ''), 16) : 0x3a6b8a;
    const skinColor = c ? parseInt(c.skinColor.replace('#', ''), 16) : 0xd4a574;
    const hairColor = c ? parseInt(c.hairColor.replace('#', ''), 16) : 0x1a0f0a;
    const pantsColor = c ? parseInt(c.pantsColor.replace('#', ''), 16) : 0x2a2a2a;
    const shoeColor = c ? parseInt(c.shoeColor.replace('#', ''), 16) : 0x1a1a1a;

    const shirtMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.85, metalness: 0 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65, metalness: 0 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.95, metalness: 0 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.9, metalness: 0 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.7, metalness: 0.1 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.3 });
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.6, metalness: 0 });

    const root = new THREE.Group();
    root.position.y = 0;
    charGroup.add(root);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.28), shirtMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    root.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
    head.position.y = 1.45;
    head.castShadow = true;
    root.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat);
    hair.position.y = 1.48;
    hair.rotation.x = Math.PI;
    root.add(hair);

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
    leftEye.position.set(-0.08, 1.48, 0.19);
    root.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
    rightEye.position.set(0.08, 1.48, 0.19);
    root.add(rightEye);

    const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.5, 4, 8), skinMat);
    leftArm.position.set(-0.32, 1.0, 0);
    leftArm.castShadow = true;
    root.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.5, 4, 8), skinMat);
    rightArm.position.set(0.32, 1.0, 0);
    rightArm.castShadow = true;
    root.add(rightArm);

    const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 4, 8), pantsMat);
    leftLeg.position.set(-0.14, 0.4, 0);
    leftLeg.castShadow = true;
    root.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 4, 8), pantsMat);
    rightLeg.position.set(0.14, 0.4, 0);
    rightLeg.castShadow = true;
    root.add(rightLeg);

    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.28), shoeMat);
    leftShoe.position.set(-0.14, 0.08, 0.06);
    root.add(leftShoe);
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.28), shoeMat);
    rightShoe.position.set(0.14, 0.08, 0.06);
    root.add(rightShoe);

    const mailbag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.1), bagMat);
    mailbag.position.set(0.22, 1.02, -0.14);
    mailbag.rotation.z = -0.15;
    mailbag.castShadow = true;
    root.add(mailbag);

    this.charParts = { root, torso, head, leftArm, rightArm, leftLeg, rightLeg, mailbag };
  }

  private createDialogueUI(): void {
    this.dialoguePanel = document.createElement('div');
    this.dialoguePanel.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.95);
      padding: 16px 24px;
      border-radius: 16px;
      font-family: 'Segoe UI', sans-serif;
      font-size: 16px;
      color: #333;
      z-index: 100;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      display: none;
      max-width: 400px;
      text-align: center;
    `;
    document.body.appendChild(this.dialoguePanel);
  }

  private showDialogue(text: string, npcName: string): void {
    if (!this.dialoguePanel) return;
    this.dialoguePanel.style.display = 'block';
    this.dialoguePanel.innerHTML = `
      <div style="font-weight: bold; color: #3498db; margin-bottom: 8px;">${npcName}</div>
      <div>${text}</div>
      <div style="margin-top: 10px; font-size: 12px; color: #888;">Press E to continue</div>
    `;
  }

  private hideDialogue(): void {
    if (this.dialoguePanel) {
      this.dialoguePanel.style.display = 'none';
    }
  }

  private createAtmosphericParticles(): void {
    const particleCount = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0xffffff);
    const color2 = new THREE.Color(0xfffacd);

    for (let i = 0; i < particleCount; i++) {
      const r = 35 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = Math.random() > 0.5 ? color1 : color2;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geometry, material);
    (this.particles as any).userData = { isEnvironment: true };
    this.enhancedRenderer.ThreeScene.add(this.particles);
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    if (!this.playerEntity || !this.world) return;

    const transform = this.playerEntity.getComponent(Transform3D);
    if (!transform) return;

    const playerPos = transform.Position;

    // Get surface normal (gravity direction)
    this.surfaceNormal = this.world.getSurfaceNormal(playerPos);

    // Check ground
    const height = this.world.getSurfaceHeight(playerPos);
    this.isGrounded = height <= 0.3;

    // Gravity toward center
    const gravityDir = this.surfaceNormal.clone().negate();
    this.velocity.add(gravityDir.multiplyScalar(this.gravity * deltaTime));

    // Input
    const forward = this.inputManager.getAction('MoveForward')?.Pressed || false;
    const backward = this.inputManager.getAction('MoveBackward')?.Pressed || false;
    const left = this.inputManager.getAction('MoveLeft')?.Pressed || false;
    const right = this.inputManager.getAction('MoveRight')?.Pressed || false;
    const jump = this.inputManager.getAction('Jump')?.Pressed || false;
    const sprint = this.inputManager.getAction('Sprint')?.Pressed || false;
    const interactPressed = this.inputManager.getAction('Interact')?.Pressed || false;

    // Handle NPC interactions
    this.handleInteractions(playerPos, interactPressed);

    // Movement direction relative to camera and surface
    const moveDir = this.calculateMoveDirection(forward, backward, left, right);

    let speed = this.moveSpeed;
    if (sprint) speed *= 1.5;

    // Smooth acceleration/deceleration
    const isMoving = moveDir.length() > 0.1;
    this.isWalking = isMoving && !sprint;
    this.isRunning = isMoving && sprint;

    if (isMoving) {
      moveDir.normalize();
      const targetSpeed = sprint ? this.moveSpeed * 1.5 : this.moveSpeed;
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, 6 * deltaTime);
      const targetVel = moveDir.multiplyScalar(this.currentSpeed);
      this.velocity.lerp(targetVel, 8 * deltaTime);
    } else {
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 0, 8 * deltaTime);
      this.velocity.lerp(new THREE.Vector3(0, 0, 0), 8 * deltaTime);
    }

    if (jump && this.isGrounded) {
      this.velocity.add(this.surfaceNormal.clone().multiplyScalar(this.jumpForce));
    }

    // Apply velocity
    const newPos = playerPos.clone().add(this.velocity.clone().multiplyScalar(deltaTime));
    transform.setPosition(newPos.x, newPos.y, newPos.z);

    // Orient to surface
    this.orientCharacter(transform);

    // Animate character body parts
    this.animateCharacter(deltaTime);

    // Update camera
    this.updateCamera(transform);

    // Update world
    this.world.update();

    // Update NPCs
    this.questSystem?.update(deltaTime);

    // Slowly rotate atmospheric particles
    if (this.particles) {
      this.particles.rotation.y += deltaTime * 0.02;
    }

    // Multiplayer
    if (this.multiplayerManager) {
      this.multiplayerManager.updateLocalPlayer(transform.Position, transform.Rotation.y, performance.now());
      this.multiplayerManager.updateRemotePlayers(deltaTime);
    }
  }

  private handleInteractions(playerPos: THREE.Vector3, interactPressed: boolean): void {
    if (!this.questSystem) return;

    const interaction = this.questSystem.checkInteractions(playerPos);

    if (interaction && interaction.canInteract) {
      const npc = interaction.npc;

      if (this.interactingNPC !== npc) {
        this.interactingNPC = npc;
        this.questSystem.showInteractionPrompt(npc.NPCName);
      }

      if (interactPressed) {
        const dialog = this.questSystem.interact(npc);
        this.showDialogue(dialog, npc.NPCName);

        // If quest was just completed, play emote
        if (npc.QuestComplete) {
          this.emoteSystem?.playEmote('🎉', playerPos);
        }
      }
    } else {
      if (this.interactingNPC) {
        this.interactingNPC = null;
        this.questSystem.hideInteractionPrompt();
        this.hideDialogue();
      }
    }
  }

  private animateCharacter(deltaTime: number): void {
    // Use GLTF/FBX skeletal animation if available
    if (this.animationController) {
      this.animationController.update(deltaTime);

      // Switch animations based on movement state
      if (this.isRunning && this.animationController.hasAnimation('run')) {
        this.animationController.play('run');
      } else if (this.isWalking && this.animationController.hasAnimation('walk')) {
        this.animationController.play('walk');
      } else if (this.animationController.hasAnimation('idle')) {
        this.animationController.play('idle');
      }
      return;
    }

    // Fallback to procedural animation for non-GLTF models
    if (!this.charParts || !this.charParts.leftArm || !this.charParts.rightArm) return;

    const parts = this.charParts;
    this.animTime += deltaTime;

    if (this.isWalking || this.isRunning) {
      const cycleSpeed = this.isRunning ? 12 : 8;
      const cycle = this.animTime * cycleSpeed;
      const armSwing = Math.sin(cycle) * 0.4;
      const bob = Math.abs(Math.sin(cycle)) * 0.06;

      parts.leftArm.rotation.x = armSwing;
      parts.rightArm.rotation.x = -armSwing;
      parts.root.position.y = bob;
      parts.torso.rotation.y = Math.sin(cycle * 0.5) * 0.05;
    } else {
      const breathe = Math.sin(this.animTime * 1.5) * 0.02;
      parts.root.position.y = breathe;
      parts.torso.scale.y = 1 + breathe * 0.3;

      parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, 0, 5 * deltaTime);
      parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, 0, 5 * deltaTime);
      parts.torso.rotation.y = THREE.MathUtils.lerp(parts.torso.rotation.y, 0, 5 * deltaTime);
    }
  }

  private calculateMoveDirection(fwd: boolean, back: boolean, left: boolean, right: boolean): THREE.Vector3 {
    const dir = new THREE.Vector3();

    const camFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    camFwd.sub(this.surfaceNormal.clone().multiplyScalar(camFwd.dot(this.surfaceNormal))).normalize();

    const camRight = new THREE.Vector3().crossVectors(this.surfaceNormal, camFwd).normalize();

    if (fwd) dir.add(camFwd);
    if (back) dir.sub(camFwd);
    if (right) dir.add(camRight);
    if (left) dir.sub(camRight);

    return dir;
  }

  private orientCharacter(transform: Transform3D): void {
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, this.surfaceNormal);

    const current = new THREE.Quaternion().setFromEuler(transform.Rotation);
    current.slerp(quat, 0.2);

    const euler = new THREE.Euler().setFromQuaternion(current);
    transform.setRotation(euler.x, euler.y, euler.z);
  }

  private updateCamera(transform: Transform3D): void {
    const playerPos = transform.Position;
    const offset = new THREE.Vector3(0, 2.5, 5);

    const alignQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      this.surfaceNormal
    );
    offset.applyQuaternion(alignQuat);

    const target = playerPos.clone().add(offset);
    this.camera.position.lerp(target, 0.15);

    const lookAt = playerPos.clone().add(this.surfaceNormal.multiplyScalar(2));
    this.camera.lookAt(lookAt);
  }

  override end(): void {
    this.multiplayerManager?.disconnect();
    this.emoteSystem?.dispose();
    this.questSystem?.dispose();
    this.dialoguePanel?.remove();
    if (this.particles) {
      this.enhancedRenderer.ThreeScene.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose();
    }
    this.environment?.dispose();
    this.world?.dispose();
    super.end();
  }
}
