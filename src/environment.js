import * as THREE from 'three';
import assetLoader from './assetLoader.js';
import buildingsManager from './buildings.js';

class Environment {
    constructor() {
        this.scene = null;
        this.ground = null;
        this.roads = [];
        this.sidewalks = [];
        this.greenZones = [];
        this.checkpointPositions = []; // Store checkpoint positions to avoid placing trees there
    }

    // Initialize environment
    init(scene) {
        this.scene = scene;
        this.createGround();
    }

    // Set checkpoint positions to avoid placing objects there
    setCheckpointPositions(positions) {
        this.checkpointPositions = positions;
    }

    // Check if position is too close to any checkpoint
    isNearCheckpoint(x, z, minDistance = 25) {
        for (const pos of this.checkpointPositions) {
            const dx = x - pos.x;
            const dz = z - pos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }

    // Create the ground plane
    createGround() {
        // Main ground (grass) - much larger area for 10x scale
        const groundGeometry = new THREE.PlaneGeometry(800, 1200);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a7c3f,
            roughness: 0.8,
            metalness: 0.1
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = 0;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Road surface - wider and longer for 10x scale
        const roadGeometry = new THREE.PlaneGeometry(40, 1000);
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.9,
            metalness: 0.0
        });
        const roadSurface = new THREE.Mesh(roadGeometry, roadMaterial);
        roadSurface.rotation.x = -Math.PI / 2;
        roadSurface.position.y = 0.01;
        roadSurface.receiveShadow = true;
        this.scene.add(roadSurface);

        // Road center line
        const lineGeometry = new THREE.PlaneGeometry(0.5, 1000);
        const lineMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffff00,
            roughness: 0.5
        });
        const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.02;
        this.scene.add(centerLine);

        // Dashed road lines
        for (let z = -480; z <= 480; z += 30) {
            const dashGeometry = new THREE.PlaneGeometry(0.4, 12);
            const dashMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            
            // Left lane dash
            const leftDash = new THREE.Mesh(dashGeometry, dashMaterial);
            leftDash.rotation.x = -Math.PI / 2;
            leftDash.position.set(-10, 0.02, z);
            this.scene.add(leftDash);
            
            // Right lane dash
            const rightDash = new THREE.Mesh(dashGeometry, dashMaterial);
            rightDash.rotation.x = -Math.PI / 2;
            rightDash.position.set(10, 0.02, z);
            this.scene.add(rightDash);
        }

        // Sidewalks (left and right) - wider and longer
        const sidewalkGeometry = new THREE.PlaneGeometry(15, 1000);
        const sidewalkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            roughness: 0.7,
            metalness: 0.0
        });

        // Left sidewalk
        const leftSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
        leftSidewalk.rotation.x = -Math.PI / 2;
        leftSidewalk.position.set(-28, 0.02, 0);
        leftSidewalk.receiveShadow = true;
        this.scene.add(leftSidewalk);

        // Right sidewalk
        const rightSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
        rightSidewalk.rotation.x = -Math.PI / 2;
        rightSidewalk.position.set(28, 0.02, 0);
        rightSidewalk.receiveShadow = true;
        this.scene.add(rightSidewalk);

        // Sidewalk curbs
        const curbGeometry = new THREE.BoxGeometry(1, 0.5, 1000);
        const curbMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

        // Left curbs
        const leftCurbInner = new THREE.Mesh(curbGeometry, curbMaterial);
        leftCurbInner.position.set(-20, 0.25, 0);
        this.scene.add(leftCurbInner);

        const leftCurbOuter = new THREE.Mesh(curbGeometry, curbMaterial);
        leftCurbOuter.position.set(-36, 0.25, 0);
        this.scene.add(leftCurbOuter);

        // Right curbs
        const rightCurbInner = new THREE.Mesh(curbGeometry, curbMaterial);
        rightCurbInner.position.set(20, 0.25, 0);
        this.scene.add(rightCurbInner);

        const rightCurbOuter = new THREE.Mesh(curbGeometry, curbMaterial);
        rightCurbOuter.position.set(36, 0.25, 0);
        this.scene.add(rightCurbOuter);
    }

    // Create road using loaded assets
    async createRoadFromAssets() {
        const roadAssets = assetLoader.getRoadPieces();
        
        // Find straight road piece
        const straightRoad = roadAssets.find(a => a.name.includes('straight') && !a.name.includes('barrier'));
        
        if (straightRoad) {
            // Place road segments along the main road
            const roadLength = 200;
            const segmentSize = 4; // Approximate size of each road piece
            
            for (let z = -roadLength/2; z < roadLength/2; z += segmentSize) {
                const roadPiece = assetLoader.cloneModel(straightRoad);
                if (roadPiece) {
                    roadPiece.position.set(0, 0, z);
                    roadPiece.rotation.y = Math.PI / 2;
                    this.scene.add(roadPiece);
                    this.roads.push(roadPiece);
                }
            }
        }
    }

    // Create green zones between buildings
    createGreenZones(buildingPositions) {
        const treeAssets = assetLoader.getTrees();
        const decorationAssets = assetLoader.getDecorations();
        
        if (treeAssets.length === 0) return;

        // Place trees along sidewalks - scaled 10x
        const treeSpacing = 50;
        const sidewalkOffset = 40;

        for (let z = -400; z <= 400; z += treeSpacing) {
            // Left side trees
            this.placeTree(-sidewalkOffset, z, treeAssets);
            
            // Right side trees
            this.placeTree(sidewalkOffset, z, treeAssets);
        }

        // Trees di area belakang bangunan
        for (let z = -400; z <= 400; z += 40) {
            this.placeTree(-100 + Math.random() * 20, z, treeAssets);
            this.placeTree(100 + Math.random() * 20, z, treeAssets);
        }

        // Forest di pinggir area
        for (let z = -450; z <= 450; z += 30) {
            for (let row = 0; row < 3; row++) {
                this.placeTree(-150 - row * 25 + Math.random() * 15, z + Math.random() * 20, treeAssets);
                this.placeTree(150 + row * 25 + Math.random() * 15, z + Math.random() * 20, treeAssets);
            }
        }

        // Place grass/bushes between buildings
        const bushAssets = treeAssets.filter(a => 
            a.name.includes('bush') || a.name.includes('grass') || a.name.includes('flower')
        );
        
        if (bushAssets.length > 0) {
            for (let z = -400; z <= 400; z += 40) {
                for (let i = 0; i < 3; i++) {
                    this.placeBush(-50 - Math.random() * 30, z + Math.random() * 30, bushAssets);
                }
                for (let i = 0; i < 3; i++) {
                    this.placeBush(50 + Math.random() * 30, z + Math.random() * 30, bushAssets);
                }
            }
        }

        // Flowers di sepanjang sidewalk
        const flowerAssets = treeAssets.filter(a => a.name.includes('flower'));
        if (flowerAssets.length > 0) {
            for (let z = -400; z <= 400; z += 20) {
                this.placeFlower(-22, z + Math.random() * 10, flowerAssets);
                this.placeFlower(22, z + Math.random() * 10, flowerAssets);
            }
        }

        // Grass patches di area hijau
        const grassAssets = treeAssets.filter(a => a.name.includes('grass'));
        if (grassAssets.length > 0) {
            for (let z = -450; z <= 450; z += 15) {
                for (let x = -250; x <= 250; x += 25) {
                    if (Math.abs(x) > 40 && Math.random() > 0.5) {
                        this.placeGrass(x + Math.random() * 15, z + Math.random() * 10, grassAssets);
                    }
                }
            }
        }

        // Rocks & stones scattered
        const rockAssets = decorationAssets.filter(a => 
            a.name.includes('rock') || a.name.includes('stone')
        );
        if (rockAssets.length > 0) {
            for (let i = 0; i < 50; i++) {
                const x = (Math.random() - 0.5) * 400;
                const z = (Math.random() - 0.5) * 800;
                if (Math.abs(x) > 50) {
                    this.placeRock(x, z, rockAssets);
                }
            }
        }

        // Pots near buildings
        const potAssets = decorationAssets.filter(a => a.name.includes('pot'));
        if (potAssets.length > 0) {
            for (let z = -300; z <= 300; z += 80) {
                this.placePot(-45, z + 10, potAssets);
                this.placePot(45, z + 10, potAssets);
            }
        }

        // Benches di sidewalk
        const benchAssets = decorationAssets.filter(a => a.name.includes('bench'));
        if (benchAssets.length > 0) {
            for (let z = -300; z <= 300; z += 150) {
                this.placeBench(-25, z, benchAssets, Math.PI / 2);
                this.placeBench(25, z, benchAssets, -Math.PI / 2);
            }
        }

        // Logs & stumps di area hijau
        const logAssets = decorationAssets.filter(a => 
            a.name.includes('log') || a.name.includes('stump')
        );
        if (logAssets.length > 0) {
            for (let i = 0; i < 25; i++) {
                const x = (Math.random() - 0.5) * 300;
                const z = (Math.random() - 0.5) * 700;
                if (Math.abs(x) > 60) {
                    this.placeLog(x, z, logAssets);
                }
            }
        }

        // Mushrooms scattered
        const mushroomAssets = decorationAssets.filter(a => a.name.includes('mushroom'));
        if (mushroomAssets.length > 0) {
            for (let i = 0; i < 30; i++) {
                const x = (Math.random() - 0.5) * 400;
                const z = (Math.random() - 0.5) * 800;
                if (Math.abs(x) > 50) {
                    this.placeMushroom(x, z, mushroomAssets);
                }
            }
        }
    }

    // Place a tree at position
    placeTree(x, z, treeAssets) {
        // Skip if too close to checkpoint
        if (this.isNearCheckpoint(x, z, 30)) return;
        
        // Filter for actual trees (not bushes)
        const trees = treeAssets.filter(a => 
            a.name.includes('tree') && !a.name.includes('bush')
        );
        
        if (trees.length === 0) return;
        
        const randomTree = trees[Math.floor(Math.random() * trees.length)];
        const tree = assetLoader.cloneModel(randomTree);
        
        if (tree) {
            tree.position.set(x, 0, z);
            // Random slight rotation for variety
            tree.rotation.y = Math.random() * Math.PI * 2;
            // Scale 10x with random variation
            const scale = 8 + Math.random() * 4;
            tree.scale.set(scale, scale, scale);
            this.scene.add(tree);
            this.greenZones.push(tree);
        }
    }

    // Place a bush/decoration at position
    placeBush(x, z, bushAssets) {
        // Skip if too close to checkpoint
        if (this.isNearCheckpoint(x, z, 20)) return;
        
        if (bushAssets.length === 0) return;
        
        const randomBush = bushAssets[Math.floor(Math.random() * bushAssets.length)];
        const bush = assetLoader.cloneModel(randomBush);
        
        if (bush) {
            bush.position.set(x, 0, z);
            bush.rotation.y = Math.random() * Math.PI * 2;
            const scale = 6 + Math.random() * 4;
            bush.scale.set(scale, scale, scale);
            this.scene.add(bush);
            this.greenZones.push(bush);
        }
    }

    // Add street decorations (lamps, signs, etc.)
    addStreetDecorations() {
        const decorationAssets = assetLoader.getDecorations();
        
        // Filter for street lamps
        const lampAssets = decorationAssets.filter(a => 
            a.name.includes('light') && !a.name.includes('construction')
        );
        
        if (lampAssets.length > 0) {
            const lampSpacing = 80;
            
            for (let z = -400; z <= 400; z += lampSpacing) {
                // Left side lamps
                this.placeLamp(-22, z, lampAssets);
                
                // Right side lamps
                this.placeLamp(22, z, lampAssets);
            }
        }

        // Construction cones near some areas
        const coneAssets = decorationAssets.filter(a => a.name.includes('cone'));
        if (coneAssets.length > 0) {
            // Small construction zone
            for (let i = 0; i < 6; i++) {
                this.placeCone(-15 + i * 5, -380, coneAssets);
            }
        }

        // Construction barriers
        const barrierAssets = decorationAssets.filter(a => 
            a.name.includes('barrier') || a.name.includes('construction-barrier')
        );
        if (barrierAssets.length > 0) {
            this.placeBarrier(-12, -400, barrierAssets);
            this.placeBarrier(0, -400, barrierAssets);
            this.placeBarrier(12, -400, barrierAssets);
        }

        // Highway signs
        const signAssets = decorationAssets.filter(a => a.name.includes('sign'));
        if (signAssets.length > 0) {
            this.placeSign(-25, -420, signAssets, Math.PI);
            this.placeSign(25, 420, signAssets, 0);
        }

        // Fences along the edges
        const fenceAssets = decorationAssets.filter(a => a.name.includes('fence'));
        if (fenceAssets.length > 0) {
            // Left edge fences
            for (let z = -400; z <= 400; z += 15) {
                this.placeFence(-80, z, fenceAssets, 0);
            }
            // Right edge fences
            for (let z = -400; z <= 400; z += 15) {
                this.placeFence(80, z, fenceAssets, 0);
            }
        }
    }

    // Place construction cone
    placeCone(x, z, coneAssets) {
        if (coneAssets.length === 0) return;
        const cone = assetLoader.cloneModel(coneAssets[0]);
        if (cone) {
            cone.position.set(x, 0, z);
            this.scene.add(cone);
        }
    }

    // Place barrier
    placeBarrier(x, z, barrierAssets) {
        if (barrierAssets.length === 0) return;
        const barrier = assetLoader.cloneModel(barrierAssets[0]);
        if (barrier) {
            barrier.position.set(x, 0, z);
            this.scene.add(barrier);
        }
    }

    // Place sign
    placeSign(x, z, signAssets, rotation = 0) {
        if (signAssets.length === 0) return;
        const sign = assetLoader.cloneModel(signAssets[0]);
        if (sign) {
            sign.position.set(x, 0, z);
            sign.rotation.y = rotation;
            this.scene.add(sign);
        }
    }

    // Place fence
    placeFence(x, z, fenceAssets, rotation = 0) {
        if (fenceAssets.length === 0) return;
        const randomFence = fenceAssets[Math.floor(Math.random() * fenceAssets.length)];
        const fence = assetLoader.cloneModel(randomFence);
        if (fence) {
            fence.position.set(x, 0, z);
            fence.rotation.y = rotation;
            this.scene.add(fence);
        }
    }

    // Place a lamp at position
    placeLamp(x, z, lampAssets) {
        if (lampAssets.length === 0) return;
        
        const lamp = assetLoader.cloneModel(lampAssets[0]);
        
        if (lamp) {
            lamp.position.set(x, 0, z);
            lamp.rotation.y = x > 0 ? Math.PI : 0;
            this.scene.add(lamp);
        }
    }

    // Place a flower at position
    placeFlower(x, z, flowerAssets) {
        // Skip if too close to checkpoint
        if (this.isNearCheckpoint(x, z, 15)) return;
        
        if (flowerAssets.length === 0) return;
        
        const randomFlower = flowerAssets[Math.floor(Math.random() * flowerAssets.length)];
        const flower = assetLoader.cloneModel(randomFlower);
        
        if (flower) {
            flower.position.set(x, 0, z);
            flower.rotation.y = Math.random() * Math.PI * 2;
            const scale = 5 + Math.random() * 3;
            flower.scale.set(scale, scale, scale);
            this.scene.add(flower);
            this.greenZones.push(flower);
        }
    }

    // Place grass at position
    placeGrass(x, z, grassAssets) {
        // Skip if too close to checkpoint
        if (this.isNearCheckpoint(x, z, 15)) return;
        
        if (grassAssets.length === 0) return;
        
        const randomGrass = grassAssets[Math.floor(Math.random() * grassAssets.length)];
        const grass = assetLoader.cloneModel(randomGrass);
        
        if (grass) {
            grass.position.set(x, 0, z);
            grass.rotation.y = Math.random() * Math.PI * 2;
            const scale = 6 + Math.random() * 5;
            grass.scale.set(scale, scale, scale);
            this.scene.add(grass);
        }
    }

    // Place a rock at position
    placeRock(x, z, rockAssets) {
        // Skip if too close to checkpoint
        if (this.isNearCheckpoint(x, z, 20)) return;
        
        if (rockAssets.length === 0) return;
        
        const randomRock = rockAssets[Math.floor(Math.random() * rockAssets.length)];
        const rock = assetLoader.cloneModel(randomRock);
        
        if (rock) {
            rock.position.set(x, 0, z);
            rock.rotation.y = Math.random() * Math.PI * 2;
            const scale = 4 + Math.random() * 6;
            rock.scale.set(scale, scale, scale);
            this.scene.add(rock);
        }
    }

    // Place a pot at position
    placePot(x, z, potAssets) {
        // Skip if too close to checkpoint
        if (this.isNearCheckpoint(x, z, 15)) return;
        
        if (potAssets.length === 0) return;
        
        const randomPot = potAssets[Math.floor(Math.random() * potAssets.length)];
        const pot = assetLoader.cloneModel(randomPot);
        
        if (pot) {
            pot.position.set(x, 0, z);
            pot.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(pot);
        }
    }

    // Place a bench at position
    placeBench(x, z, benchAssets, rotation = 0) {
        if (benchAssets.length === 0) return;
        
        const bench = assetLoader.cloneModel(benchAssets[0]);
        
        if (bench) {
            bench.position.set(x, 0, z);
            bench.rotation.y = rotation;
            this.scene.add(bench);
            this.greenZones.push(bench);
        }
    }

    // Place a log or stump at position
    placeLog(x, z, logAssets) {
        // Skip if too close to checkpoint
        if (this.isNearCheckpoint(x, z, 20)) return;
        
        if (logAssets.length === 0) return;
        
        const randomLog = logAssets[Math.floor(Math.random() * logAssets.length)];
        const log = assetLoader.cloneModel(randomLog);
        
        if (log) {
            log.position.set(x, 0, z);
            log.rotation.y = Math.random() * Math.PI * 2;
            const scale = 6 + Math.random() * 4;
            log.scale.set(scale, scale, scale);
            this.scene.add(log);
        }
    }

    // Place a mushroom at position
    placeMushroom(x, z, mushroomAssets) {
        // Skip if too close to checkpoint
        if (this.isNearCheckpoint(x, z, 15)) return;
        
        if (mushroomAssets.length === 0) return;
        
        const randomMushroom = mushroomAssets[Math.floor(Math.random() * mushroomAssets.length)];
        const mushroom = assetLoader.cloneModel(randomMushroom);
        
        if (mushroom) {
            mushroom.position.set(x, 0, z);
            mushroom.rotation.y = Math.random() * Math.PI * 2;
            const scale = 5 + Math.random() * 5;
            mushroom.scale.set(scale, scale, scale);
            this.scene.add(mushroom);
        }
    }

    // Get all environmental objects (for collision)
    getColliders() {
        return [...this.roads, ...this.sidewalks, ...this.greenZones];
    }
}

// Singleton instance
const environment = new Environment();
export default environment;
