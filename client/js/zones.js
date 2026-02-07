constructor(scene) {
    this.scene = scene;
    this.zones = [];
    this.currentZone = "Ocean";
    this.setupUI();
}

setupUI() {
    // Create Zone Banner if it doesn't exist
    if (!document.getElementById('zone-banner')) {
        const div = document.createElement('div');
        div.id = 'zone-banner';
        div.style.position = 'absolute';
        div.style.top = '15%'; // Slightly below top
        div.style.width = '100%';
        div.style.textAlign = 'center';
        div.style.fontFamily = "'Cinzel', serif"; // One Piece style font if avail, or generic
        div.style.fontSize = '48px';
        div.style.fontWeight = 'bold';
        div.style.color = '#fff';
        div.style.textShadow = '0 0 10px #000, 0 0 20px #000';
        div.style.opacity = '0';
        div.style.transition = 'opacity 1s, transform 1s';
        div.style.pointerEvents = 'none';
        div.style.zIndex = '1000';
        div.innerText = "";

        // Subtitle for "Discovery"
        const sub = document.createElement('div');
        sub.id = 'zone-sub';
        sub.style.fontSize = '20px';
        sub.style.color = '#ddd';
        sub.style.marginTop = '10px';
        div.appendChild(sub);

        document.body.appendChild(div);
    }
}

addZone(name, x, z, radius, color = '#ffffff', safe = false) {
    this.zones.push({ name, x, z, radius, color, safe });

    // Visuals for Safe Zone
    if (safe && this.scene && SpeedR.RingGeometry) {
        // Forcefield Ring on ground
        const geo = new SpeedR.RingGeometry(radius - 1, radius, 32);
        const mat = new SpeedR.MeshBasicMaterial({
            color: 0x00ff00,
            side: 0, // Double side 
            transparent: true,
            opacity: 0.3
        });
        const ring = new SpeedR.Mesh(geo, mat);
        ring.position.set(x, 0.5, z);
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);

        // Optional: Dome?
        // Transparent Sphere
        const domeGeo = new SpeedR.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new SpeedR.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.1 });
        const dome = new SpeedR.Mesh(domeGeo, domeMat);
        dome.position.set(x, 0, z);
        this.scene.add(dome);
    }
}

isSafeZone() {
    // Check if current zone is safe
    // We can optimize this by caching the current zone object in update()
    if (this.currentZoneData && this.currentZoneData.safe) return true;
    return false;
}

update(position) {
    let newZone = "Open Ocean";
    let zoneData = null;

    for (const zone of this.zones) {
        const dist = Math.sqrt(Math.pow(position.x - zone.x, 2) + Math.pow(position.z - zone.z, 2));
        if (dist <= zone.radius) {
            newZone = zone.name;
            zoneData = zone;
            break; // Assume non-overlapping for now
        }
    }

    this.currentZoneData = zoneData;

    if (newZone !== this.currentZone) {
        this.currentZone = newZone;
        const color = zoneData ? zoneData.color : '#0099ff'; // Default Ocean Blue
        this.showBanner(newZone, color);
    }
}

showBanner(text, color) {
    const banner = document.getElementById('zone-banner');
    const sub = document.getElementById('zone-sub');

    if (!banner) return;

    banner.innerText = text;
    banner.style.color = color;
    banner.style.textShadow = `0 0 10px ${color}, 0 0 20px #000`;

    // Re-add sub since innerText cleared it
    if (sub) {
        banner.appendChild(sub);
        sub.innerText = "— Area Discovered —";
    }

    // Animation
    banner.style.opacity = '1';
    banner.style.transform = 'translateY(0px) scale(1.1)';

    // Fade out
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(-20px) scale(1.0)';
    }, 4000);
}
}
