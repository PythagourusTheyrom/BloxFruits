import { WeaponFactory } from './weapons.js';

export class Combat {
    constructor(playerMesh, socket) {
        this.playerMesh = playerMesh;
        this.socket = socket;
        this.isAttacking = false;
        this.weaponType = "melee";
        this.currentWeaponMesh = null;

        // Initial setup
        this.setWeapon("melee");
    }

    setWeapon(type) {
        this.weaponType = type;
        console.log("Switched to " + type);

        // Remove old weapon
        if (this.currentWeaponMesh) {
            this.playerMesh.remove(this.currentWeaponMesh);
            this.currentWeaponMesh = null;
        }

        // Create new weapon
        let mesh = null;
        if (type === "katana") {
            mesh = WeaponFactory.createKatana();
            mesh.position.set(0.6, 1, 0.5); // Adjusted for humanoid hand position
            mesh.rotation.x = Math.PI / 2;
        } else if (type === "cutlass") {
            mesh = WeaponFactory.createCutlass();
            mesh.position.set(0.6, 1, 0.5);
            mesh.rotation.x = Math.PI / 2;
        } else if (type === "bazooka") {
            mesh = WeaponFactory.createBazooka();
            mesh.position.set(0.2, 1.5, 0); // Shoulder
        } else if (type === "pipe") {
            mesh = WeaponFactory.createPipe();
            mesh.position.set(0.6, 1, 0.5);
            mesh.rotation.x = Math.PI / 2;
        }

        if (mesh) {
            this.currentWeaponMesh = mesh;
            this.playerMesh.add(mesh);
        }

        // Sync to Server
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'set_weapon',
                weapon: type
            }));
        }
    }

    attack() {
        if (this.isAttacking) return;
        this.isAttacking = true;

        console.log(`Attack with ${this.weaponType}!`);

        // Attack Animation
        if (this.currentWeaponMesh) {
            this.animateModel();
        } else {
            // Fallback for melee (fist)
            this.animateMelee();
        }

        // Client-side Hit Simulation (Visual Only for now)
        this.checkHit();

        // Send Attack to Server
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'attack',
                weapon: this.weaponType
            }));
        }
    }

    checkHit() {
        const scene = this.playerMesh.parent;
        if (!scene) return;

        // Optimization: Collect ONLY valid targets (Players, NPCs, Bosses)
        const targets = [];
        scene.traverse((obj) => {
            if (obj.userData && (obj.userData.type === 'npc' || obj.userData.type === 'player' || obj.userData.type === 'boss')) {
                targets.push(obj);
            }
        });

        const raycaster = new THREE.Raycaster();
        const origin = this.playerMesh.position.clone();
        origin.y += 1.0;

        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.playerMesh.quaternion);

        raycaster.set(origin, direction);

        const intersects = raycaster.intersectObjects(targets, true);

        for (const hit of intersects) {
            const range = (this.weaponType === "bazooka" || this.weaponType === "gun") ? 20 : 6;
            if (hit.distance > range) continue;

            let obj = hit.object;
            while (obj.parent && obj.parent !== scene) {
                obj = obj.parent;
            }

            if (obj === this.playerMesh) continue;

            if (obj.userData && (obj.userData.type === 'npc' || obj.userData.type === 'player' || obj.userData.type === 'boss')) {
                const hitPos = obj.position.clone();
                const amt = Math.floor(Math.random() * 20) + 10;

                const evt = new CustomEvent('playerHit', {
                    detail: { pos: hitPos, amt: amt }
                });
                window.dispatchEvent(evt);

                if (obj.userData.type === 'boss' && obj.userData.hpBar) {
                    obj.userData.hp -= amt;
                }

                return;
            }
        }
    }

    animateModel() {
        const mesh = this.currentWeaponMesh;
        if (!mesh) return;

        const isGun = this.weaponType === "bazooka";

        if (isGun) {
            const originalZ = mesh.position.z;
            mesh.position.z -= 0.2;
            const flash = new THREE.PointLight(0xffaa00, 5, 5);
            flash.position.set(0, 0, 2.5);
            mesh.add(flash);
            setTimeout(() => {
                mesh.position.z = originalZ;
                mesh.remove(flash);
                this.isAttacking = false;
            }, 150);
        } else {
            // Cool Random Animations
            this.isAttacking = true;
            const type = Math.floor(Math.random() * 3);
            const startRot = mesh.rotation.clone();
            const startPos = mesh.position.clone();

            let progress = 0;
            const animateSwing = () => {
                progress += 0.15;
                if (type === 0) { // Vertical
                    mesh.rotation.x = startRot.x + (Math.sin(progress * Math.PI) * 1.5);
                } else if (type === 1) { // Horizontal
                    mesh.rotation.z = startRot.z + (Math.sin(progress * Math.PI) * 1.5);
                    mesh.position.x = startPos.x - (Math.sin(progress * Math.PI) * 0.5);
                } else { // Stab
                    mesh.position.z = startPos.z - (Math.sin(progress * Math.PI) * 1.0);
                }

                if (progress < 1) {
                    requestAnimationFrame(animateSwing);
                } else {
                    mesh.rotation.copy(startRot);
                    mesh.position.copy(startPos);
                    this.isAttacking = false;
                }
            };
            animateSwing();
        }
    }

    animateMelee() {
        // Safe Color Flashing for Groups
        this.flashColor(0xffffff);
        setTimeout(() => {
            this.resetColor();
            this.isAttacking = false;
        }, 200);
    }

    flashColor(hex) {
        if (!this.playerMesh) return;

        // Helper to flash all children materials
        this.playerMesh.traverse((child) => {
            if (child.isMesh && child.material) {
                // Save old if not saved
                if (!child.userData.oldColor) {
                    child.userData.oldColor = child.material.color.getHex();
                }
                child.material.color.setHex(hex);
            }
        });
    }

    resetColor() {
        if (!this.playerMesh) return;
        this.playerMesh.traverse((child) => {
            if (child.isMesh && child.material && child.userData.oldColor !== undefined) {
                child.material.color.setHex(child.userData.oldColor);
            }
        });
    }
}
