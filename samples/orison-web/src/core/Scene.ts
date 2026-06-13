import { Entity } from './Entity';

/**
 * Represents a scene in the game.
 * Scenes contain entities and manage the game state.
 */
export class Scene {
  private name: string;
  private entities: Entity[] = [];
  private active: boolean = true;

  /**
   * Creates a new scene.
   * @param name The name of the scene.
   */
  constructor(name: string = 'Scene') {
    this.name = name;
  }

  /**
   * Gets the name of the scene.
   */
  get Name(): string {
    return this.name;
  }

  /**
   * Whether this scene is currently active.
   */
  get Active(): boolean {
    return this.active;
  }

  set Active(value: boolean) {
    this.active = value;
  }

  /**
   * Gets all entities in this scene.
   */
  get Entities(): Entity[] {
    return this.entities;
  }

  /**
   * Adds an entity to the scene.
   * @param entity The entity to add.
   * @returns The added entity.
   */
  addEntity(entity: Entity): Entity {
    this.entities.push(entity);
    entity.addedToScene(this);
    return entity;
  }

  /**
   * Removes an entity from the scene.
   * @param entity The entity to remove.
   */
  removeEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
      entity.removedFromScene();
    }
  }

  /**
   * Gets an entity by name.
   * @param name The name of the entity.
   * @returns The entity if found, null otherwise.
   */
  getEntity(name: string): Entity | null {
    return this.entities.find(e => e.Name === name) || null;
  }

  /**
   * Gets all entities with a specific name.
   * @param name The name to search for.
   * @returns Array of matching entities.
   */
  getEntitiesByName(name: string): Entity[] {
    return this.entities.filter(e => e.Name === name);
  }

  /**
   * Called when the scene starts.
   */
  begin(): void {}

  /**
   * Called when the scene ends.
   */
  end(): void {
    // Clean up all entities
    for (const entity of this.entities) {
      entity.removedFromScene();
    }
    this.entities = [];
  }

  /**
   * Updates the scene and all entities.
   * @param deltaTime Time since last update in seconds.
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Update all entities
    for (const entity of this.entities) {
      entity._update(deltaTime);
    }
  }

  /**
   * Renders the scene and all entities.
   */
  render(): void {
    if (!this.active) return;

    // Render all entities
    for (const entity of this.entities) {
      entity._render();
    }
  }
}
