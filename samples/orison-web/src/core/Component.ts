import { Entity } from './Entity';

/**
 * Base class for all components that can be attached to entities.
 * Components provide modular functionality like rendering, physics, input handling, etc.
 */
export abstract class Component {
  protected entity: Entity | null = null;
  protected enabled: boolean = true;

  /**
   * Gets the entity this component is attached to.
   */
  get Entity(): Entity | null {
    return this.entity;
  }

  /**
   * Whether this component is currently enabled.
   */
  get Enabled(): boolean {
    return this.enabled;
  }

  set Enabled(value: boolean) {
    if (this.enabled !== value) {
      this.enabled = value;
      if (value) {
        this.onEnabled();
      } else {
        this.onDisabled();
      }
    }
  }

  /**
   * Called when the component is created.
   */
  awake(): void {}

  /**
   * Called when the component is added to an entity.
   */
  added(): void {}

  /**
   * Called when the component is removed from an entity.
   */
  removed(): void {}

  /**
   * Called when the component is enabled.
   */
  onEnabled(): void {}

  /**
   * Called when the component is disabled.
   */
  onDisabled(): void {}

  /**
   * Called before the first update.
   */
  start(): void {}

  /**
   * Called every frame for updating component logic.
   */
  update(deltaTime: number): void {}

  /**
   * Called for rendering the component.
   */
  render(): void {}

  /**
   * Called when the component is about to be destroyed.
   */
  onDestroy(): void {}

  /**
   * Internal method to set the entity.
   */
  _setEntity(entity: Entity): void {
    this.entity = entity;
  }
}
