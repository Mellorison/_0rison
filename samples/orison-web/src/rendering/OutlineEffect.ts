import * as THREE from 'three';

/**
 * Inverted hull outline effect for cartoon cel-shaded rendering.
 * Creates a slightly larger black mesh behind each object for outline.
 */
export class OutlineEffect {
  private outlineScale: number = 1.03;
  private outlineColor: number = 0x1a1a2e;

  /**
   * Adds an outline mesh to a group.
   */
  addOutlineToGroup(group: THREE.Object3D, recursive: boolean = true): void {
    if (recursive) {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          this.addOutlineToMesh(child);
        }
      });
    }
  }

  /**
   * Adds an outline to a single mesh.
   */
  addOutlineToMesh(mesh: THREE.Mesh): void {
    // Skip if already has outline
    if ((mesh as any).userData?.hasOutline) return;

    const geometry = mesh.geometry.clone();
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: this.outlineColor,
      side: THREE.BackSide,
      depthWrite: false,
      transparent: true,
      opacity: 0.9
    });

    const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
    outlineMesh.scale.setScalar(this.outlineScale);
    outlineMesh.renderOrder = -1; // Render behind
    (outlineMesh as any).userData = { isOutline: true };

    // Add as sibling, not child, to avoid scale issues
    if (mesh.parent) {
      mesh.parent.add(outlineMesh);
      // Sync position/rotation
      outlineMesh.position.copy(mesh.position);
      outlineMesh.rotation.copy(mesh.rotation);

      // Track original mesh
      (mesh as any).userData = { ...(mesh as any).userData, hasOutline: true, outlineMesh };
    }
  }

  /**
   * Updates outline transforms to match their source meshes.
   * Call this in the render loop.
   */
  updateOutlines(scene: THREE.Scene): void {
    scene.traverse((obj) => {
      if ((obj as any).userData?.isOutline && obj.parent) {
        const siblings = obj.parent.children;
        // Find the original mesh (non-outline sibling)
        const original = siblings.find((c) =>
          c !== obj && (c as any).userData?.outlineMesh === obj
        );
        if (original) {
          obj.position.copy(original.position);
          obj.rotation.copy(original.rotation);
          obj.scale.copy(original.scale).multiplyScalar(this.outlineScale);
        }
      }
    });
  }

  /**
   * Removes all outlines from a scene.
   */
  removeAllOutlines(scene: THREE.Scene): void {
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if ((obj as any).userData?.isOutline) {
        toRemove.push(obj);
      }
      if ((obj as any).userData?.hasOutline) {
        (obj as any).userData.hasOutline = false;
        (obj as any).userData.outlineMesh = null;
      }
    });
    for (const obj of toRemove) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    }
  }
}
