import * as THREE from 'three';
import assetLoader from './assetLoader.js';

class TrainSystem {
    constructor() {
        this.scene = null;
        this.train = null;
        this.trainCars = [];
        this.trackPath = null;
        this.pathProgress = 0;
        this.speed = 0.015; // Speed along path
        this.trainLoaded = false;
        this.hornSound = null;
        this.lastHornTime = 0;
        this.hornInterval = 15; // Horn every 15 seconds
    }

    // Initialize train system
    init(scene) {
        this.scene = scene;
        this.createTrackPath();
        this.createTracks();
        this.loadTrain();
    }

    // Create the path the train will follow (behind the buildings)
    createTrackPath() {
        // Create a path that runs behind the buildings
        // Buildings are at offset 60 from road, so train runs at 140 (behind buildings)
        
        const pathPoints = [];
        const segments = 32;
        
        const roadOffset = 140; // Distance from center - behind buildings
        const cityLength = 400; // How far the train travels along Z
        const loopRadius = 60; // Radius of the turnaround loops
        
        // Straight section going south (positive Z direction) - LEFT side (behind left buildings)
        for (let i = 0; i <= 30; i++) {
            const t = i / 30;
            pathPoints.push(new THREE.Vector3(
                -roadOffset,
                0,
                -cityLength + t * (cityLength * 2)
            ));
        }
        
        // Bottom loop (south end) - turnaround
        for (let i = 0; i <= segments; i++) {
            const angle = -Math.PI / 2 + Math.PI * (i / segments);
            pathPoints.push(new THREE.Vector3(
                -roadOffset + loopRadius + Math.cos(angle) * loopRadius,
                0,
                cityLength + Math.sin(angle) * loopRadius
            ));
        }
        
        // Straight section going north (negative Z direction) - RIGHT side (behind right buildings)
        for (let i = 0; i <= 30; i++) {
            const t = i / 30;
            pathPoints.push(new THREE.Vector3(
                roadOffset,
                0,
                cityLength - t * (cityLength * 2)
            ));
        }
        
        // Top loop (north end) - turnaround
        for (let i = 0; i <= segments; i++) {
            const angle = Math.PI / 2 + Math.PI * (i / segments);
            pathPoints.push(new THREE.Vector3(
                roadOffset - loopRadius + Math.cos(angle) * loopRadius,
                0,
                -cityLength + Math.sin(angle) * loopRadius
            ));
        }

        // Create smooth curve from points
        this.trackPath = new THREE.CatmullRomCurve3(pathPoints, true); // true = closed loop
    }

    // Create visible train tracks
    createTracks() {
        if (!this.trackPath) return;

        // Create track geometry following the path
        const trackGeometry = new THREE.TubeGeometry(
            this.trackPath,
            200,  // tubular segments
            2,    // radius
            8,    // radial segments
            true  // closed
        );

        // Track material (dark metal look)
        const trackMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            metalness: 0.8,
            roughness: 0.4
        });

        const track = new THREE.Mesh(trackGeometry, trackMaterial);
        track.position.y = 0.3;
        track.receiveShadow = true;
        this.scene.add(track);

        // Add railroad ties along the path
        this.createRailroadTies();
    }

    // Create railroad ties (sleepers)
    createRailroadTies() {
        const tieGeometry = new THREE.BoxGeometry(6, 0.3, 1);
        const tieMaterial = new THREE.MeshStandardMaterial({
            color: 0x5c4033, // Brown wood color
            roughness: 0.9
        });

        const numTies = 300;
        for (let i = 0; i < numTies; i++) {
            const t = i / numTies;
            const point = this.trackPath.getPointAt(t);
            const tangent = this.trackPath.getTangentAt(t);
            
            const tie = new THREE.Mesh(tieGeometry, tieMaterial);
            tie.position.copy(point);
            tie.position.y = 0.15;
            
            // Rotate to be perpendicular to track
            tie.rotation.y = Math.atan2(tangent.x, tangent.z);
            
            tie.receiveShadow = true;
            tie.castShadow = true;
            this.scene.add(tie);
        }
    }

    // Load train models
    async loadTrain() {
        const trainModels = [
            'train-locomotive-a.glb',
            'train-carriage-container-red.glb',
            'train-carriage-container-blue.glb',
            'train-carriage-lumber.glb',
            'train-carriage-tank.glb',
            'train-carriage-box.glb'
        ];

        const basePath = './models/kenney_train/Models/GLB format/';
        
        // Load each train car
        for (let i = 0; i < trainModels.length; i++) {
            try {
                const model = await assetLoader.loadModel(basePath + trainModels[i]);
                if (model) {
                    model.scale.set(3, 3, 3); // Scale train appropriately
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    this.trainCars.push({
                        mesh: model,
                        offset: i * 0.025 // Spacing between cars along path
                    });
                    
                    this.scene.add(model);
                }
            } catch (error) {
                console.warn(`Failed to load train car: ${trainModels[i]}`, error);
            }
        }

        if (this.trainCars.length > 0) {
            this.trainLoaded = true;
            console.log('Train loaded with', this.trainCars.length, 'cars');
        }
    }

    // Update train position along the path
    update(time, delta) {
        if (!this.trainLoaded || !this.trackPath) return;

        // Move train along path
        this.pathProgress += this.speed * delta;
        if (this.pathProgress > 1) this.pathProgress -= 1;

        // Update each train car position
        this.trainCars.forEach((car, index) => {
            let t = (this.pathProgress - car.offset) % 1;
            if (t < 0) t += 1;

            // Get position and direction on path
            const position = this.trackPath.getPointAt(t);
            const tangent = this.trackPath.getTangentAt(t);

            // Update car position
            car.mesh.position.copy(position);
            car.mesh.position.y = 1.5; // Raise above track

            // Rotate to face direction of travel
            car.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);
        });

        // Train whistle/horn at intervals
        this.updateHorn(time);

        // Add slight wobble to locomotive for realism
        if (this.trainCars.length > 0) {
            const locomotive = this.trainCars[0].mesh;
            locomotive.rotation.z = Math.sin(time * 8) * 0.01;
            locomotive.position.y = 1.5 + Math.sin(time * 10) * 0.05;
        }

        // Update smoke particles from locomotive
        this.updateSmoke(time);
    }

    // Create smoke effect from locomotive
    updateSmoke(time) {
        if (!this.trainCars.length) return;
        
        // Create smoke puff every few frames
        if (Math.random() > 0.85) {
            const locomotive = this.trainCars[0].mesh;
            this.createSmokePuff(locomotive.position.clone());
        }
    }

    // Create a smoke puff particle
    createSmokePuff(position) {
        const smokeGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const smokeMaterial = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            transparent: true,
            opacity: 0.6
        });

        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.copy(position);
        smoke.position.y += 4;
        smoke.userData.life = 0;
        smoke.userData.maxLife = 2;

        this.scene.add(smoke);

        // Animate and remove smoke
        const animateSmoke = () => {
            smoke.userData.life += 0.016;
            const lifeRatio = smoke.userData.life / smoke.userData.maxLife;
            
            smoke.position.y += 0.05;
            smoke.scale.set(1 + lifeRatio * 2, 1 + lifeRatio * 2, 1 + lifeRatio * 2);
            smoke.material.opacity = 0.6 * (1 - lifeRatio);

            if (smoke.userData.life < smoke.userData.maxLife) {
                requestAnimationFrame(animateSmoke);
            } else {
                this.scene.remove(smoke);
                smoke.geometry.dispose();
                smoke.material.dispose();
            }
        };

        animateSmoke();
    }

    // Update horn sound interval (visual indicator since we don't have audio)
    updateHorn(time) {
        if (time - this.lastHornTime > this.hornInterval) {
            this.lastHornTime = time;
            this.playHornVisual();
        }
    }

    // Visual horn effect (flash or notification)
    playHornVisual() {
        if (!this.trainCars.length) return;

        const locomotive = this.trainCars[0].mesh;
        
        // Create horn visual effect - expanding ring
        const ringGeometry = new THREE.RingGeometry(2, 3, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(locomotive.position);
        ring.position.y += 5;
        ring.rotation.x = -Math.PI / 2;

        this.scene.add(ring);

        // Animate ring expansion
        let scale = 1;
        const animateRing = () => {
            scale += 0.15;
            ring.scale.set(scale, scale, scale);
            ring.material.opacity -= 0.03;

            if (ring.material.opacity > 0) {
                requestAnimationFrame(animateRing);
            } else {
                this.scene.remove(ring);
                ring.geometry.dispose();
                ring.material.dispose();
            }
        };

        animateRing();
    }

    // Check if player is near train (for interaction)
    isPlayerNear(playerPosition, threshold = 30) {
        if (!this.trainCars.length) return false;
        
        const locomotivePos = this.trainCars[0].mesh.position;
        const distance = playerPosition.distanceTo(locomotivePos);
        return distance < threshold;
    }

    // Get train info for UI
    getTrainInfo() {
        if (!this.trainCars.length) return null;
        
        return {
            position: this.trainCars[0].mesh.position.clone(),
            carsCount: this.trainCars.length,
            speed: this.speed * 1000 // Convert to display-friendly value
        };
    }
}

const trainSystem = new TrainSystem();
export default trainSystem;
