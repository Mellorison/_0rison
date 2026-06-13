import { Component } from './Component';
import { Scene } from './Scene';

/**
 * Represents a game object in the scene.
 * Entities can have components attached to them for various functionality.
 */
export class Entity {
  private name: string;
  private components: Map<string, Component> = new Map();
  private scene: Scene | null = null;
  private active: boolean = true;
  private started: boolean = false;

  /**
   * Creates a new entity.
   * @param name The name of the entity.
   */
  constructor(name: string = 'Entity') {
    this.name = name;
  }

  /**
   * Gets the name of the entity.
   */
  get Name(): string {
    return this.name;
  }

  /**
   * Gets the scene this entity belongs to.
   */
  get Scene(): Scene | null {
    return this.scene;
  }

  /**
   * Whether this entity is currently active.
   */
  get Active(): boolean {
    return this.active;
  }

  set Active(value: boolean) {
    this.active = value;
  }

  /**
   * Adds a component to this entity.
   * @param component The component to add.
   * @returns The added component.
   */
  addComponent<T extends Component>(component: T): T {
    const typeName = component.constructor.name;
    this.components.set(typeName, component);
    component._setEntity(this);
    component.added();
    return component;
  }

  /**
   * Gets a component by type.
   * @param type The component type.
   * @returns The component if found, null otherwise.
   */
  getComponent<T extends Component>(type: new (...args: any[]) => T): T | null {
    const typeName = type.name;
    const component = this.components.get(typeName);
    return component as T || null;
  }

  /**
   * Removes a component by type.
   * @param type The component type.
   */
  removeComponent<T extends Component>(type: new (...args: any[]) => T): void {
    const typeName = type.name;
    const component = this.components.get(typeName);
    if (component) {
      component.removed();
      component.onDestroy();
      this.components.delete(typeName);
    }
  }

  /**
   * Gets all components on this entity.
   */
  getComponents(): Component[] {
    return Array.from(this.components.values());
  }

  /**
   * Called when the entity is added to a scene.
   */
  addedToScene(scene: Scene): void {
    this.scene = scene;
  }

  /**
   * Called when the entity is removed from the scene.
   */
  removedFromScene(): void {
    this.scene = null;
    // Clean up all components
    for (const component of this.components.values()) {
      component.removed();
      component.onDestroy();
    }
    this.components.clear();
  }

  /**
   * Internal update method called by the scene.
   */
  _update(deltaTime: number): void {
    if (!this.active) return;

    // Call start on first update
    if (!this.started) {
      this.started = true;
      for (const component of this.components.values()) {
        if (component.Enabled) {
          component.start();
        }
      }
    }

    // Update all enabled components
    for (const component of this.components.values()) {
      if (component.Enabled) {
        component.update(deltaTime);
      }
    }
  }

  /**
   * Internal render method called by the scene.
   */
  _render(): void {
    if (!this.active) return;

    // Render all enabled components
    for (const component of this.components.values()) {
      if (component.Enabled) {
        component.render();
      }
    }
  }

  /**
   * Removes this entity from the scene.
   */
  removeSelf(): void {
    if (this.scene) {
      this.scene.removeEntity(this);
    }
  }
}
