import * as THREE from 'three';

/**
 * Realistic smooth planet with PBR materials.
 */
export class CubeToSpherePlanet {
  private scene: THREE.Scene;
  private planetRadius: number = 30;
  private planet: THREE.Mesh;
  private planetGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.planetGroup = new THREE.Group();
    this.planet = this.createPlanet();
    this.planetGroup.add(this.planet);
    (this.planetGroup as any).userData = { isEnvironment: true };
    this.scene.add(this.planetGroup);
  }

  private createPlanet(): THREE.Mesh {
    // High-detail smooth icosahedron
    const geometry = new THREE.IcosahedronGeometry(this.planetRadius, 4);
    const posAttr = geometry.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const roughness = new Float32Array(posAttr.count);

    const cSand = new THREE.Color(0xc8b090);
    const cGreen = new THREE.Color(0x5a7a4a);
    const cGrass = new THREE.Color(0x8a9a5a);
    const cDirt = new THREE.Color(0x7a6548);
    const cRock = new THREE.Color(0x8a8070);

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      const n = new THREE.Vector3(x, y, z).normalize();

      // Multi-octave noise for realistic terrain
      const noise1 = Math.sin(n.x * 5) * Math.cos(n.z * 4) * 0.5;
      const noise2 = Math.sin(n.y * 7 + n.x * 3) * 0.3;
      const noise3 = Math.cos(n.x * 10 + n.z * 8) * 0.15;
      const r = this.planetRadius + noise1 + noise2 + noise3;
      posAttr.setXYZ(i, n.x * r, n.y * r, n.z * r);

      // Realistic biome patches
      const p = Math.sin(n.x * 3) * Math.cos(n.y * 4) * Math.sin(n.z * 5);
      const p2 = Math.cos(n.x * 7 + n.z * 3) * Math.sin(n.y * 5);
      let c: THREE.Color;
      let rough: number;

      if (p > 0.5) { c = cRock; rough = 0.95; }
      else if (p > 0.2) { c = cSand; rough = 0.85; }
      else if (p > -0.2) { c = cGrass; rough = 0.9; }
      else if (p2 > 0.3) { c = cGreen; rough = 0.8; }
      else { c = cDirt; rough = 0.92; }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      roughness[i] = rough;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    // PBR Standard material for realistic look
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0,
      envMapIntensity: 0.5
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    (mesh as any).userData = { isEnvironment: true };

    return mesh;
  }

  get Radius(): number { return this.planetRadius; }
  get Center(): THREE.Vector3 { return this.planetGroup.position.clone(); }
  get PlanetGroup(): THREE.Group { return this.planetGroup; }

  getSurfaceNormal(worldPosition: THREE.Vector3): THREE.Vector3 {
    return worldPosition.clone().sub(this.Center).normalize();
  }

  getSurfacePosition(worldPosition: THREE.Vector3): THREE.Vector3 {
    const dir = worldPosition.clone().sub(this.Center).normalize();
    // Account for noise displacement at this position
    const noise = Math.sin(dir.x * 5) * Math.cos(dir.z * 4) * 0.5
                + Math.sin(dir.y * 7 + dir.x * 3) * 0.3
                + Math.cos(dir.x * 10 + dir.z * 8) * 0.15;
    const r = this.planetRadius + noise;
    return this.Center.clone().add(dir.multiplyScalar(r));
  }

  getSurfaceHeight(worldPosition: THREE.Vector3): number {
    const dir = worldPosition.clone().sub(this.Center).normalize();
    const noise = Math.sin(dir.x * 5) * Math.cos(dir.z * 4) * 0.5
                + Math.sin(dir.y * 7 + dir.x * 3) * 0.3
                + Math.cos(dir.x * 10 + dir.z * 8) * 0.15;
    const r = this.planetRadius + noise;
    return worldPosition.distanceTo(this.Center) - r;
  }

  placeOnSurface(object: THREE.Object3D, lat: number, lon: number, heightOffset: number = 0): void {
    const position = this.latLonToPosition(lat, lon, heightOffset);
    object.position.copy(position);

    const normal = position.clone().sub(this.Center).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    object.quaternion.copy(quaternion);

    (object as any).userData = { isEnvironment: true };
    this.scene.add(object);
  }

  latLonToPosition(lat: number, lon: number, heightOffset: number = 0): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    // Base spherical position
    const baseR = this.planetRadius + heightOffset;
    const x = -(baseR * Math.sin(phi) * Math.cos(theta));
    const z = (baseR * Math.sin(phi) * Math.sin(theta));
    const y = (baseR * Math.cos(phi));

    const dir = new THREE.Vector3(x, y, z).normalize();
    // Apply noise displacement
    const noise = Math.sin(dir.x * 5) * Math.cos(dir.z * 4) * 0.5
                + Math.sin(dir.y * 7 + dir.x * 3) * 0.3
                + Math.cos(dir.x * 10 + dir.z * 8) * 0.15;
    const r = this.planetRadius + noise + heightOffset;

    return new THREE.Vector3(dir.x * r, dir.y * r, dir.z * r);
  }

  positionToLatLon(position: THREE.Vector3): { lat: number; lon: number } {
    const direction = position.clone().sub(this.Center).normalize();
    const lat = 90 - (Math.acos(direction.y) * (180 / Math.PI));
    const lon = (Math.atan2(direction.z, -direction.x) * (180 / Math.PI)) - 180;
    return { lat, lon };
  }

  update(): void {}

  dispose(): void {
    this.scene.remove(this.planetGroup);
  }
}
