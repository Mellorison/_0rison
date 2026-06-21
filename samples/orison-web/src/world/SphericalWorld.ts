import * as THREE from 'three';

/**
 * Spherical planet world for Messenger-style gameplay.
 * Creates a small sphere planet with surface gravity and environment placement.
 */
export class SphericalWorld {
  private scene: THREE.Scene;
  private planetRadius: number = 30;
  private planet: THREE.Mesh;
  private planetGroup: THREE.Group;
  private environmentObjects: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.planetGroup = new THREE.Group();
    this.planet = this.createPlanet();
    this.planetGroup.add(this.planet);
    (this.planetGroup as any).userData = { isEnvironment: true };
    this.scene.add(this.planetGroup);
  }

  /**
   * Creates the planet mesh with African savanna coloring.
   */
  private createPlanet(): THREE.Mesh {
    // Reduced-segment sphere for performance
    const geometry = new THREE.SphereGeometry(this.planetRadius, 24, 24);

    // Create a savanna-colored material
    const material = new THREE.MeshToonMaterial({
      color: 0xc2b280
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    (mesh as any).userData = { isEnvironment: true };

    return mesh;
  }

  /**
   * Gets the planet radius.
   */
  get Radius(): number {
    return this.planetRadius;
  }

  /**
   * Gets the planet center position.
   */
  get Center(): THREE.Vector3 {
    return this.planetGroup.position.clone();
  }

  /**
   * Gets the planet group.
   */
  get PlanetGroup(): THREE.Group {
    return this.planetGroup;
  }

  /**
   * Gets surface normal at a given world position.
   */
  getSurfaceNormal(worldPosition: THREE.Vector3): THREE.Vector3 {
    return worldPosition.clone().sub(this.Center).normalize();
  }

  /**
   * Gets the surface position at a given point (snaps to sphere surface).
   */
  getSurfacePosition(worldPosition: THREE.Vector3): THREE.Vector3 {
    const direction = worldPosition.clone().sub(this.Center).normalize();
    return this.Center.clone().add(direction.multiplyScalar(this.planetRadius));
  }

  /**
   * Gets the surface height at a given point.
   */
  getSurfaceHeight(worldPosition: THREE.Vector3): number {
    const distance = worldPosition.distanceTo(this.Center);
    return distance - this.planetRadius;
  }

  /**
   * Places an object on the planet surface.
   * @param object The object to place.
   * @param lat Latitude in degrees (-90 to 90).
   * @param lon Longitude in degrees (-180 to 180).
   * @param heightOffset Height above surface.
   */
  placeOnSurface(object: THREE.Object3D, lat: number, lon: number, heightOffset: number = 0): void {
    const position = this.latLonToPosition(lat, lon, heightOffset);
    object.position.copy(position);

    // Orient object to surface normal (up points away from center)
    const normal = position.clone().sub(this.Center).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    object.quaternion.copy(quaternion);

    // Tag as environment so renderer preserves it
    (object as any).userData = { isEnvironment: true };
    this.environmentObjects.push(object);
    this.scene.add(object);
  }

  /**
   * Converts latitude/longitude to world position.
   */
  latLonToPosition(lat: number, lon: number, heightOffset: number = 0): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const r = this.planetRadius + heightOffset;
    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const z = (r * Math.sin(phi) * Math.sin(theta));
    const y = (r * Math.cos(phi));

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Converts world position to latitude/longitude.
   */
  positionToLatLon(position: THREE.Vector3): { lat: number; lon: number } {
    const direction = position.clone().sub(this.Center).normalize();

    const lat = 90 - (Math.acos(direction.y) * (180 / Math.PI));
    const lon = (Math.atan2(direction.z, -direction.x) * (180 / Math.PI)) - 180;

    return { lat, lon };
  }

  /**
   * Updates the world.
   */
  update(): void {
    // Planet rotation disabled for performance
  }

  /**
   * Cleans up all environment objects.
   */
  dispose(): void {
    for (const obj of this.environmentObjects) {
      this.scene.remove(obj);
    }
    this.environmentObjects = [];
    this.scene.remove(this.planetGroup);
  }
}
