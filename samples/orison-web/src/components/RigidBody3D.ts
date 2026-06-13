import { Component } from '../core/Component';
import { Transform3D } from './Transform3D';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

/**
 * Rigid body types.
 */
export enum RigidBodyType {
  Static = 'static',
  Dynamic = 'dynamic',
  Kinematic = 'kinematic',
}

/**
 * Rigid body component for physics simulation.
 */
export class RigidBody3D extends Component {
  private rigidBody: RAPIER.RigidBody | null = null;
  private transform: Transform3D | null = null;
  private bodyType: RigidBodyType;
  private mass: number;
  private linearDamping: number;
  private angularDamping: number;
  private initialized: boolean = false;

  constructor(options: {
    type?: RigidBodyType;
    mass?: number;
    linearDamping?: number;
    angularDamping?: number;
  } = {}) {
    super();
    this.bodyType = options.type ?? RigidBodyType.Dynamic;
    this.mass = options.mass ?? 1;
    this.linearDamping = options.linearDamping ?? 0.01;
    this.angularDamping = options.angularDamping ?? 0.01;
  }

  /**
   * Gets the Rapier rigid body.
   */
  get RigidBody(): RAPIER.RigidBody | null {
    return this.rigidBody;
  }

  /**
   * Gets the body type.
   */
  get BodyType(): RigidBodyType {
    return this.bodyType;
  }

  /**
   * Sets the body type.
   */
  set BodyType(value: RigidBodyType) {
    this.bodyType = value;
    if (this.rigidBody && this.rigidBody.handle !== undefined) {
      switch (value) {
        case RigidBodyType.Static:
          this.rigidBody.setBodyType(RAPIER.RigidBodyType.Fixed, true);
          break;
        case RigidBodyType.Dynamic:
          this.rigidBody.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
          break;
        case RigidBodyType.Kinematic:
          this.rigidBody.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
          break;
      }
    }
  }

  /**
   * Applies a force to the rigid body.
   */
  applyForce(force: THREE.Vector3): void {
    if (this.rigidBody && this.rigidBody.handle !== undefined) {
      this.rigidBody.applyImpulse({ x: force.x, y: force.y, z: force.z }, true);
    }
  }

  /**
   * Applies an impulse to the rigid body.
   */
  applyImpulse(impulse: THREE.Vector3): void {
    if (this.rigidBody && this.rigidBody.handle !== undefined) {
      this.rigidBody.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
    }
  }

  /**
   * Applies torque to the rigid body.
   */
  applyTorque(torque: THREE.Vector3): void {
    if (this.rigidBody && this.rigidBody.handle !== undefined) {
      this.rigidBody.applyTorqueImpulse({ x: torque.x, y: torque.y, z: torque.z }, true);
    }
  }

  /**
   * Sets the translation of the rigid body.
   */
  setTranslation(translation: { x: number, y: number, z: number }, wakeUp: boolean = true): void {
    if (this.rigidBody && this.rigidBody.handle !== undefined) {
      this.rigidBody.setTranslation(translation, wakeUp);
    }
  }

  /**
   * Sets the linear velocity.
   */
  setLinearVelocity(velocity: THREE.Vector3): void {
    if (this.rigidBody && this.rigidBody.handle !== undefined) {
      this.rigidBody.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
    }
  }

  /**
   * Gets the linear velocity.
   */
  getLinearVelocity(): THREE.Vector3 {
    if (this.rigidBody && this.rigidBody.handle !== undefined) {
      const vel = this.rigidBody.linvel();
      return new THREE.Vector3(vel.x, vel.y, vel.z);
    }
    return new THREE.Vector3();
  }

  /**
   * Sets the angular velocity.
   */
  setAngularVelocity(velocity: THREE.Vector3): void {
    if (this.rigidBody && this.rigidBody.handle !== undefined) {
      this.rigidBody.setAngvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
    }
  }

  /**
   * Gets the angular velocity.
   */
  getAngularVelocity(): THREE.Vector3 {
    if (this.rigidBody && this.rigidBody.handle !== undefined) {
      const vel = this.rigidBody.angvel();
      return new THREE.Vector3(vel.x, vel.y, vel.z);
    }
    return new THREE.Vector3();
  }

  override async added(): Promise<void> {
    this.transform = this.Entity?.getComponent(Transform3D) || null;
    
    // Wait for physics world to initialize
    const physicsWorld = PhysicsWorld.Instance;
    if (!physicsWorld.World) {
      await physicsWorld.initialize();
    }

    this.createRigidBody();
  }

  private createRigidBody(): void {
    const physicsWorld = PhysicsWorld.Instance;
    if (!physicsWorld.World || !this.transform) return;

    const position = this.transform.Position;
    const rotation = this.transform.Rotation;

    // Create rigid body descriptor
    let bodyDesc: RAPIER.RigidBodyDesc;

    switch (this.bodyType) {
      case RigidBodyType.Static:
        bodyDesc = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Fixed);
        break;
      case RigidBodyType.Kinematic:
        bodyDesc = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.KinematicPositionBased);
        break;
      case RigidBodyType.Dynamic:
      default:
        bodyDesc = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic);
        break;
    }

    bodyDesc
      .setTranslation(position.x, position.y, position.z)
      .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: 1 })
      .setLinearDamping(this.linearDamping)
      .setAngularDamping(this.angularDamping);

    this.rigidBody = physicsWorld.World.createRigidBody(bodyDesc);
    
    // Set additional mass if needed (Rapier auto-calculates from colliders)
    if (this.bodyType === RigidBodyType.Dynamic && this.mass > 0) {
      this.rigidBody.setAdditionalMass(this.mass, true);
    }
    this.initialized = true;
  }

  override update(deltaTime: number): void {
    if (!this.rigidBody || !this.transform) return;

    try {
      // Check if rigid body is still valid
      if (this.rigidBody.handle === undefined) {
        return;
      }
      
      // Sync transform from physics body
      const position = this.rigidBody.translation();
      const rotation = this.rigidBody.rotation();

      this.transform.setPosition(position.x, position.y, position.z);
      this.transform.setRotation(rotation.x, rotation.y, rotation.z);
    } catch (e) {
      // WASM error - physics body not ready or invalid
      console.warn('Physics body not ready for transform sync:', e);
    }
  }

  override removed(): void {
    if (this.rigidBody) {
      const physicsWorld = PhysicsWorld.Instance;
      if (physicsWorld.World) {
        physicsWorld.World.removeRigidBody(this.rigidBody);
      }
      this.rigidBody = null;
    }
  }

  override onDestroy(): void {
    // Rigid body is cleaned up in removed()
  }
}
