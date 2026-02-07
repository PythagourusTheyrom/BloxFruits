export class HitSystem {
    constructor(scene) {
        this.scene = scene;
    }

    showDamage(position, amount) {
        // Create floating text using canvas texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.fillRect(0, 0, 256, 128);

        ctx.font = "bold 60px Arial";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;

        ctx.strokeText("-" + amount, 128, 64);
        ctx.fillText("-" + amount, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);

        sprite.position.copy(position);
        sprite.position.y += 2; // Above head
        sprite.scale.set(3, 1.5, 1);

        this.scene.add(sprite);

        // Animate up and fade
        let age = 0;
        const interval = setInterval(() => {
            age++;
            sprite.position.y += 0.05;
            material.opacity -= 0.02;

            if (age > 50) {
                clearInterval(interval);
                this.scene.remove(sprite);
            }
        }, 16);
    }
}
