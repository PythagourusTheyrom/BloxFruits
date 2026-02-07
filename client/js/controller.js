import { SpeedR as THREE } from './SpeedR.js';

export class CharacterController {
    constructor(playerMesh, canvas, physicsScene) {
        this.mesh = playerMesh;
        this.canvas = canvas;
        this.physics = physicsScene; // Physics instance

        // Settings
        this.walkSpeed = 10.0;
        this.runSpeed = 16.0;
        this.dashSpeed = 40.0; // Fast burst
        this.jumpForce = 12.0;
        this.gravity = 30.0;
        this.airControl = 0.3; // Multiplier for movement in air

        // Double Jump FX
        this.geppoCooldown = 0;

        // State
        this.velocity = new THREE.Vector3();
        this.isGrounded = false;
        this.coyoteTime = 0; // Time since left ground
        this.coyoteDuration = 0.15; // 150ms buffer
        this.jumpBuffer = 0;

        // Dash State
        this.isDashing = false;
        this.dashTime = 0;
        this.dashDuration = 0.2; // 200ms dash
        this.dashCooldown = 0;
        this.lastDashTime = 0;

        // Double Jump State
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;

        // Input State
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            run: false,
            dash: false
        };

        this.setupInput();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => this.onKey(e, true));
        window.addEventListener('keyup', (e) => this.onKey(e, false));
    }

    onKey(e, pressed) {
        switch (e.code) {
            case 'KeyW': this.input.forward = pressed; break;
            case 'KeyS': this.input.backward = pressed; break;
            case 'KeyA': this.input.left = pressed; break;
            case 'KeyD': this.input.right = pressed; break;
            case 'Space':
                if (pressed) this.input.jump = true;
                // Only register press, logic handles reset
                break;
            case 'ShiftLeft': this.input.run = pressed; break;
            case 'KeyQ': if (pressed) this.input.dash = true; break;
        }
    }

    update(deltaTime, camera) {
        const now = Date.now() / 1000;

        // 1. Calculate Desired Direction relative to Camera
        const moveDir = new THREE.Vector3();
        if (this.input.forward) moveDir.z -= 1;
        if (this.input.backward) moveDir.z += 1;
        if (this.input.left) moveDir.x -= 1;
        if (this.input.right) moveDir.x += 1;

        // Normalize inputs
        if (moveDir.lengthSq() > 0) moveDir.normalize();

        // Rotate input to Camera Yaw
        if (camera) {
            const camEuler = new THREE.Euler(0, camera.rotation.y, 0);
            moveDir.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(camEuler));
        }

        // 2. Dash Logic
        if (this.input.dash && !this.isDashing && now - this.lastDashTime > 1.0) { // 1s CD
            this.isDashing = true;
            this.dashTime = this.dashDuration;
            this.lastDashTime = now;
            this.input.dash = false; // Consume input

            // Ghost Effect Trigger
            if (window.ghostEffect) window.ghostEffect.trigger(this.mesh, 0.5);

            // Dash towards moveDir or forward if idle
            if (moveDir.lengthSq() === 0) {
                // Dash forward relative to mesh
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
                this.velocity.x = forward.x * this.dashSpeed;
                this.velocity.z = forward.z * this.dashSpeed;
            } else {
                this.velocity.x = moveDir.x * this.dashSpeed;
                this.velocity.z = moveDir.z * this.dashSpeed;
            }
            // Light Dash Trail
            if (window.particleSystem) {
                window.particleSystem.emit(this.mesh.position, 10, 0x00FFFF);
            }
            // Slight vertical boost?
            this.velocity.y = 2.0;
        }

        if (this.isDashing) {
            this.dashTime -= deltaTime;
            if (this.dashTime <= 0) {
                this.isDashing = false;
                // Dampen velocity after dash
                this.velocity.x *= 0.5;
                this.velocity.z *= 0.5;
            } else {
                // Maintain Dash Velocity? Or let drag handle it?
                // Let's force movement during dash to ignore friction/air control
                // Already set in impulse, let's just skip normal movement logic
            }
        }

        // 3. Normal Movement (if not dashing)
        if (!this.isDashing) {
            let speed = this.input.run ? this.runSpeed : this.walkSpeed;

            if (this.isGrounded) {
                // Reset Double Jump
                this.canDoubleJump = true;
                this.hasDoubleJumped = false;

                this.velocity.x = moveDir.x * speed;
                this.velocity.z = moveDir.z * speed;
            } else {
                // Air Control
                const airAccel = 20.0 * deltaTime;
                this.velocity.x += moveDir.x * airAccel;
                this.velocity.z += moveDir.z * airAccel;

                // Simple Air Drag
                this.velocity.x *= 0.95;
                this.velocity.z *= 0.95;
            }
        }

        // 4. Jump Logic
        if (this.isGrounded) {
            this.coyoteTime = this.coyoteDuration;
        } else {
            this.coyoteTime -= deltaTime;
        }

        if (this.input.jump) {
            this.jumpBuffer = 0.1;
            this.input.jump = false;
        }
        if (this.jumpBuffer > 0) this.jumpBuffer -= deltaTime;

        // Ground Jump
        if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
            this.velocity.y = this.jumpForce;
            this.coyoteTime = 0;
            this.jumpBuffer = 0;
            this.isGrounded = false;
        }
        // Double Jump
        else if (this.jumpBuffer > 0 && !this.isGrounded && this.canDoubleJump && !this.hasDoubleJumped) {
            this.velocity.y = this.jumpForce * 1.2; // Slightly higher
            this.hasDoubleJumped = true;
            this.jumpBuffer = 0;

            // Geppo FX (Sky Walk)
            if (SpeedR.FX && SpeedR.FX.createFloatingText) {
                // Actually use custom ring effect if possible, or simple particle
                // Manually create ring for now since FX lib is limited
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(1, 0.1, 8, 16),
                    new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.8 })
                );
                ring.rotation.x = Math.PI / 2;
                ring.position.copy(this.mesh.position);
                ring.position.y -= 0.5;
                this.mesh.parent.add(ring); // Add to scene

                // Animate expansion
                const animate = () => {
                    ring.scale.x += 0.2;
                    ring.scale.y += 0.2;
                    ring.material.opacity -= 0.1;
                    if (ring.material.opacity <= 0) {
                        this.mesh.parent.remove(ring);
                    } else {
                        requestAnimationFrame(animate);
                    }
                };
                requestAnimationFrame(animate);
            }
        }
    }

        // 5. Physics Update
        this.velocity.y -= this.gravity * deltaTime;

const deltaPos = this.velocity.clone().multiplyScalar(deltaTime);
const nextPos = this.mesh.position.clone().add(deltaPos);

const results = this.physics.resolveMovement(this.mesh.position, nextPos, this.velocity);

this.mesh.position.copy(results.position);
this.velocity.copy(results.velocity);
this.isGrounded = results.isGrounded;

// 6. Rotate Character
if (moveDir.lengthSq() > 0.1 && !this.isDashing) {
    const targetRot = Math.atan2(moveDir.x, moveDir.z);
    // Normalize angle for shortest path
    let currRot = this.mesh.rotation.y;
    // Ensure both are positive 0-2PI or similar range
    // Actually just diff logic:
    let diff = targetRot - currRot;
    while (diff <= -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    this.mesh.rotation.y += diff * 10 * deltaTime;
}
    }
}
