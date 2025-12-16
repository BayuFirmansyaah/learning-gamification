import * as THREE from 'three';
import player from './player.js';

class CollectibleSystem {
    constructor() {
        this.scene = null;
        this.coins = [];
        this.totalCoins = 0;
        this.collectedCoins = 0;
        this.collectDistance = 3;
        
        // Coin appearance
        this.coinGeometry = null;
        this.coinMaterial = null;
        
        // Sound effect placeholder
        this.collectSound = null;
    }

    // Initialize collectible system
    init(scene) {
        this.scene = scene;
        this.createCoinGeometry();
        this.spawnCoins();
        this.createUI();
    }

    // Create reusable coin geometry
    createCoinGeometry() {
        this.coinGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 32);
        this.coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3
        });
    }

    // Spawn coins throughout the map
    spawnCoins() {
        // Coin spawn positions - along the road and near checkpoints
        const coinPositions = [];

        // Coins along the main road
        for (let z = -380; z <= 380; z += 25) {
            // Random side of road
            const side = Math.random() > 0.5 ? 1 : -1;
            const offset = 5 + Math.random() * 10;
            coinPositions.push({
                x: side * offset,
                y: 1.5,
                z: z + (Math.random() - 0.5) * 10
            });
        }

        // Coins near buildings (bonus coins)
        for (let z = -300; z <= 300; z += 80) {
            coinPositions.push({ x: -40, y: 1.5, z: z + (Math.random() - 0.5) * 20 });
            coinPositions.push({ x: 40, y: 1.5, z: z + (Math.random() - 0.5) * 20 });
        }

        // Cluster of coins in certain areas
        const clusterCenters = [
            { x: 0, z: 0 },
            { x: -30, z: -200 },
            { x: 30, z: 200 },
            { x: -50, z: 100 },
            { x: 50, z: -100 }
        ];

        clusterCenters.forEach(center => {
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const radius = 8;
                coinPositions.push({
                    x: center.x + Math.cos(angle) * radius,
                    y: 1.5 + i * 0.3, // Stacked height
                    z: center.z + Math.sin(angle) * radius
                });
            }
        });

        // Create coins at positions
        coinPositions.forEach((pos, index) => {
            this.createCoin(pos.x, pos.y, pos.z, index);
        });

        this.totalCoins = this.coins.length;
        console.log(`Spawned ${this.totalCoins} coins`);
    }

    // Create a single coin
    createCoin(x, y, z, index) {
        const coin = new THREE.Mesh(this.coinGeometry, this.coinMaterial.clone());
        coin.position.set(x, y, z);
        coin.rotation.x = Math.PI / 2;
        coin.castShadow = true;
        coin.receiveShadow = true;

        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        coin.add(glow);

        this.scene.add(coin);

        this.coins.push({
            mesh: coin,
            position: new THREE.Vector3(x, y, z),
            collected: false,
            index: index,
            rotationSpeed: 1.5 + Math.random() * 0.5,
            bobPhase: Math.random() * Math.PI * 2,
            baseY: y
        });
    }

    // Create UI for coins
    createUI() {
        const container = document.createElement('div');
        container.id = 'coinContainer';
        container.innerHTML = `
            <div class="coin-display">
                <span class="coin-icon">🪙</span>
                <span id="coinCount">0</span>
                <span class="coin-separator">/</span>
                <span id="coinTotal">${this.totalCoins}</span>
            </div>
            <div class="coin-progress-bar">
                <div id="coinProgressFill" class="coin-progress-fill"></div>
            </div>
        `;
        document.body.appendChild(container);
    }

    // Update coins
    update(time, delta) {
        const playerPos = player.getPosition();

        this.coins.forEach(coin => {
            if (coin.collected) return;

            // Rotation animation
            coin.mesh.rotation.z += coin.rotationSpeed * delta;

            // Bobbing animation
            coin.mesh.position.y = coin.baseY + Math.sin(time * 2 + coin.bobPhase) * 0.3;

            // Glow pulse
            const glow = coin.mesh.children[0];
            if (glow) {
                glow.material.opacity = 0.1 + Math.sin(time * 3 + coin.bobPhase) * 0.08;
            }

            // Check for collection
            const distance = playerPos.distanceTo(coin.mesh.position);
            if (distance < this.collectDistance) {
                this.collectCoin(coin);
            }
        });
    }

    // Collect a coin
    collectCoin(coin) {
        if (coin.collected) return;

        coin.collected = true;
        this.collectedCoins++;

        // Animate collection
        this.animateCollection(coin);

        // Update UI
        this.updateUI();

        // Check for achievements
        this.checkAchievements();
    }

    // Animate coin collection
    animateCollection(coin) {
        const mesh = coin.mesh;
        let scale = 1;
        let opacity = 1;
        let yOffset = 0;

        const animate = () => {
            scale += 0.15;
            opacity -= 0.08;
            yOffset += 0.2;

            mesh.scale.set(scale, scale, scale);
            mesh.position.y = coin.baseY + yOffset;
            
            // Fade out material
            mesh.material.opacity = opacity;
            mesh.material.transparent = true;

            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
        };

        // Create floating "+1" text
        this.showFloatingText(coin.mesh.position);

        animate();
    }

    // Show floating +1 text
    showFloatingText(position) {
        const textDiv = document.createElement('div');
        textDiv.className = 'floating-coin-text';
        textDiv.textContent = '+1 🪙';
        document.body.appendChild(textDiv);

        // Position will be updated in animation
        let frame = 0;
        const maxFrames = 60;

        const animateText = () => {
            frame++;
            const progress = frame / maxFrames;
            
            textDiv.style.opacity = 1 - progress;
            textDiv.style.transform = `translate(-50%, -${50 + progress * 50}px)`;
            
            // Convert 3D position to screen position (approximate)
            textDiv.style.left = '50%';
            textDiv.style.bottom = `${150 + progress * 100}px`;

            if (frame < maxFrames) {
                requestAnimationFrame(animateText);
            } else {
                textDiv.remove();
            }
        };

        animateText();
    }

    // Update UI
    updateUI() {
        const countEl = document.getElementById('coinCount');
        const totalEl = document.getElementById('coinTotal');
        const progressEl = document.getElementById('coinProgressFill');

        if (countEl) {
            countEl.textContent = this.collectedCoins;
            // Add bounce animation
            countEl.classList.remove('coin-bounce');
            void countEl.offsetWidth; // Trigger reflow
            countEl.classList.add('coin-bounce');
        }

        if (totalEl) {
            totalEl.textContent = this.totalCoins;
        }

        if (progressEl) {
            const percent = (this.collectedCoins / this.totalCoins) * 100;
            progressEl.style.width = `${percent}%`;
        }
    }

    // Check for achievements
    checkAchievements() {
        const percent = (this.collectedCoins / this.totalCoins) * 100;

        if (this.collectedCoins === 1) {
            this.showAchievement('Kolektor Pemula!', 'Koin pertama dikumpulkan');
        } else if (this.collectedCoins === 10) {
            this.showAchievement('Pemburu Koin!', '10 koin dikumpulkan');
        } else if (percent >= 50 && percent < 51) {
            this.showAchievement('Setengah Jalan!', '50% koin dikumpulkan');
        } else if (this.collectedCoins === this.totalCoins) {
            this.showAchievement('Master Kolektor!', 'Semua koin dikumpulkan! 🏆');
        }
    }

    // Show achievement notification
    showAchievement(title, description) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement-popup';
        achievement.innerHTML = `
            <div class="achievement-icon">🏅</div>
            <div class="achievement-content">
                <div class="achievement-title">${title}</div>
                <div class="achievement-desc">${description}</div>
            </div>
        `;
        document.body.appendChild(achievement);

        // Animate in
        setTimeout(() => {
            achievement.classList.add('show');
        }, 100);

        // Remove after delay
        setTimeout(() => {
            achievement.classList.remove('show');
            setTimeout(() => achievement.remove(), 500);
        }, 3000);
    }

    // Get collection stats
    getStats() {
        return {
            collected: this.collectedCoins,
            total: this.totalCoins,
            percent: Math.round((this.collectedCoins / this.totalCoins) * 100)
        };
    }
}

const collectibleSystem = new CollectibleSystem();
export default collectibleSystem;
