import { Entity } from '../core/Entity';
import { Transform3D } from '../components/Transform3D';
import * as THREE from 'three';
import { CubeToSpherePlanet } from '../world/CubeToSpherePlanet';

/**
 * NPC (Non-Player Character) for delivery quests.
 */
export class NPC extends Entity {
  private npcName: string;
  private dialogLines: string[];
  private hasQuest: boolean;
  private questComplete: boolean = false;
  private world: CubeToSpherePlanet;
  private bobOffset: number = 0;
  private bobSpeed: number = 2.0;

  constructor(name: string, world: CubeToSpherePlanet, dialogLines: string[], hasQuest: boolean = false) {
    super(`NPC_${name}`);
    this.npcName = name;
    this.world = world;
    this.dialogLines = dialogLines;
    this.hasQuest = hasQuest;
  }

  /**
   * Places NPC on planet surface.
   */
  placeOnSurface(lat: number, lon: number): void {
    const transform = new Transform3D();
    const pos = this.world.latLonToPosition(lat, lon, 1.0);
    transform.setPosition(pos.x, pos.y, pos.z);
    this.addComponent(transform);

    this.buildMesh(transform.ThreeObject);
    this.orientToSurface();
  }

  private buildMesh(group: THREE.Object3D): void {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc8a070, roughness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.65 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 });

    const root = new THREE.Group();
    group.add(root);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.25), bodyMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    root.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skinMat);
    head.position.y = 1.4;
    head.castShadow = true;
    root.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat);
    hair.position.y = 1.42;
    hair.rotation.x = Math.PI;
    root.add(hair);

    // Arms
    const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.45, 4, 8), skinMat);
    leftArm.position.set(-0.28, 0.95, 0);
    leftArm.castShadow = true;
    root.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.45, 4, 8), skinMat);
    rightArm.position.set(0.28, 0.95, 0);
    rightArm.castShadow = true;
    root.add(rightArm);

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.45, 4, 8), pantsMat);
    leftLeg.position.set(-0.12, 0.35, 0);
    leftLeg.castShadow = true;
    root.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.45, 4, 8), pantsMat);
    rightLeg.position.set(0.12, 0.35, 0);
    rightLeg.castShadow = true;
    root.add(rightLeg);

    // Quest indicator (floating letter icon when has active quest)
    if (this.hasQuest) {
      const letterGeo = new THREE.BoxGeometry(0.2, 0.28, 0.04);
      const letterMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.3 });
      const letter = new THREE.Mesh(letterGeo, letterMat);
      letter.position.y = 2.0;
      (letter as any).userData = { isQuestIcon: true };
      root.add(letter);
    }
  }

  private orientToSurface(): void {
    const transform = this.getComponent(Transform3D);
    if (!transform) return;

    const normal = this.world.getSurfaceNormal(transform.Position);
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
    const euler = new THREE.Euler().setFromQuaternion(quat);
    transform.setRotation(euler.x, euler.y, euler.z);
  }

  /**
   * Updates NPC animation (called externally by QuestSystem).
   */
  updateAnimation(deltaTime: number): void {
    // Bobbing animation
    this.bobOffset += this.bobSpeed * deltaTime;
    const transform = this.getComponent(Transform3D);
    if (transform) {
      const basePos = this.world.getSurfacePosition(transform.Position);
      const normal = this.world.getSurfaceNormal(transform.Position);
      const bob = Math.sin(this.bobOffset) * 0.05;
      const newPos = basePos.add(normal.multiplyScalar(1.0 + bob));
      transform.setPosition(newPos.x, newPos.y, newPos.z);
    }

    // Rotate quest indicator
    const questIcon = transform?.ThreeObject.children.find((c: any) => c.userData?.isQuestIcon);
    if (questIcon) {
      questIcon.rotation.y += deltaTime * 2;
      questIcon.position.y = 2.4 + Math.sin(this.bobOffset * 1.5) * 0.1;
    }
  }

  get NPCName(): string { return this.npcName; }
  get HasQuest(): boolean { return this.hasQuest && !this.questComplete; }
  get QuestComplete(): boolean { return this.questComplete; }

  getDialog(): string {
    if (this.questComplete) {
      return "Thank you for the delivery!";
    }
    if (this.hasQuest) {
      return this.dialogLines[0] || "I have a letter that needs delivering!";
    }
    return this.dialogLines[Math.floor(Math.random() * this.dialogLines.length)] || "Hello!";
  }

  completeQuest(): void {
    this.questComplete = true;
    this.hasQuest = false;
    // Remove quest indicator
    const transform = this.getComponent(Transform3D);
    if (transform) {
      const questIcon = transform.ThreeObject.children.find((c: any) => c.userData?.isQuestIcon);
      if (questIcon) {
        transform.ThreeObject.remove(questIcon);
      }
    }
  }

  /**
   * Checks if player is close enough to interact.
   */
  canInteract(playerPosition: THREE.Vector3): boolean {
    const transform = this.getComponent(Transform3D);
    if (!transform) return false;
    return transform.Position.distanceTo(playerPosition) < 4.0;
  }
}
