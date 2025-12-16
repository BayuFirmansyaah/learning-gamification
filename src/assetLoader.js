import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Asset categories based on filename keywords
const ASSET_CATEGORIES = {
    road: ['road', 'street', 'tile'],
    sidewalk: ['sidewalk', 'path', 'pavement', 'ground_path'],
    building: ['building', 'house', 'tower'],
    commercial: ['building-a', 'building-b', 'building-c', 'building-d', 'building-e', 'building-f', 'building-g', 'building-h', 'building-i', 'building-j', 'building-k', 'building-l', 'building-m', 'building-n', 'building-skyscraper'],
    tree: ['tree', 'plant', 'bush', 'grass', 'flower', 'cactus'],
    decoration: ['bench', 'prop', 'lamp', 'light', 'sign', 'fence', 'rock', 'stone', 'pot', 'log', 'stump', 'mushroom', 'lily', 'tent', 'campfire', 'construction', 'detail', 'door', 'window', 'bridge', 'awning', 'overhang', 'parasol'],
    character: ['character']
};

// Model directories to scan
const MODEL_DIRECTORIES = [
    'models/kenney_city-kit-roads/Models/GLB format/',
    'models/kenney_modular-buildings/Models/GLB format/',
    'models/kenney_nature-kit/Models/GLTF format/',
    'models/kenney_blocky-characters/Models/GLB format/',
    'models/kenney_city-kit-commercial/Models/GLB format/'
];

class AssetLoader {
    constructor() {
        this.loader = new GLTFLoader();
        this.assets = {
            road: [],
            sidewalk: [],
            building: [],
            commercial: [],
            tree: [],
            decoration: [],
            character: []
        };
        this.loadedModels = new Map();
    }

    // Classify asset based on filename
    classifyAsset(filename) {
        const lowerName = filename.toLowerCase();
        
        // Check for commercial buildings first (more specific)
        if (lowerName.includes('building-') && !lowerName.includes('sample')) {
            // Check if it's from commercial pack (has letter suffix like building-a)
            const match = lowerName.match(/building-[a-n]|building-skyscraper/);
            if (match) {
                return 'commercial';
            }
        }
        
        for (const [category, keywords] of Object.entries(ASSET_CATEGORIES)) {
            if (category === 'commercial') continue; // Skip, handled above
            for (const keyword of keywords) {
                if (lowerName.includes(keyword)) {
                    return category;
                }
            }
        }
        
        // Default to decoration if unclear
        return 'decoration';
    }

    // Load a single GLB/GLTF model
    async loadModel(path) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    resolve(model);
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load model: ${path}`, error);
                    resolve(null);
                }
            );
        });
    }

    // Fetch file list from a directory (using a manifest or predefined list)
    async getModelFiles(directory) {
        // Since we can't dynamically scan directories in browser,
        // we use predefined model lists based on the asset packs
        const modelFiles = {
            'models/kenney_city-kit-roads/Models/GLB format/': [
                'road-straight.glb',
                'road-bend.glb',
                'road-crossing.glb',
                'road-crossroad.glb',
                'road-intersection.glb',
                'road-end.glb',
                'road-curve.glb',
                'road-side.glb',
                'road-straight-barrier.glb',
                'light-curved.glb',
                'light-curved-double.glb',
                'light-square.glb',
                'light-square-double.glb',
                'construction-cone.glb',
                'construction-barrier.glb',
                'construction-light.glb',
                'sign-highway.glb',
                'sign-highway-detailed.glb',
                'sign-highway-wide.glb',
                'bridge-pillar.glb',
                'tile-low.glb'
            ],
            'models/kenney_modular-buildings/Models/GLB format/': [
                'building-sample-house-a.glb',
                'building-sample-house-b.glb',
                'building-sample-house-c.glb',
                'building-sample-tower-a.glb',
                'building-sample-tower-b.glb',
                'building-sample-tower-c.glb',
                'building-sample-tower-d.glb',
                'detail-ac-a.glb',
                'detail-ac-b.glb',
                'door-brown.glb',
                'door-white.glb',
                'window-brown.glb',
                'window-white.glb'
            ],
            'models/kenney_nature-kit/Models/GLTF format/': [
                // Trees - berbagai jenis
                'tree_default.glb',
                'tree_default_dark.glb',
                'tree_oak.glb',
                'tree_oak_dark.glb',
                'tree_detailed.glb',
                'tree_simple.glb',
                'tree_tall.glb',
                'tree_small.glb',
                'tree_fat.glb',
                'tree_thin.glb',
                'tree_cone.glb',
                'tree_plateau.glb',
                'tree_pineDefaultA.glb',
                'tree_pineDefaultB.glb',
                'tree_pineRoundA.glb',
                'tree_pineRoundB.glb',
                'tree_pineTallA.glb',
                'tree_pineTallB.glb',
                // Plants & bushes
                'plant_bush.glb',
                'plant_bushLarge.glb',
                'plant_bushSmall.glb',
                'plant_bushDetailed.glb',
                'plant_bushTriangle.glb',
                'plant_flatShort.glb',
                'plant_flatTall.glb',
                // Flowers
                'flower_redA.glb',
                'flower_redB.glb',
                'flower_redC.glb',
                'flower_yellowA.glb',
                'flower_yellowB.glb',
                'flower_yellowC.glb',
                'flower_purpleA.glb',
                'flower_purpleB.glb',
                'flower_purpleC.glb',
                // Grass
                'grass.glb',
                'grass_large.glb',
                'grass_leafs.glb',
                'grass_leafsLarge.glb',
                // Rocks & Stones
                'rock_smallA.glb',
                'rock_smallB.glb',
                'rock_smallC.glb',
                'rock_largeA.glb',
                'rock_largeB.glb',
                'stone_smallA.glb',
                'stone_smallB.glb',
                'stone_largeA.glb',
                // Fences
                'fence_simple.glb',
                'fence_planks.glb',
                'fence_corner.glb',
                'fence_gate.glb',
                // Paths
                'path_stone.glb',
                'path_stoneCorner.glb',
                'path_wood.glb',
                'path_woodCorner.glb',
                // Props
                'bench.glb',
                'pot_large.glb',
                'pot_small.glb',
                'log.glb',
                'log_large.glb',
                'stump_round.glb',
                'stump_square.glb',
                'mushroom_red.glb',
                'mushroom_tan.glb',
                'lily_large.glb',
                'lily_small.glb',
                // Camping
                'tent_detailedOpen.glb',
                'campfire_stones.glb'
            ],
            'models/kenney_blocky-characters/Models/GLB format/': [
                'character-a.glb',
                'character-b.glb',
                'character-c.glb',
                'character-d.glb',
                'character-e.glb',
                'character-f.glb',
                'character-g.glb',
                'character-h.glb',
                'character-i.glb',
                'character-j.glb',
                'character-k.glb',
                'character-l.glb',
                'character-m.glb',
                'character-n.glb',
                'character-o.glb',
                'character-p.glb',
                'character-q.glb',
                'character-r.glb'
            ],
            'models/kenney_city-kit-commercial/Models/GLB format/': [
                'building-a.glb',
                'building-b.glb',
                'building-c.glb',
                'building-d.glb',
                'building-e.glb',
                'building-f.glb',
                'building-g.glb',
                'building-h.glb',
                'building-i.glb',
                'building-j.glb',
                'building-k.glb',
                'building-l.glb',
                'building-m.glb',
                'building-n.glb',
                'building-skyscraper-a.glb',
                'building-skyscraper-b.glb',
                'building-skyscraper-c.glb',
                'building-skyscraper-d.glb',
                'building-skyscraper-e.glb',
                'detail-awning-wide.glb',
                'detail-awning.glb',
                'detail-overhang-wide.glb',
                'detail-overhang.glb',
                'detail-parasol-a.glb',
                'detail-parasol-b.glb'
            ]
        };

        return modelFiles[directory] || [];
    }

    // Load all assets from all directories
    async loadAllAssets(onProgress) {
        let totalLoaded = 0;
        let totalAssets = 0;

        // Count total assets first
        for (const dir of MODEL_DIRECTORIES) {
            const files = await this.getModelFiles(dir);
            totalAssets += files.length;
        }

        // Load assets from each directory
        for (const dir of MODEL_DIRECTORIES) {
            const files = await this.getModelFiles(dir);
            
            for (const file of files) {
                const path = dir + file;
                const category = this.classifyAsset(file);
                
                const model = await this.loadModel(path);
                
                if (model) {
                    const assetInfo = {
                        name: file.replace('.glb', '').replace('.gltf', ''),
                        path: path,
                        model: model,
                        category: category
                    };
                    
                    this.assets[category].push(assetInfo);
                    this.loadedModels.set(path, model);
                }
                
                totalLoaded++;
                if (onProgress) {
                    onProgress(totalLoaded, totalAssets);
                }
            }
        }

        console.log('Assets loaded:', {
            roads: this.assets.road.length,
            sidewalks: this.assets.sidewalk.length,
            buildings: this.assets.building.length,
            commercial: this.assets.commercial.length,
            trees: this.assets.tree.length,
            decorations: this.assets.decoration.length
        });

        return this.assets;
    }

    // Get assets by category
    getAssetsByCategory(category) {
        return this.assets[category] || [];
    }

    // Get a specific asset by name
    getAssetByName(name) {
        for (const category of Object.values(this.assets)) {
            const asset = category.find(a => a.name === name);
            if (asset) return asset;
        }
        return null;
    }

    // Clone a model for placement
    cloneModel(assetInfo) {
        if (!assetInfo || !assetInfo.model) return null;
        return assetInfo.model.clone();
    }

    // Get a random asset from a category
    getRandomAsset(category) {
        const categoryAssets = this.assets[category];
        if (!categoryAssets || categoryAssets.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * categoryAssets.length);
        return categoryAssets[randomIndex];
    }

    // Get road pieces
    getRoadPieces() {
        return this.assets.road;
    }

    // Get building models
    getBuildings() {
        return this.assets.building;
    }

    // Get commercial building models (prioritized for main street)
    getCommercialBuildings() {
        return this.assets.commercial;
    }

    // Get all buildings (both regular and commercial)
    getAllBuildings() {
        return [...this.assets.commercial, ...this.assets.building];
    }

    // Get tree/greenery models
    getTrees() {
        return this.assets.tree;
    }

    // Get decoration models
    getDecorations() {
        return this.assets.decoration;
    }

    // Get character models
    getCharacters() {
        return this.assets.character;
    }
}

// Singleton instance
const assetLoader = new AssetLoader();
export default assetLoader;
