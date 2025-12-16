import * as THREE from 'three';
import buildingsManager from './buildings.js';
import player from './player.js';
import ui from './ui.js';
import assetLoader from './assetLoader.js';

class CheckpointSystem {
    constructor() {
        this.scene = null;
        this.checkpoints = [];
        this.completedCheckpoints = new Set();
        this.currentCheckpoint = null;
        this.triggerDistance = 15; // Distance to trigger checkpoint (scaled)
        this.characters = []; // Store character meshes for animation
    }

    // Initialize checkpoint system
    init(scene) {
        this.scene = scene;
    }

    // Create checkpoints for all buildings
    createCheckpoints() {
        const buildings = buildingsManager.getBuildings();
        
        // Learning topics for each checkpoint - all use the same YouTube video
        const topics = [
            { name: 'Pengenalan Bilangan', videoId: 'eQv10AP5BG0' },
            { name: 'Penjumlahan Dasar', videoId: 'eQv10AP5BG0' },
            { name: 'Pengurangan Dasar', videoId: 'eQv10AP5BG0' },
            { name: 'Perkalian', videoId: 'eQv10AP5BG0' },
            { name: 'Pembagian', videoId: 'eQv10AP5BG0' },
            { name: 'Pecahan', videoId: 'eQv10AP5BG0' },
            { name: 'Geometri Dasar', videoId: 'eQv10AP5BG0' },
            { name: 'Pengukuran', videoId: 'eQv10AP5BG0' },
            { name: 'Statistika Dasar', videoId: 'eQv10AP5BG0' },
            { name: 'Aljabar Pengenalan', videoId: 'eQv10AP5BG0' },
            { name: 'Bilangan Desimal', videoId: 'eQv10AP5BG0' },
            { name: 'Perbandingan', videoId: 'eQv10AP5BG0' }
        ];

        buildings.forEach((building, index) => {
            const topic = topics[index % topics.length];
            
            // Create trigger zone in front of building
            const triggerPosition = this.calculateTriggerPosition(building);
            
            const checkpoint = {
                id: index,
                buildingInfo: building,
                topicName: topic.name,
                videoId: topic.videoId,
                position: triggerPosition,
                completed: false
            };

        // Create visible marker (optional - for debugging/visibility)
        this.createCheckpointMarker(checkpoint);
        
        // Create character at checkpoint
        this.createCheckpointCharacter(checkpoint);
        
        this.checkpoints.push(checkpoint);
        });

        console.log(`Created ${this.checkpoints.length} checkpoints`);
    }

    // Calculate trigger position in front of building
    calculateTriggerPosition(building) {
        const offset = building.side === 'left' ? 20 : -20;
        return new THREE.Vector3(
            building.position.x + offset,
            0,
            building.position.z
        );
    }

    // Create visible checkpoint marker
    createCheckpointMarker(checkpoint) {
        // Create glowing ring on ground - scaled up
        const ringGeometry = new THREE.RingGeometry(6, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(checkpoint.position);
        ring.position.y = 0.1;
        
        checkpoint.marker = ring;
        this.scene.add(ring);

        // Create floating indicator - scaled up
        const indicatorGeometry = new THREE.ConeGeometry(1.5, 3, 4);
        const indicatorMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7
        });
        
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.copy(checkpoint.position);
        indicator.position.y = 15;
        indicator.rotation.x = Math.PI;
        
        checkpoint.indicator = indicator;
        this.scene.add(indicator);

        // Create 3D text label showing topic name
        this.createTextLabel(checkpoint);
    }

    // Create 3D text label for checkpoint
    createTextLabel(checkpoint) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;

        // Background with rounded corners
        context.fillStyle = 'rgba(0, 100, 0, 0.85)';
        this.roundRect(context, 10, 10, 492, 108, 20);
        context.fill();

        // Border
        context.strokeStyle = '#00ff00';
        context.lineWidth = 4;
        this.roundRect(context, 10, 10, 492, 108, 20);
        context.stroke();

        // Text - Topic name
        context.fillStyle = '#ffffff';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Wrap text if too long
        const maxWidth = 460;
        const text = checkpoint.topicName;
        context.fillText(text, 256, 45, maxWidth);

        // Sub text
        context.font = '24px Arial';
        context.fillStyle = '#aaffaa';
        context.fillText('📚 Klik untuk belajar', 256, 85);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });

        // Create sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(checkpoint.position);
        sprite.position.y = 8; // Lower position, closer to ground
        sprite.scale.set(20, 5, 1); // Adjust size

        checkpoint.label = sprite;
        this.scene.add(sprite);
    }

    // Helper function to draw rounded rectangle
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // Create character at checkpoint
    createCheckpointCharacter(checkpoint) {
        const characterAssets = assetLoader.getCharacters();
        
        if (characterAssets.length === 0) {
            console.warn('No character assets found');
            return;
        }

        // Pick a random character for variety (skip character-a which is the player)
        const charIndex = (checkpoint.id % (characterAssets.length - 1)) + 1;
        const randomChar = characterAssets[charIndex % characterAssets.length];
        const characterModel = assetLoader.cloneModel(randomChar);

        if (characterModel) {
            // Create a group to hold the character for easier animation
            const character = new THREE.Group();
            const bodyGroup = new THREE.Group();
            
            // Scale character same as player (1.5)
            characterModel.scale.set(1.5, 1.5, 1.5);
            bodyGroup.add(characterModel);
            character.add(bodyGroup);
            
            // Create a visual arm for waving (since blocky characters don't have separate arm bones)
            const armGroup = new THREE.Group();
            armGroup.position.set(0.6, 2.2, 0); // Position at shoulder
            
            const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
            const armMaterial = new THREE.MeshStandardMaterial({ color: 0xf5d0a9 });
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            arm.position.y = 0.4; // Pivot from shoulder
            arm.castShadow = true;
            armGroup.add(arm);
            
            // Add hand
            const handGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const hand = new THREE.Mesh(handGeometry, armMaterial);
            hand.position.y = 0.85;
            hand.castShadow = true;
            armGroup.add(hand);
            
            character.add(armGroup);
            
            // Position character next to the checkpoint
            const offsetX = checkpoint.buildingInfo.side === 'left' ? 8 : -8;
            character.position.set(
                checkpoint.position.x + offsetX,
                0,
                checkpoint.position.z
            );
            
            // Face towards the road/player
            character.rotation.y = checkpoint.buildingInfo.side === 'left' ? -Math.PI / 4 : Math.PI / 4;

            // Store reference for animation
            checkpoint.character = character;
            
            // Enable shadows on model
            characterModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Add character info for animation
            this.characters.push({
                mesh: character,
                bodyGroup: bodyGroup,
                armGroup: armGroup,
                checkpoint: checkpoint,
                wavePhase: Math.random() * Math.PI * 2, // Random starting phase
                baseY: 0
            });

            this.scene.add(character);
        }
    }

    // Update checkpoint indicators animation
    updateIndicators(time) {
        this.checkpoints.forEach(checkpoint => {
            if (!checkpoint.completed) {
                // Bobbing animation for indicator
                if (checkpoint.indicator) {
                    checkpoint.indicator.position.y = 15 + Math.sin(time * 3) * 1.5;
                    checkpoint.indicator.rotation.y = time * 2;
                }
                // Gentle bobbing for label - lower position
                if (checkpoint.label) {
                    checkpoint.label.position.y = 8 + Math.sin(time * 2) * 0.3;
                }
            }
        });

        // Animate characters (waving motion)
        this.characters.forEach(charInfo => {
            if (charInfo.checkpoint.completed) {
                // Hide completed checkpoint characters or make them idle
                if (charInfo.armGroup) {
                    charInfo.armGroup.rotation.z = 0;
                    charInfo.armGroup.rotation.x = 0;
                }
                return;
            }
            
            const character = charInfo.mesh;
            if (!character) return;

            // Body bobbing - excited to greet
            character.position.y = charInfo.baseY + Math.sin(time * 3 + charInfo.wavePhase) * 0.1;
            
            // Body sway
            if (charInfo.bodyGroup) {
                charInfo.bodyGroup.rotation.z = Math.sin(time * 2 + charInfo.wavePhase) * 0.05;
            }
            
            // Arm waving animation - raise and wave
            if (charInfo.armGroup) {
                // Raise arm up (rotate backward at shoulder)
                charInfo.armGroup.rotation.x = -Math.PI * 0.4; // Arm raised
                // Wave back and forth
                charInfo.armGroup.rotation.z = Math.sin(time * 8 + charInfo.wavePhase) * 0.5 + 0.3;
            }
            
            // Rotate to face player
            const playerPos = player.getPosition();
            const dx = playerPos.x - character.position.x;
            const dz = playerPos.z - character.position.z;
            const targetAngle = Math.atan2(dx, dz);
            
            // Smoothly rotate towards player
            let angleDiff = targetAngle - character.rotation.y;
            // Normalize angle
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            character.rotation.y += angleDiff * 0.03;
        });
    }

    // Check if player is in any checkpoint zone
    checkPlayerPosition() {
        const playerPos = player.getPosition();
        
        for (const checkpoint of this.checkpoints) {
            if (checkpoint.completed) continue;
            
            const distance = playerPos.distanceTo(checkpoint.position);
            
            if (distance < this.triggerDistance) {
                this.triggerCheckpoint(checkpoint);
                return checkpoint;
            }
        }
        
        return null;
    }

    // Trigger a checkpoint
    triggerCheckpoint(checkpoint) {
        if (this.currentCheckpoint === checkpoint) return;
        
        this.currentCheckpoint = checkpoint;
        
        // Pause player movement
        player.setCanMove(false);
        player.unlock();
        
        // Show learning popup
        ui.showLearningPopup(checkpoint);
    }

    // Mark checkpoint as completed
    completeCheckpoint(checkpointId) {
        const checkpoint = this.checkpoints.find(c => c.id === checkpointId);
        
        if (checkpoint) {
            checkpoint.completed = true;
            this.completedCheckpoints.add(checkpointId);
            
            // Update marker appearance
            if (checkpoint.marker) {
                checkpoint.marker.material.color.setHex(0x888888);
                checkpoint.marker.material.opacity = 0.3;
            }
            if (checkpoint.indicator) {
                checkpoint.indicator.visible = false;
            }
            // Hide label when completed
            if (checkpoint.label) {
                checkpoint.label.visible = false;
            }
            
            // Update UI
            ui.updateProgress(this.completedCheckpoints.size, this.checkpoints.length);
        }
        
        this.currentCheckpoint = null;
        
        // Resume player movement
        player.setCanMove(true);
    }

    // Get checkpoint count
    getCheckpointCount() {
        return this.checkpoints.length;
    }

    // Get completed checkpoint count
    getCompletedCount() {
        return this.completedCheckpoints.size;
    }

    // Check if all checkpoints completed
    isAllCompleted() {
        return this.completedCheckpoints.size === this.checkpoints.length;
    }

    // Reset all checkpoints
    reset() {
        this.checkpoints.forEach(checkpoint => {
            checkpoint.completed = false;
            
            if (checkpoint.marker) {
                checkpoint.marker.material.color.setHex(0x00ff00);
                checkpoint.marker.material.opacity = 0.5;
            }
            if (checkpoint.indicator) {
                checkpoint.indicator.visible = true;
            }
            if (checkpoint.label) {
                checkpoint.label.visible = true;
            }
        });
        
        this.completedCheckpoints.clear();
        this.currentCheckpoint = null;
    }
}

// Singleton instance
const checkpointSystem = new CheckpointSystem();
export default checkpointSystem;
