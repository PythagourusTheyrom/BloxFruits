/* eslint-disable no-undef */

export class GhostEffect {
    constructor(scene) {
        this.scene = scene;
        this.ghosts = [];
    }

    createGhost(sourceMesh, duration = 0.5) {
        if (!sourceMesh) return;

        const ghost = this.cloneRecursive(sourceMesh);
        if (!ghost) return;

        // Apply Ghost Material
        const ghostMat = new THREE.MeshBasicMaterial({
            color: 0x00FFFF, // Cyan
            transparent: true,
            opacity: 0.6
        });

        ghost.traverse((child) => {
            if (child.isMesh) {
                child.material = ghostMat;
                // Optional: helper to avoid z-fighting or weird artifacts
                child.renderOrder = 999;
            }
        });

        // Add to scene
        this.scene.add(ghost);

        this.ghosts.push({
            mesh: ghost,
            startTime: Date.now(),
            duration: duration * 1000 // ms
        });
    }

    cloneRecursive(obj) {
        let clone;

        // Detect type (Duck typing based on SpeedR)
        if (obj.isMesh) {
            clone = new THREE.Mesh(obj.geometry, obj.material);
        } else if (obj.type === 'Group') {
            clone = new THREE.Group();
        } else if (obj.isPoints) {
            clone = new THREE.Points(obj.geometry, obj.material);
        } else {
            clone = new THREE.Object3D();
        }

        // Transform
        if (clone.position && obj.position) clone.position.copy(obj.position);
        if (clone.scale && obj.scale) clone.scale.copy(obj.scale);

        // Rotation (Euler lacks copy in SpeedR)
        if (clone.rotation && obj.rotation) {
            clone.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
        }

        // Children
        if (obj.children) {
            for (const child of obj.children) {
                const childClone = this.cloneRecursive(child);
                if (childClone) clone.add(childClone);
            }
        }

        return clone;
    }

    update(dt) {
        const now = Date.now();
        for (let i = this.ghosts.length - 1; i >= 0; i--) {
            const g = this.ghosts[i];
            const elapsed = now - g.startTime;
            const progress = elapsed / g.duration;

            if (progress >= 1) {
                // Remove
                this.scene.remove(g.mesh);
                this.ghosts.splice(i, 1);
            } else {
                // Fade
                const opacity = 0.6 * (1 - progress);
                g.mesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = opacity;
                    }
                });
            }
        }
    }
}

export class FloatingText {
    constructor(scene) {
        this.scene = scene;
        this.texts = [];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    spawn(x, y, z, text, color = '#ff0000') {
        const sprite = this.createTextSprite(text, color);
        sprite.position.set(x, y + 2, z);
        this.scene.add(sprite);
        this.texts.push({ mesh: sprite, life: 1.0, velocity: 0.1 });
    }

    createTextSprite(message, color) {
        const fontface = "Arial";
        const fontsize = 60;
        const borderThickness = 4;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;

        context.font = "Bold " + fontsize + "px " + fontface;
        context.fillStyle = color;
        context.textAlign = "center";
        context.lineWidth = borderThickness;
        context.strokeStyle = "white"; // Border

        context.strokeText(message, 128, 64);
        context.fillText(message, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(3, 1.5, 1.0);
        return sprite;
    }

    update(delta) {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.life -= delta;
            t.mesh.position.y += t.velocity;
            t.mesh.material.opacity = t.life;

            if (t.life <= 0) {
                this.scene.remove(t.mesh);
                this.texts.splice(i, 1);
            }
        }
    }
}

export class SpecialEffects {
    constructor(scene) {
        this.scene = scene;
        this.effects = [];
    }

    createPortal(x, y, z, color = 0x8800ff) {
        // Torus Portal
        const geometry = new THREE.TorusGeometry(3, 0.4, 12, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const portal = new THREE.Mesh(geometry, material);
        portal.position.set(x, y + 3, z);

        // Inner Glow (Icosahedron?)
        const innerGeo = new THREE.IcosahedronGeometry(0.5, 0);
        const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        portal.add(inner);

        this.scene.add(portal);

        this.effects.push({
            mesh: portal,
            inner: inner,
            type: 'portal',
            age: 0,
            maxAge: 10.0 // Lasts 10 seconds
        });

        return portal;
    }

    update(dt) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.age += dt;

            if (effect.type === 'portal') {
                // Spin
                effect.mesh.rotation.z += 2.0 * dt;

                // Pulse
                const s = 1.0 + 0.1 * Math.sin(effect.age * 5);
                effect.mesh.scale.set(s, s, s);

                // Inner Float
                if (effect.inner) {
                    effect.inner.rotation.y += dt;
                    effect.inner.rotation.x += dt;
                }
            }

            if (effect.age > effect.maxAge) {
                this.scene.remove(effect.mesh);
                this.effects.splice(i, 1);
            }
        }
    }
}
