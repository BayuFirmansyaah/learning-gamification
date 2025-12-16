import * as THREE from 'three';
import assetLoader from './assetLoader.js';

class BuildingsManager {
    constructor() {
        this.scene = null;
        this.buildings = [];
        this.buildingPositions = [];
        this.colliders = [];
    }

    // Initialize buildings manager
    init(scene) {
        this.scene = scene;
    }

    // Create urban layout with buildings
    async createUrbanLayout() {
        // Prioritize commercial buildings for the main street
        let buildingAssets = assetLoader.getCommercialBuildings();
        
        // Fallback to regular buildings if no commercial ones
        if (buildingAssets.length === 0) {
            buildingAssets = assetLoader.getBuildings();
        }
        
        if (buildingAssets.length === 0) {
            console.warn('No building assets found, creating placeholder buildings');
            this.createPlaceholderBuildings();
            return;
        }

        console.log(`Using ${buildingAssets.length} commercial buildings for main street`);

        // Layout configuration - more buildings in a row!
        const config = {
            buildingSpacing: 50,        // Closer spacing for commercial street feel
            buildingOffset: 55,         // Distance from road center
            numBuildingsPerSide: 10,    // More buildings per side
            startZ: -350,               // Starting Z position
        };

        // Place buildings symmetrically on both sides
        for (let i = 0; i < config.numBuildingsPerSide; i++) {
            const z = config.startZ + (i * config.buildingSpacing);
            
            // Select different building assets for variety
            const leftAssetIndex = i % buildingAssets.length;
            const rightAssetIndex = (i + 5) % buildingAssets.length; // Different building on right
            
            const leftBuildingAsset = buildingAssets[leftAssetIndex];
            const rightBuildingAsset = buildingAssets[rightAssetIndex];

            // Left side building
            this.placeBuilding(leftBuildingAsset, -config.buildingOffset, z, i, 'left');
            
            // Right side building (different model for variety)
            this.placeBuilding(rightBuildingAsset, config.buildingOffset, z, i, 'right');
        }

        // Add some background buildings for depth
        this.addBackgroundBuildings(assetLoader.getAllBuildings());

        console.log(`Created ${this.buildings.length} buildings`);
    }

    // Add background buildings for more depth
    addBackgroundBuildings(buildingAssets) {
        if (buildingAssets.length === 0) return;

        // Second row of buildings - further back (skyscrapers for backdrop)
        const skyscrapers = buildingAssets.filter(b => b.name && b.name.includes('skyscraper'));
        const regularBuildings = buildingAssets.filter(b => b.name && !b.name.includes('skyscraper'));
        
        const secondRowOffset = 110;
        
        for (let z = -320; z <= 320; z += 70) {
            // Use skyscrapers for back row if available
            const leftAsset = skyscrapers.length > 0 
                ? skyscrapers[Math.floor(Math.random() * skyscrapers.length)]
                : buildingAssets[Math.floor(Math.random() * buildingAssets.length)];
            this.placeBackgroundBuilding(leftAsset, -secondRowOffset, z, 'left');
            
            const rightAsset = skyscrapers.length > 0 
                ? skyscrapers[Math.floor(Math.random() * skyscrapers.length)]
                : buildingAssets[Math.floor(Math.random() * buildingAssets.length)];
            this.placeBackgroundBuilding(rightAsset, secondRowOffset, z, 'right');
        }
        
        // Third row for even more depth
        const thirdRowOffset = 160;
        for (let z = -300; z <= 300; z += 100) {
            const leftAsset = buildingAssets[Math.floor(Math.random() * buildingAssets.length)];
            this.placeBackgroundBuilding(leftAsset, -thirdRowOffset, z, 'left', 0.7);
            
            const rightAsset = buildingAssets[Math.floor(Math.random() * buildingAssets.length)];
            this.placeBackgroundBuilding(rightAsset, thirdRowOffset, z, 'right', 0.7);
        }
    }

    // Place a background building (not a checkpoint)
    placeBackgroundBuilding(assetInfo, x, z, side, scaleMultiplier = 1.0) {
        const building = assetLoader.cloneModel(assetInfo);
        
        if (!building) return null;

        // Position building
        building.position.set(x, 0, z);
        
        // Rotate building to face the road
        building.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
        
        // Scale with variety
        const baseScale = 8 + Math.random() * 4;
        const scale = baseScale * scaleMultiplier;
        building.scale.set(scale, scale, scale);

        this.scene.add(building);

        // Create collision box but don't add to checkpoint buildings
        const box = new THREE.Box3().setFromObject(building);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const colliderGeometry = new THREE.BoxGeometry(size.x + 1, size.y, size.z + 1);
        const colliderMaterial = new THREE.MeshBasicMaterial({ 
            visible: false,
            transparent: true,
            opacity: 0
        });
        
        const collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
        collider.position.copy(center);
        this.colliders.push(collider);
        this.scene.add(collider);

        return building;
    }

    // Place a single building
    placeBuilding(assetInfo, x, z, index, side) {
        const building = assetLoader.cloneModel(assetInfo);
        
        if (!building) return null;

        // Position building
        building.position.set(x, 0, z);
        
        // Rotate building to face the road
        building.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
        
        // Scale building 10x larger
        building.scale.set(10, 10, 10);

        // Calculate bounding box for collision
        const box = new THREE.Box3().setFromObject(building);
        const size = box.getSize(new THREE.Vector3());

        // Store building info
        const buildingInfo = {
            mesh: building,
            position: building.position.clone(),
            side: side,
            index: index,
            size: size,
            checkpointId: this.buildings.length,
            name: assetInfo.name
        };

        this.buildings.push(buildingInfo);
        this.buildingPositions.push(building.position.clone());
        this.scene.add(building);

        // Create collision box
        this.createCollider(building, buildingInfo);

        return buildingInfo;
    }

    // Create placeholder buildings if no assets loaded
    createPlaceholderBuildings() {
        const config = {
            buildingSpacing: 20,
            buildingOffset: 15,
            numBuildingsPerSide: 4,
            startZ: -60,
        };

        const buildingColors = [0x8B4513, 0xA0522D, 0xCD853F, 0xDEB887];

        for (let i = 0; i < config.numBuildingsPerSide; i++) {
            const z = config.startZ + (i * config.buildingSpacing);
            const color = buildingColors[i % buildingColors.length];
            
            // Left building
            this.createPlaceholderBuilding(-config.buildingOffset, z, color, i, 'left');
            
            // Right building
            this.createPlaceholderBuilding(config.buildingOffset, z, color, i, 'right');
        }
    }

    // Create a single placeholder building
    createPlaceholderBuilding(x, z, color, index, side) {
        const width = 6 + Math.random() * 2;
        const height = 8 + Math.random() * 6;
        const depth = 6 + Math.random() * 2;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.7,
            metalness: 0.1
        });
        
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;

        const buildingInfo = {
            mesh: building,
            position: building.position.clone(),
            side: side,
            index: index,
            size: new THREE.Vector3(width, height, depth),
            checkpointId: this.buildings.length,
            name: `Building ${this.buildings.length + 1}`
        };

        this.buildings.push(buildingInfo);
        this.buildingPositions.push(building.position.clone());
        this.scene.add(building);

        // Create collision box
        this.createCollider(building, buildingInfo);

        return buildingInfo;
    }

    // Create collision box for building
    createCollider(mesh, buildingInfo) {
        const box = new THREE.Box3().setFromObject(mesh);
        
        // Create an invisible collision mesh
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const colliderGeometry = new THREE.BoxGeometry(size.x + 1, size.y, size.z + 1);
        const colliderMaterial = new THREE.MeshBasicMaterial({ 
            visible: false,
            transparent: true,
            opacity: 0
        });
        
        const collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
        collider.position.copy(center);
        collider.userData.buildingInfo = buildingInfo;
        
        this.colliders.push(collider);
        this.scene.add(collider);
    }

    // Get all buildings
    getBuildings() {
        return this.buildings;
    }

    // Get building positions
    getBuildingPositions() {
        return this.buildingPositions;
    }

    // Get collision boxes
    getColliders() {
        return this.colliders;
    }

    // Get building by checkpoint ID
    getBuildingByCheckpointId(id) {
        return this.buildings.find(b => b.checkpointId === id);
    }

    // Get total number of buildings
    getBuildingCount() {
        return this.buildings.length;
    }
}

// Singleton instance
const buildingsManager = new BuildingsManager();
export default buildingsManager;
