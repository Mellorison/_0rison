import { Component } from '../core/Component';
import { Transform3D } from './Transform3D';
import * as THREE from 'three';

/**
 * Light types.
 */
export enum LightType {
  Ambient = 'ambient',
  Directional = 'directional',
  Point = 'point',
  Spot = 'spot',
  Hemisphere = 'hemisphere',
}

/**
 * Light configuration options.
 */
export interface LightOptions {
  type?: LightType;
  color?: number;
  intensity?: number;
  distance?: number;
  decay?: number;
  angle?: number;
  penumbra?: number;
  castShadow?: boolean;
}

/**
 * Light component for illuminating the scene.
 */
export class Light extends Component {
  private light: THREE.Light | null = null;
  private transform: Transform3D | null = null;
  private lightType: LightType;
  private options: LightOptions;

  constructor(options: LightOptions = {}) {
    super();
    this.lightType = options.type ?? LightType.Directional;
    this.options = options;
  }

  /**
   * Gets the Three.js light.
   */
  get ThreeLight(): THREE.Light | null {
    return this.light;
  }

  /**
   * Sets the light intensity.
   */
  setIntensity(intensity: number): void {
    if (this.light) {
      this.light.intensity = intensity;
    }
  }

  /**
   * Sets the light color.
   */
  setColor(color: number): void {
    if (this.light) {
      (this.light as any).color.setHex(color);
    }
  }

  override added(): void {
    this.transform = this.Entity?.getComponent(Transform3D) || null;
    this.createLight();
  }

  private createLight(): void {
    const color = this.options.color ?? 0xffffff;
    const intensity = this.options.intensity ?? 1;

    switch (this.lightType) {
      case LightType.Ambient:
        this.light = new THREE.AmbientLight(color, intensity);
        break;
      
      case LightType.Directional:
        this.light = new THREE.DirectionalLight(color, intensity);
        if (this.options.castShadow) {
          const dirLight = this.light as THREE.DirectionalLight;
          dirLight.castShadow = true;
          dirLight.shadow.mapSize.width = 2048;
          dirLight.shadow.mapSize.height = 2048;
        }
        break;
      
      case LightType.Point:
        this.light = new THREE.PointLight(
          color,
          intensity,
          this.options.distance ?? 0,
          this.options.decay ?? 1
        );
        if (this.options.castShadow) {
          (this.light as THREE.PointLight).castShadow = true;
        }
        break;
      
      case LightType.Spot:
        this.light = new THREE.SpotLight(
          color,
          intensity,
          this.options.distance ?? 0,
          this.options.angle ?? Math.PI / 3,
          this.options.penumbra ?? 0,
          this.options.decay ?? 1
        );
        if (this.options.castShadow) {
          (this.light as THREE.SpotLight).castShadow = true;
        }
        break;
      
      case LightType.Hemisphere:
        this.light = new THREE.HemisphereLight(color, 0x444444, intensity);
        break;
    }

    if (this.light && this.transform) {
      this.transform.ThreeObject.add(this.light);
    }
  }

  override update(deltaTime: number): void {
    // Update light position from transform
    if (this.light && this.transform) {
      this.light.position.copy(this.transform.Position);
      if (this.light instanceof THREE.DirectionalLight || this.light instanceof THREE.SpotLight) {
        const target = this.transform.Position.clone();
        target.add(new THREE.Vector3(0, -1, 0));
        this.light.lookAt(target);
      }
    }
  }

  override removed(): void {
    if (this.light && this.transform) {
      this.transform.ThreeObject.remove(this.light);
      this.light = null;
    }
  }

  override onDestroy(): void {
    if (this.light) {
      this.light.dispose();
      this.light = null;
    }
  }
}
