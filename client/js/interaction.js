export class InteractionSystem {
    constructor(scene, camera, playerMesh) {
        this.scene = scene;
        this.camera = camera;
        this.playerMesh = playerMesh;
        this.interactables = [];
        this.hoveredObject = null;

        // UI Interaction Hint
        this.hintDiv = document.createElement('div');
        this.hintDiv.style.position = 'absolute';
        this.hintDiv.style.top = '60%';
        this.hintDiv.style.left = '50%';
        this.hintDiv.style.transform = 'translate(-50%, -50%)';
        this.hintDiv.style.color = 'white';
        this.hintDiv.style.fontFamily = 'Arial';
        this.hintDiv.style.fontSize = '20px';
        this.hintDiv.style.fontWeight = 'bold';
        this.hintDiv.style.textShadow = '2px 2px 0 #000';
        this.hintDiv.style.pointerEvents = 'none';
        this.hintDiv.style.display = 'none';
        this.hintDiv.innerText = "Press [E] to Interact";
        document.body.appendChild(this.hintDiv);

        // Input
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e') {
                this.tryInteract();
            }
        });
    }

    register(object, onInteract, label) {
        object.userData.interactable = true;
        object.userData.onInteract = onInteract;
        object.userData.interactionLabel = label || "Interact";
        this.interactables.push(object);
    }

    update() {
        // Simple distance check first (optimisation)
        // Then raycast or proximity check

        // Find closest interactable
        let closest = null;
        let minDist = 5.0; // Interaction range

        for (const obj of this.interactables) {
            const dist = this.playerMesh.position.distanceTo(obj.position);
            if (dist < minDist) {
                minDist = dist;
                closest = obj;
            }
        }

        if (closest) {
            this.hoveredObject = closest;
            this.hintDiv.innerText = `[E] ${closest.userData.interactionLabel}`;
            this.hintDiv.style.display = 'block';
        } else {
            this.hoveredObject = null;
            this.hintDiv.style.display = 'none';
        }
    }

    tryInteract() {
        if (this.hoveredObject && this.hoveredObject.userData.onInteract) {
            this.hoveredObject.userData.onInteract();
        }
    }
}
