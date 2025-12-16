import * as THREE from 'three';
import sceneManager from './scene.js';
import player from './player.js';
import assetLoader from './assetLoader.js';
import environment from './environment.js';
import buildingsManager from './buildings.js';
import checkpointSystem from './checkpoints.js';
import trainSystem from './train.js';
import minimap from './minimap.js';
// Disabled for performance:
// import dayNightCycle from './daynight.js';
// import collectibleSystem from './collectibles.js';
import ui from './ui.js';
import youtubeManager from './youtube.js';

class App {
    constructor() {
        this.clock = new THREE.Clock();
        this.isRunning = false;
    }

    // Initialize the application
    async init() {
        console.log('Initializing 3D Educational Application...');

        // Show loading screen
        ui.showLoading('Memuat aplikasi...');

        try {
            // Initialize scene
            ui.updateLoadingMessage('Membuat scene...');
            const { scene, camera, renderer } = sceneManager.init();

            // Initialize player controls
            ui.updateLoadingMessage('Menyiapkan kontrol pemain...');
            player.init(camera, renderer.domElement);
            player.setScene(scene);

            // Initialize environment
            ui.updateLoadingMessage('Membuat lingkungan...');
            environment.init(scene);

            // Initialize buildings manager
            buildingsManager.init(scene);

            // Initialize checkpoint system
            checkpointSystem.init(scene);

            // Initialize UI
            ui.init();

            // Initialize YouTube manager
            youtubeManager.init();

            // Load assets
            ui.updateLoadingMessage('Memuat aset 3D...');
            await assetLoader.loadAllAssets((loaded, total) => {
                const percent = Math.round((loaded / total) * 100);
                ui.updateLoadingMessage(`Memuat aset... ${percent}%`);
            });

            // Create urban layout
            ui.updateLoadingMessage('Membuat tata kota...');
            await this.createUrbanLayout();

            // Create checkpoints
            ui.updateLoadingMessage('Menyiapkan checkpoint...');
            checkpointSystem.createCheckpoints();

            // Initialize train system
            ui.updateLoadingMessage('Menyiapkan kereta...');
            trainSystem.init(scene);

            // Initialize minimap
            minimap.init();

            // Gamification disabled for performance:
            // const lights = sceneManager.getLights();
            // dayNightCycle.init(scene, lights.sunLight, lights.ambientLight);
            // collectibleSystem.init(scene);

            // Update initial progress display
            ui.updateProgress(0, checkpointSystem.getCheckpointCount());

            // Set player boundaries based on layout
            player.setBounds({
                minX: -180,
                maxX: 180,
                minZ: -450,
                maxZ: 450
            });

            // Set building colliders for player
            player.setColliders(buildingsManager.getColliders());

            // Hide loading, show start screen
            ui.hideLoading();

            console.log('Application initialized successfully!');

            // Start animation loop
            this.isRunning = true;
            this.animate();

        } catch (error) {
            console.error('Failed to initialize application:', error);
            ui.updateLoadingMessage('Error: ' + error.message);
        }
    }

    // Create the urban layout
    async createUrbanLayout() {
        // Create buildings first
        await buildingsManager.createUrbanLayout();

        // Calculate checkpoint positions and pass to environment
        const buildings = buildingsManager.getBuildings();
        const checkpointPositions = buildings.map(building => {
            const offset = building.side === 'left' ? 20 : -20;
            return {
                x: building.position.x + offset,
                z: building.position.z
            };
        });
        environment.setCheckpointPositions(checkpointPositions);

        // Now add greenery (will avoid checkpoint areas)
        environment.createGreenZones(buildingsManager.getBuildingPositions());
        environment.addStreetDecorations();
    }

    // Animation loop
    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();

        // Update player
        player.update(delta);

        // Update checkpoint indicators animation
        checkpointSystem.updateIndicators(elapsedTime);

        // Update train animation
        trainSystem.update(elapsedTime, delta);

        // Update minimap
        minimap.update();

        // Gamification disabled for performance:
        // dayNightCycle.update(delta);
        // collectibleSystem.update(elapsedTime, delta);

        // Check player position for checkpoints
        if (player.isControlsLocked()) {
            checkpointSystem.checkPlayerPosition();
        }

        // Render scene
        sceneManager.render();
    }

    // Stop the application
    stop() {
        this.isRunning = false;
    }
}

// Start application when DOM is ready
const app = new App();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

export default app;
