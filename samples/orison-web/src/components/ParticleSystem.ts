import { Component } from '../core/Component';
import * as THREE from 'three';

export interface ParticleOptions {
  count: number;
  size: number;
  color: number;
  lifetime: number;
  speed: number;
  spread: number;
  gravity?: number;
  fade?: boolean;
}

export class ParticleSystem extends Component {
  private particles!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;
  private positions!: Float32Array;
  private velocities!: Float32Array;
  private lifetimes!: Float32Array;
  private initialLifetimes!: Float32Array;
  private colors!: Float32Array;
  private options: ParticleOptions;
  private time: number = 0;

  constructor(options: ParticleOptions) {
    super();
    this.options = options;
    this.initialize();
  }

  private initialize(): void {
    const { count, size, color, lifetime, speed, spread } = this.options;

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.lifetimes = new Float32Array(count);
    this.initialLifetimes = new Float32Array(count);
    this.colors = new Float32Array(count * 3);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      this.resetParticle(i, true);
      this.initialLifetimes[i] = lifetime;
      this.lifetimes[i] = Math.random() * lifetime;
      
      this.colors[i * 3] = colorObj.r;
      this.colors[i * 3 + 1] = colorObj.g;
      this.colors[i * 3 + 2] = colorObj.b;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: size,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(this.geometry, this.material);
  }

  private resetParticle(index: number, initial: boolean = false): void {
    const { speed, spread } = this.options;
    
    this.positions[index * 3] = (Math.random() - 0.5) * spread;
    this.positions[index * 3 + 1] = (Math.random() - 0.5) * spread;
    this.positions[index * 3 + 2] = (Math.random() - 0.5) * spread;

    this.velocities[index * 3] = (Math.random() - 0.5) * speed;
    this.velocities[index * 3 + 1] = (Math.random() - 0.5) * speed;
    this.velocities[index * 3 + 2] = (Math.random() - 0.5) * speed;

    if (!initial) {
      this.lifetimes[index] = this.options.lifetime;
    }
  }

  override update(deltaTime: number): void {
    this.time += deltaTime;
    const { gravity, fade } = this.options;

    for (let i = 0; i < this.options.count; i++) {
      // Update lifetime
      this.lifetimes[i] -= deltaTime;

      // Reset dead particles
      if (this.lifetimes[i] <= 0) {
        this.resetParticle(i);
        continue;
      }

      // Update position
      this.positions[i * 3] += this.velocities[i * 3] * deltaTime;
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * deltaTime;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * deltaTime;

      // Apply gravity
      if (gravity) {
        this.velocities[i * 3 + 1] += gravity * deltaTime;
      }

      // Update color/opacity based on lifetime
      if (fade) {
        const lifeRatio = this.lifetimes[i] / this.options.lifetime;
        this.colors[i * 3 + 3] = lifeRatio; // Alpha is handled by material opacity
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    if (fade) {
      this.geometry.attributes.color.needsUpdate = true;
    }
  }

  get ThreeObject(): THREE.Points {
    return this.particles;
  }

  override removed(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
