export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    emit(position, typeOrCount, color = 0xffffff) {
        if (typeOrCount === 'jump') {
            for (let i = 0; i < 5; i++) {
                this.spawnParticle(position, 0xdddddd);
            }
        } else if (typeof typeOrCount === 'number') {
            const count = typeOrCount;
            for (let i = 0; i < count; i++) {
                this.spawnParticle(position, color);
            }
        }
    }

    spawnParticle(position, color) {
        const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
        const mesh = new THREE.Mesh(geo, mat);

        // Spawn at pos
        mesh.position.copy(position);

        // Random Offset
        mesh.position.x += (Math.random() - 0.5) * 1.0;
        mesh.position.y += (Math.random() - 0.5) * 1.0;
        mesh.position.z += (Math.random() - 0.5) * 1.0;

        this.scene.add(mesh);

        this.particles.push({
            mesh: mesh,
            life: 0.8, // seconds
            velocity: new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(2)
        });
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime;

            p.mesh.position.addScaledVector(p.velocity, deltaTime);
            p.mesh.rotation.x += deltaTime * 5;
            p.mesh.rotation.y += deltaTime * 5;
            p.mesh.scale.multiplyScalar(0.9); // Shrink

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }
    }
}
