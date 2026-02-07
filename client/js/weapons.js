export class WeaponFactory {
    static createKatana() {
        const group = new THREE.Group();

        // Handle
        const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
        const handleMat = new THREE.MeshLambertMaterial({ color: 0x222222 }); // Black
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.x = Math.PI / 2;
        handle.position.z = 0.3;
        group.add(handle);

        // Guard
        const guardGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8);
        const guardMat = new THREE.MeshLambertMaterial({ color: 0xD4AF37 }); // Gold
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.rotation.x = Math.PI / 2;
        guard.position.z = 0.6;
        group.add(guard);

        // Blade
        const bladeGeo = new THREE.BoxGeometry(0.05, 2.5, 0.02);
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.1
        });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.rotation.x = Math.PI / 2;
        blade.position.z = 1.85;
        group.add(blade);

        return group;
    }

    static createCutlass() {
        // Curved sword approximation using segments
        const group = new THREE.Group();

        // Handle
        const handleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
        const handleMat = new THREE.MeshLambertMaterial({ color: 0x4B3621 }); // Wood
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.x = Math.PI / 2;
        handle.position.z = 0.25;
        group.add(handle);

        // Guard (Basket style simplified)
        const guardGeo = new THREE.SphereGeometry(0.2, 8, 8, 0, Math.PI);
        const guardMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.6 });
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.rotation.x = -Math.PI / 2;
        guard.position.z = 0.25;
        group.add(guard);

        // Blade segments
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8 });

        // Base
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.02), bladeMat);
        b1.rotation.x = Math.PI / 2;
        b1.position.z = 1.0;
        group.add(b1);

        // Tip (Rotated)
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.02), bladeMat);
        b2.rotation.x = Math.PI / 2 - 0.2; // Curve up
        b2.position.z = 1.8;
        b2.position.y = 0.1;
        group.add(b2);

        return group;
    }

    static createBazooka() {
        const group = new THREE.Group();

        // Main Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 16);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 1.0;
        group.add(barrel);

        // Rear
        const rearGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.5, 16);
        const rear = new THREE.Mesh(rearGeo, barrelMat);
        rear.rotation.x = Math.PI / 2;
        rear.position.z = -0.25;
        group.add(rear);

        // Handle (Perpendicular)
        const handleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
        const handleMat = new THREE.MeshLambertMaterial({ color: 0x5a3a22 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.z = 0.5;
        handle.position.y = -0.4;
        group.add(handle);

        return group;
    }

    static createPipe() {
        const group = new THREE.Group();

        const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 12);
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.5, roughness: 0.7 });
        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.z = 1.0;
        group.add(pipe);

        return group;
    }
}
