import { Component } from '../core/Component';
import { RigidBody3D } from './RigidBody3D';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

/**
 * Collider shapes.
 */
export enum ColliderShape {
  Box = 'box',
  Sphere = 'sphere',
  Capsule = 'capsule',
  Cylinder = 'cylinder',
}

/**
 * 3D collider component for collision detection.
 */
export class Collider3D extends Component {
  private collider: RAPIER.Collider | null = null;
  private rigidBody: RigidBody3D | null = null;
  private shape: ColliderShape;
  private size: THREE.Vector3;
  private radius: number;
  private height: number;
  private friction: number;
  private restitution: number;
  private isSensor: boolean;
  private initialized: boolean = false;

  constructor(options: {
    shape?: ColliderShape;
    size?: THREE.Vector3;
    radius?: number;
    height?: number;
    friction?: number;
    restitution?: number;
    isSensor?: boolean;
  } = {}) {
    super();
    this.shape = options.shape ?? ColliderShape.Box;
    this.size = options.size ?? new THREE.Vector3(1, 1, 1);
    this.radius = options.radius ?? 0.5;
    this.height = options.height ?? 1;
    this.friction = options.friction ?? 0.5;
    this.restitution = options.restitution ?? 0;
    this.isSensor = options.isSensor ?? false;
  }

  /**
   * Gets the Rapier collider.
   */
  get Collider(): RAPIER.Collider | null {
    return this.collider;
  }

  /**
   * Sets the collider shape.
   */
  setShape(shape: ColliderShape): void {
    this.shape = shape;
    this.recreateCollider();
  }

  /**
   * Sets the size (for box colliders).
   */
  setSize(size: THREE.Vector3): void {
    this.size.copy(size);
    this.recreateCollider();
  }

  /**
   * Sets the radius (for sphere/capsule colliders).
   */
  setRadius(radius: number): void {
    this.radius = radius;
    this.recreateCollider();
  }

  /**
   * Sets the height (for capsule/cylinder colliders).
   */
  setHeight(height: number): void {
    this.height = height;
    this.recreateCollider();
  }

  /**
   * Sets the friction.
   */
  setFriction(friction: number): void {
    this.friction = friction;
    if (this.collider && (this.collider as any).handle !== undefined) {
      this.collider.setFriction(friction);
    }
  }

  /**
   * Sets the restitution (bounciness).
   */
  setRestitution(restitution: number): void {
    this.restitution = restitution;
    if (this.collider && (this.collider as any).handle !== undefined) {
      this.collider.setRestitution(restitution);
    }
  }

  /**
   * Sets whether this collider is a sensor (trigger).
   */
  setSensor(isSensor: boolean): void {
    this.isSensor = isSensor;
    if (this.collider && (this.collider as any).handle !== undefined) {
      this.collider.setSensor(isSensor);
    }
  }

  override async added(): Promise<void> {
    this.rigidBody = this.Entity?.getComponent(RigidBody3D) || null;
    
    // Wait for physics world to initialize
    const physicsWorld = PhysicsWorld.Instance;
    if (!physicsWorld.World) {
      await physicsWorld.initialize();
    }

    this.createCollider();
  }

  private createCollider(): void {
    const physicsWorld = PhysicsWorld.Instance;
    if (!physicsWorld.World) return;

    // If we have a rigid body, attach collider to it
    // Otherwise, create a static rigid body
    let body = this.rigidBody?.RigidBody;

    if (!body) {
      // Create a static body for this collider
      const bodyDesc = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Fixed);
      try {
        body = physicsWorld.World.createRigidBody(bodyDesc);
      } catch (e) {
        console.error('Failed to create static rigid body for collider:', e);
        return;
      }
    }

    // Create collider descriptor based on shape
    let colliderDesc: RAPIER.ColliderDesc;

    switch (this.shape) {
      case ColliderShape.Box:
        colliderDesc = new RAPIER.ColliderDesc(new RAPIER.Cuboid(
          this.size.x / 2,
          this.size.y / 2,
          this.size.z / 2
        ));
        break;
      
      case ColliderShape.Sphere:
        colliderDesc = new RAPIER.ColliderDesc(new RAPIER.Ball(this.radius));
        break;
      
      case ColliderShape.Capsule:
        colliderDesc = new RAPIER.ColliderDesc(new RAPIER.Capsule(
          this.height / 2,
          this.radius
        ));
        break;
      
      case ColliderShape.Cylinder:
        colliderDesc = new RAPIER.ColliderDesc(new RAPIER.Cylinder(
          this.height / 2,
          this.radius
        ));
        break;
      
      default:
        colliderDesc = new RAPIER.ColliderDesc(new RAPIER.Cuboid(0.5, 0.5, 0.5));
    }

    colliderDesc
      .setFriction(this.friction)
      .setRestitution(this.restitution)
      .setSensor(this.isSensor);

    try {
      if (!body || (body as any).handle === undefined) {
        console.warn('Cannot create collider: RigidBody is not initialized or has been freed');
        return;
      }
      this.collider = physicsWorld.World.createCollider(colliderDesc, body);
      this.initialized = true;
    } catch (e) {
      console.error('Failed to create collider:', e);
    }
  }

  private recreateCollider(): void {
    if (!this.initialized) return;

    const physicsWorld = PhysicsWorld.Instance;
    if (!physicsWorld.World || !this.collider) return;

    // Remove old collider
    physicsWorld.World.removeCollider(this.collider, true);
    this.collider = null;

    // Create new collider
    this.createCollider();
  }

  override removed(): void {
    if (this.collider) {
      const physicsWorld = PhysicsWorld.Instance;
      if (physicsWorld.World) {
        physicsWorld.World.removeCollider(this.collider, true);
      }
      this.collider = null;
    }
  }

  override onDestroy(): void {
    // Collider is cleaned up in removed()
  }
}
