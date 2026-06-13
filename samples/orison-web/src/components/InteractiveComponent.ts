import { Component } from '../core/Component';
import { Transform3D } from './Transform3D';
import { RigidBody3D, RigidBodyType } from './RigidBody3D';
import * as THREE from 'three';

export interface InteractiveOptions {
    onActivate?: () => void;
    onDeactivate?: () => void;
    isToggle?: boolean;
    requireContact?: boolean;
}

/**
 * Component for interactive elements like switches, buttons, and pressure plates.
 */
export class InteractiveComponent extends Component {
    private activated: boolean = false;
    private options: InteractiveOptions;
    private originalColor: number = 0x888888;
    private activeColor: number = 0x00ff00;

    constructor(options: InteractiveOptions = {}) {
        super();
        this.options = options;
    }

    get IsActivated(): boolean {
        return this.activated;
    }

    setColors(original: number, active: number): void {
        this.originalColor = original;
        this.activeColor = active;
    }

    activate(): void {
        if (this.options.isToggle) {
            this.activated = !this.activated;
        } else {
            if (this.activated) return;
            this.activated = true;
        }

        this.updateVisuals();

        if (this.activated) {
            this.options.onActivate?.();
        } else {
            this.options.onDeactivate?.();
        }
    }

    deactivate(): void {
        if (this.options.isToggle) return; // Toggle handled in activate
        if (!this.activated) return;
        
        this.activated = false;
        this.updateVisuals();
        this.options.onDeactivate?.();
    }

    private updateVisuals(): void {
        const mesh = this.Entity?.getComponent(THREE.Mesh as any); // Abstracted check
        // In this engine, we'd look for MeshRenderer but Three objects are in Transform3D
        // For simplicity, we'll assume the entity has a renderer or we access via Transform
    }

    trigger(): void {
        this.activate();
    }
}
