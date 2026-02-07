export class Physics {
    constructor(scene) {
        this.scene = scene;
        this.colliders = []; // Objects to collide with (Walls)
        this.groundObjects = []; // Objects to walk on (Islands, Boats, Floor)
        this.raycaster = new THREE.Raycaster();
        this.down = new THREE.Vector3(0, -1, 0);

        this.gravity = 20.0;
        this.baseJumpForce = 8.0; // Modified: renamed to base
        this.jumpForce = 8.0;
        this.verticalVelocity = 0;
        this.isGrounded = false;
    }

    addCollider(mesh) {
        // Wall
        const box = new THREE.Box3().setFromObject(mesh);
        this.colliders.push({ mesh, box });
    }

    addGround(mesh) {
        // Floor
        this.groundObjects.push(mesh);
    }

    update(playerMesh, deltaTime, input, canWalkOnWater = false, isFlying = false, canDoubleJump = false, lowGravity = false, superJump = false) {
        if (superJump) {
            this.jumpForce = 15.0; // Higher jump
        } else {
            this.jumpForce = 8.0;
        }
        if (isFlying) {
            // Flight Logic
            // Go where looking? Or just hover?
            this.verticalVelocity = 0;
            this.isGrounded = false;

            // Simple flight: Use Jump/Crouch to move up/down?
            // Or just defy gravity
            if (input.jump) {
                playerMesh.position.y += 10 * deltaTime;
            }
            // Gravity is disabled
            return;
        }

        // 1. Apply Gravity
        let appliedGravity = this.gravity;
        if (lowGravity) {
            appliedGravity = this.gravity * 0.2; // 20% gravity
        }
        this.verticalVelocity -= appliedGravity * deltaTime;

        // 2. Predict next vertical position
        let nextY = playerMesh.position.y + (this.verticalVelocity * deltaTime);

        // 3. Ground Detection via Raycast
        // Start ray slightly above player's feet
        const origin = playerMesh.position.clone();
        origin.y += 1.0; // Waist height

        this.raycaster.set(origin, this.down);

        // Check intersections with islands/boats
        const intersects = this.raycaster.intersectObjects(this.groundObjects, true); // Recursive for groups

        let groundHeight = -100; // Abyss
        let hitGround = false;

        if (intersects.length > 0) {
            // Find highest ground below us
            for (let hit of intersects) {
                if (hit.distance < 10) { // Only care if close
                    // hit.point.y is the floor height
                    if (hit.point.y > groundHeight) {
                        groundHeight = hit.point.y;
                        hitGround = true;
                    }
                }
            }
        }

        // Snap Threshold
        if (hitGround && nextY <= groundHeight) {
            nextY = groundHeight;
            this.verticalVelocity = 0;
            this.isGrounded = true;
            this.jumpCount = 0; // Reset jump count when grounded
        } else if (canWalkOnWater && nextY < 2.0) {
            // Float on water if Ice User
            nextY = 2.0;
            this.verticalVelocity = 0;
            this.isGrounded = true;
            this.jumpCount = 0; // Reset jump count when grounded
        } else {
            this.isGrounded = false;
        }

        // 4. Jump
        if (input.jump) {
        }

        if (!input.jump) {
            this.jumpLocked = false; // Reset lock when key released
        }

        // Apply Y
        playerMesh.position.y = nextY;
    }

    resolveMovement(currentPos, nextPos, velocity) {
        // This replaces the old 'update' logic with a resolver for the Controller
        let finalPos = nextPos.clone();
        let finalVel = velocity.clone();
        let isGrounded = false;

        // 1. Ground Collision
        // Raycast down from slightly above feet
        const rayOrigin = currentPos.clone();
        rayOrigin.y += 1.0;
        this.raycaster.set(rayOrigin, this.down);

        const intersects = this.raycaster.intersectObjects(this.groundObjects, true);

        // Find closest ground
        let groundY = -100;
        let groundHit = false;

        for (let hit of intersects) {
            // Distance check: relative to rayOrigin
            // rayOrigin is at y+1. An intersection at feet level is dist=1.
            // An intersection slightly below feet (next frame) is dist > 1.

            // If we are falling, we check if we will pass through ground
            // currentY = 0. nextY = -1. Ground at 0.
            // Ray from +1. 

            // We only snap if we are close enough
            if (hit.distance < 2.0 && hit.point.y > groundY) {
                groundY = hit.point.y;
                groundHit = true;
            }
        }

        // Check if we hit ground
        if (groundHit) {
            // If we are below ground or about to be
            if (finalPos.y <= groundY + 0.05) { // Small epsilon
                finalPos.y = groundY;
                if (finalVel.y < 0) finalVel.y = 0;
                isGrounded = true;
            }
        }

        // 2. Wall Collision (Horizontal)
        // Check X/Z separately? Or Sphere cast?
        // Simple Box check for now using 'checkCollision' logic but corrected

        // We need to check if 'finalPos' is inside a wall.
        // If so, revert or slide.

        if (this.checkCollision(null, finalPos)) {
            // Collision detected!
            // Simple: Revert horizontal movement but keep vertical?
            // Or Slide.

            // Try step back X
            const tryX = finalPos.clone();
            tryX.x = currentPos.x;
            if (!this.checkCollision(null, tryX)) {
                finalPos.x = currentPos.x;
                finalVel.x = 0;
            } else {
                // Try step back Z
                const tryZ = finalPos.clone();
                tryZ.z = currentPos.z;
                if (!this.checkCollision(null, tryZ)) {
                    finalPos.z = currentPos.z;
                    finalVel.z = 0;
                } else {
                    // Still stuck? Revert both
                    finalPos.x = currentPos.x;
                    finalPos.z = currentPos.z;
                    finalVel.x = 0;
                    finalVel.z = 0;
                }
            }
        }

        return {
            position: finalPos,
            velocity: finalVel,
            isGrounded: isGrounded
        };
    }

    checkCollision(playerMesh, potentialPosition) {
        // Horizontal Wall Collision
        // ... (Keep existing simple logic or improve) ...
        const size = new THREE.Vector3(1, 2, 1); // Approx size
        const playerBox = new THREE.Box3();
        playerBox.setFromCenterAndSize(potentialPosition, size);

        for (const collider of this.colliders) {
            const colBox = new THREE.Box3().setFromObject(collider.mesh);
            if (playerBox.intersectsBox(colBox)) {
                return true;
            }
        }
        return false;
    }
}
