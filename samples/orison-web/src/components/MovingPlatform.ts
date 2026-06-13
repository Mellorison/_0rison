import { Component } from '../core/Component';
import { Transform3D } from './Transform3D';
import { RigidBody3D } from './RigidBody3D';
import * as THREE from 'three';

/**
 * Component for platforms that move between points.
 */
export class MovingPlatform extends Component {
    private startPos: THREE.Vector3 = new THREE.Vector3();
    private endPos: THREE.Vector3 = new THREE.Vector3();
    private speed: number = 2;
    private progress: number = 0;
    private direction: number = 1;
    private active: boolean = true;
    private waitTime: number = 1;
    private currentWait: number = 0;

    constructor(endOffset: THREE.Vector3, speed: number = 2) {
        super();
        this.speed = speed;
        this.endPos.copy(endOffset);
    }

    override added(): void {
        const transform = this.Entity?.getComponent(Transform3D);
        if (transform) {
            this.startPos.copy(transform.Position);
            this.endPos.add(this.startPos);
        }
    }

    setActive(active: boolean): void {
        this.active = active;
    }

    override update(deltaTime: number): void {
        if (!this.active) return;

        if (this.currentWait > 0) {
            this.currentWait -= deltaTime;
            return;
        }

        this.progress += (this.speed * deltaTime * this.direction) / this.startPos.distanceTo(this.endPos);
        
        if (this.progress >= 1) {
            this.progress = 1;
            this.direction = -1;
            this.currentWait = this.waitTime;
        } else if (this.progress <= 0) {
            this.progress = 0;
            this.direction = 1;
            this.currentWait = this.waitTime;
        }

        const transform = this.Entity?.getComponent(Transform3D);
        const rb = this.Entity?.getComponent(RigidBody3D);

        if (transform) {
            const newPos = new THREE.Vector3().lerpVectors(this.startPos, this.endPos, this.progress);
            
            if (rb) {
                // For kinematic bodies, we should set translation
                rb.setTranslation(newPos, true);
            } else {
                transform.setPosition(newPos.x, newPos.y, newPos.z);
            }
        }
    }
}
