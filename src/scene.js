import * as THREE from 'three';

class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sunLight = null;
        this.ambientLight = null;
    }

    // Initialize the Three.js scene
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Light blue sky
        this.scene.fog = new THREE.Fog(0x87CEEB, 200, 800);

        // Create camera (FPS perspective)
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 1.6, 100); // Start further back

        // Create renderer
        const canvas = document.getElementById('canvas3d');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Setup lighting
        this.setupLighting();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        return { scene: this.scene, camera: this.camera, renderer: this.renderer };
    }

    // Setup scene lighting
    setupLighting() {
        // Ambient light for overall illumination
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        // Hemisphere light for natural outdoor lighting
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3d5c3d, 0.6);
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);

        // Main directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.set(200, 400, 200);
        this.sunLight.castShadow = true;
        
        // Shadow settings - scaled for larger area
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 1000;
        this.sunLight.shadow.camera.left = -400;
        this.sunLight.shadow.camera.right = 400;
        this.sunLight.shadow.camera.top = 400;
        this.sunLight.shadow.camera.bottom = -400;
        this.sunLight.shadow.bias = -0.0001;
        
        this.scene.add(this.sunLight);

        // Secondary fill light
        const fillLight = new THREE.DirectionalLight(0xffffcc, 0.3);
        fillLight.position.set(-30, 50, -30);
        this.scene.add(fillLight);
    }

    // Get lights for day/night system
    getLights() {
        return {
            sunLight: this.sunLight,
            ambientLight: this.ambientLight
        };
    }

    // Handle window resize
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Render the scene
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    // Get the scene
    getScene() {
        return this.scene;
    }

    // Get the camera
    getCamera() {
        return this.camera;
    }

    // Get the renderer
    getRenderer() {
        return this.renderer;
    }

    // Add object to scene
    add(object) {
        this.scene.add(object);
    }

    // Remove object from scene
    remove(object) {
        this.scene.remove(object);
    }
}

// Singleton instance
const sceneManager = new SceneManager();
export default sceneManager;
