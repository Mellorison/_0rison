import * as THREE from 'three';

/**
 * Level of Detail (LOD) system for performance optimization.
 * Automatically swaps high-detail models for low-detail versions based on distance.
 * Matches Messenger's LOD system that minimizes visual popping.
 */
export class LODSystem {
  private lods: Map<THREE.Object3D, LODLevel[]> = new Map();
  private camera: THREE.PerspectiveCamera;
  private updateThreshold: number = 0.5; // Only update when camera moves significantly

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  /**
   * Registers an object with multiple LOD levels.
   * @param object The base object to manage.
   * @param levels Array of LOD levels with distance thresholds.
   */
  registerLOD(object: THREE.Object3D, levels: LODLevel[]): void {
    this.lods.set(object, levels);
    
    // Initially set to highest detail
    if (levels.length > 0) {
      this.setLODLevel(object, 0);
    }
  }

  /**
   * Updates LOD levels based on camera distance.
   * Should be called every frame.
   */
  update(): void {
    const cameraPosition = this.camera.position;

    for (const [object, levels] of this.lods) {
      const distance = cameraPosition.distanceTo(object.position);
      
      // Find appropriate LOD level
      let targetLevel = 0;
      for (let i = levels.length - 1; i >= 0; i--) {
        if (distance >= levels[i].distance) {
          targetLevel = i;
          break;
        }
      }

      // Apply LOD level if changed
      this.setLODLevel(object, targetLevel);
    }
  }

  /**
   * Sets the LOD level for an object.
   */
  private setLODLevel(object: THREE.Object3D, level: number): void {
    const levels = this.lods.get(object);
    if (!levels || level >= levels.length) return;

    const targetLOD = levels[level];
    
    // Remove current children
    while (object.children.length > 0) {
      const child = object.children[0];
      object.remove(child);
    }

    // Add new LOD mesh
    if (targetLOD.mesh) {
      object.add(targetLOD.mesh);
    }
  }

  /**
   * Removes an object from LOD management.
   */
  unregisterLOD(object: THREE.Object3D): void {
    this.lods.delete(object);
  }

  /**
   * Clears all LOD registrations.
   */
  clear(): void {
    this.lods.clear();
  }
}

/**
 * Represents a single LOD level.
 */
export interface LODLevel {
  /** Distance at which this LOD level becomes active. */
  distance: number;
  /** The mesh to use at this LOD level. */
  mesh: THREE.Object3D | null;
}

/**
 * Creates LOD levels for a building or structure.
 * @param highDetail High-detail mesh (close range).
 * @param mediumDetail Medium-detail mesh (mid range).
 * @param lowDetail Low-detail mesh (far range).
 * @param mediumDistance Distance threshold for medium LOD.
 * @param lowDistance Distance threshold for low LOD.
 */
export function createBuildingLOD(
  highDetail: THREE.Object3D,
  mediumDetail: THREE.Object3D | null = null,
  lowDetail: THREE.Object3D | null = null,
  mediumDistance: number = 30,
  lowDistance: number = 60
): LODLevel[] {
  const levels: LODLevel[] = [
    { distance: 0, mesh: highDetail }
  ];

  if (mediumDetail) {
    levels.push({ distance: mediumDistance, mesh: mediumDetail });
  }

  if (lowDetail) {
    levels.push({ distance: lowDistance, mesh: lowDetail });
  }

  return levels;
}
