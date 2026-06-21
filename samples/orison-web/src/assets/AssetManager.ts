import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * Asset manager for loading 3D models and textures.
 * Provides cached loading for GLTF and FBX models with animation support.
 */
export class AssetManager {
  private static instance: AssetManager;
  private gltfLoader: GLTFLoader;
  private fbxLoader: FBXLoader;
  private cache: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  private constructor() {
    this.gltfLoader = new GLTFLoader();
    this.fbxLoader = new FBXLoader();
  }

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Load a 3D model from the assets folder (supports GLTF/GLB and FBX).
   * @param path Relative path from public/assets/models/ (e.g., 'character.glb' or 'character.fbx')
   * @returns Promise resolving to an object with scene and animations
   */
  async loadGLTF(path: string): Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }> {
    // Return cached if available
    if (this.cache.has(path)) {
      const cached = this.cache.get(path)!;
      // Clone the scene for a new instance
      const clonedScene = cached.scene.clone(true);
      return { scene: clonedScene, animations: cached.animations };
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!;
    }

    const fullPath = `/assets/models/${path}`;
    const extension = path.split('.').pop()?.toLowerCase();

    const promise = new Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>((resolve, reject) => {
      if (extension === 'fbx') {
        this.fbxLoader.load(
          fullPath,
          (object) => {
            object.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            const result = { scene: object, animations: object.animations || [] };
            this.cache.set(path, result);
            this.loadingPromises.delete(path);
            resolve(result);
          },
          (progress) => {
            console.log(`Loading ${path}: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
          },
          (error) => {
            this.loadingPromises.delete(path);
            console.error(`Error loading ${path}:`, error);
            reject(error);
          }
        );
      } else {
        this.gltfLoader.load(
          fullPath,
          (gltf) => {
            gltf.scene.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            const result = { scene: gltf.scene, animations: gltf.animations || [] };
            this.cache.set(path, result);
            this.loadingPromises.delete(path);
            resolve(result);
          },
          (progress) => {
            console.log(`Loading ${path}: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
          },
          (error) => {
            this.loadingPromises.delete(path);
            console.error(`Error loading ${path}:`, error);
            reject(error);
          }
        );
      }
    });

    this.loadingPromises.set(path, promise);
    return promise;
  }

  /**
   * Load multiple 3D models in parallel.
   */
  async loadMultiple(paths: string[]): Promise<Map<string, { scene: THREE.Group; animations: THREE.AnimationClip[] }>> {
    const results = new Map<string, { scene: THREE.Group; animations: THREE.AnimationClip[] }>();
    const promises = paths.map(async (path) => {
      const model = await this.loadGLTF(path);
      results.set(path, model);
    });
    await Promise.all(promises);
    return results;
  }

  /**
   * Load an FBX animation file (returns just the animation clips).
   * @param path Relative path from public/assets/models/ (e.g., 'Animations/idle.fbx')
   */
  async loadAnimation(path: string): Promise<THREE.AnimationClip[]> {
    const fullPath = `/assets/models/${path}`;
    const extension = path.split('.').pop()?.toLowerCase();

    if (extension !== 'fbx') {
      throw new Error('Only FBX files are supported for separate animations');
    }

    return new Promise<THREE.AnimationClip[]>((resolve, reject) => {
      this.fbxLoader.load(
        fullPath,
        (object) => {
          // FBX animation files contain animations in the object.animations array
          resolve(object.animations || []);
        },
        undefined,
        (error) => {
          console.error(`Error loading animation ${path}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Clear the cache (useful for memory management).
   */
  clearCache(): void {
    this.cache.forEach((gltf) => {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.cache.clear();
  }
}
