import RAPIER from '@dimforge/rapier3d-compat';
import { Scene } from '../core/Scene';

/**
 * Manages the Rapier physics world.
 */
export class PhysicsWorld {
  private static instance: PhysicsWorld | null = null;
  private world: RAPIER.World | null = null;
  private gravity: RAPIER.Vector3;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.gravity = { x: 0, y: -9.81, z: 0 };
  }

  /**
   * Gets the singleton instance.
   */
  static get Instance(): PhysicsWorld {
    if (!PhysicsWorld.instance) {
      PhysicsWorld.instance = new PhysicsWorld();
    }
    return PhysicsWorld.instance;
  }

  /**
   * Initializes the physics world.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      await RAPIER.init();
      this.world = new RAPIER.World(this.gravity);
      this.initialized = true;
      console.log('Physics world initialized');
    })();

    return this.initPromise;
  }

  /**
   * Gets the Rapier world.
   */
  get World(): RAPIER.World | null {
    return this.world;
  }

  /**
   * Sets the gravity.
   */
  setGravity(x: number, y: number, z: number): void {
    this.gravity = { x, y, z };
    if (this.world) {
      this.world.gravity = this.gravity;
    }
  }

  /**
   * Steps the physics simulation.
   * @param deltaTime Time since last update in seconds.
   */
  step(deltaTime: number): void {
    if (this.world) {
      this.world.step();
    }
  }

  /**
   * Disposes of the physics world.
   */
  dispose(): void {
    if (this.world) {
      this.world.free();
      this.world = null;
    }
    this.initialized = false;
  }
}
