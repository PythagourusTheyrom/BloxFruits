import { SpeedR as THREE } from './SpeedR.js';

export class CameraControl {
    constructor(camera, target, canvas) {
        this.camera = camera;
        this.target = target; // Mesh to follow
        this.domElement = canvas;

        // Settings
        this.distance = 10.0;
        this.minDistance = 2.0;
        this.maxDistance = 20.0;
        this.height = 2.0; // Height offset from target center
        this.smoothSpeed = 0.1;
        this.zoomSpeed = 1.0;
        this.rotateSpeed = 0.005;

        // Spherical Coordinates
        this.theta = 0; // Horizontal angle (radians)
        this.phi = Math.PI / 4; // Vertical angle (radians) (45 degrees)

        // Mouse State
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.setupInput();

        // Current Position (for smoothing)
        this.currentPos = camera.position.clone();
    }

    setupInput() {
        this.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Right Click
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;

                this.theta -= deltaX * this.rotateSpeed;
                this.phi -= deltaY * this.rotateSpeed;

                // Clamp Phi (Don't go below ground or flip over)
                const minPhi = 0.1;
                const maxPhi = Math.PI / 2 - 0.1;
                this.phi = Math.max(minPhi, Math.min(maxPhi, this.phi));

                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        // Prevent Context Menu
        this.domElement.addEventListener('contextmenu', e => e.preventDefault());

        // Zoom
        this.domElement.addEventListener('wheel', (e) => {
            if (e.deltaY > 0) this.distance += this.zoomSpeed;
            else this.distance -= this.zoomSpeed;

            this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
        });
    }

    update(deltaTime) {
        if (!this.target) return;

        // Calculate Target Position (Spherical to Cartesian)
        // Camera Position relative to Target
        const offsetX = this.distance * Math.sin(this.theta) * Math.cos(this.phi);
        const offsetY = this.distance * Math.sin(this.phi);
        const offsetZ = this.distance * Math.cos(this.theta) * Math.cos(this.phi);

        // Target Center
        const targetPos = this.target.position.clone();
        targetPos.y += this.height;

        // Ideal Camera Position
        const idealPos = new THREE.Vector3(
            targetPos.x + offsetX,
            targetPos.y + offsetY,
            targetPos.z + offsetZ
        );

        // Smooth Lerp
        this.currentPos.lerp(idealPos, 0.2); // Smooth factor

        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(targetPos);
    }
}
