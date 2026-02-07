export class InventorySystem {
    constructor() {
        this.items = [];
        this.maxSlots = 5;
        this.selectedSlot = 0;

        // Setup UI
        this.container = document.getElementById('hotbar-container');
        this.render();

        // Input
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const key = parseInt(e.key);
            if (!isNaN(key) && key >= 1 && key <= this.maxSlots) {
                this.selectSlot(key - 1);
            }
        });
    }

    addItem(name) {
        if (this.items.length < this.maxSlots) {
            this.items.push(name);
            this.render();
            // Select newly added item if none selected?
            if (this.items.length === 1) this.selectSlot(0);
        } else {
            console.log("Inventory Full!");
        }
    }

    selectSlot(index) {
        if (index < 0 || index >= this.maxSlots) return;
        this.selectedSlot = index;
        this.render();

        const item = this.items[index];
        if (item) {
            // Equip Logic
            console.log(`Equipping ${item}`);
            // Send to server
            if (window.socket && window.socket.readyState === WebSocket.OPEN) {
                window.socket.send(JSON.stringify({
                    type: 'equip',
                    item: item
                }));
            }
        }
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        for (let i = 0; i < this.maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            if (i === this.selectedSlot) slot.classList.add('selected');

            const item = this.items[i];
            if (item) {
                // Icon or Text
                slot.innerText = item.substring(0, 2).toUpperCase(); // Initials
                const label = document.createElement('span');
                label.className = 'slot-label';
                label.innerText = item;
                slot.appendChild(label);
            }

            const keyLabel = document.createElement('span');
            keyLabel.className = 'key-hint';
            keyLabel.innerText = (i + 1);
            slot.appendChild(keyLabel);

            slot.onclick = () => this.selectSlot(i);

            this.container.appendChild(slot);
        }
    }
}


export class QuestTracker {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'quest-tracker';
        this.container.style.cssText = `
            position: absolute;
            top: 200px;
            left: 20px;
            background: rgba(0,0,0,0.5);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            display: none;
            width: 250px;
        `;
        document.body.appendChild(this.container);

        this.title = document.createElement('h3');
        this.title.style.margin = '0 0 5px 0';
        this.title.style.color = '#FFA500';
        this.title.innerText = 'Current Quest';
        this.container.appendChild(this.title);

        this.desc = document.createElement('div');
        this.desc.style.marginBottom = '5px';
        this.container.appendChild(this.desc);

        this.progress = document.createElement('div');
        this.progress.style.color = '#00FF00';
        this.container.appendChild(this.progress);

        this.active = false;
    }

    setQuest(title, description, current, max) {
        this.container.style.display = 'block';
        this.active = true;
        this.title.innerText = title;
        this.desc.innerText = description;
        this.updateProgress(current, max);
    }

    updateProgress(current, max) {
        this.progress.innerText = `Progress: ${current} / ${max}`;
        if (current >= max) {
            this.progress.innerText = "COMPLETED!";
            this.progress.style.color = 'gold';
            setTimeout(() => this.hide(), 5000);
        }
    }

    hide() {
        this.container.style.display = 'none';
        this.active = false;
    }
}
