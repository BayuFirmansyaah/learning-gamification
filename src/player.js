import * as THREE from 'three';
import assetLoader from './assetLoader.js';
import { audioSystem } from './audio.js';

class Player {
    constructor() {
        this.camera = null;
        this.controls = null;
        this.character = null;
        this.mixer = null; // For animations if available
        
        // Movement state
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        // Player settings
        this.speed = 15.0;
        this.sprintSpeed = 30.0;
        this.currentSpeed = this.speed;
        this.isSprinting = false;
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaDrain = 20; // per second while sprinting
        this.staminaRegen = 15; // per second while not sprinting
        this.rotationSpeed = 5.0;
        this.isLocked = false;
        this.canMove = true;
        
        // Third person camera settings
        this.cameraDistance = 12;
        this.cameraHeight = 8;
        this.cameraLookHeight = 3;
        
        // Character position
        this.position = new THREE.Vector3(0, 0, 100);
        this.targetRotation = 0;
        this.currentRotation = 0;
        
        // Collision detection
        this.colliders = [];
        this.playerRadius = 1.5;
        
        // Walking animation
        this.walkTime = 0;
        this.isWalking = false;
        
        // Character parts for animation
        this.leftArm = null;
        this.rightArm = null;
        this.leftLeg = null;
        this.rightLeg = null;
        
        // Boundaries
        this.bounds = {
            minX: -50,
            maxX: 50,
            minZ: -100,
            maxZ: 100
        };
        
        // Scene reference
        this.scene = null;
    }

    // Initialize player controls
    init(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Set initial camera position
        this.camera.position.set(0, this.cameraHeight, this.position.z + this.cameraDistance);
        this.camera.lookAt(this.position.x, this.cameraLookHeight, this.position.z);
        
        // Setup keyboard event listeners
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse controls for camera rotation around character
        this.setupMouseControls(domElement);
        
        return null; // No PointerLockControls needed
    }

    // Setup mouse controls for third-person camera
    setupMouseControls(domElement) {
        this.mouseX = 0;
        this.mouseY = 0;
        this.cameraAngle = 0;
        this.cameraPitch = 0.3; // Slight downward angle
        
        let isMouseDown = false;
        
        domElement.addEventListener('mousedown', (e) => {
            if (e.button === 0 || e.button === 2) { // Left or right click
                isMouseDown = true;
                this.isLocked = true;
                document.getElementById('crosshair').style.display = 'none';
            }
        });
        
        domElement.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        domElement.addEventListener('mousemove', (e) => {
            if (isMouseDown && this.canMove) {
                // Faster and more responsive camera rotation
                this.cameraAngle -= e.movementX * 0.008;
                this.cameraPitch = Math.max(-0.3, Math.min(0.6, this.cameraPitch + e.movementY * 0.004));
            }
        });
        
        // Mouse wheel to zoom
        domElement.addEventListener('wheel', (e) => {
            this.cameraDistance = Math.max(5, Math.min(25, this.cameraDistance + e.deltaY * 0.01));
        });
        
        // Context menu prevention
        domElement.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Q key for camera rotation left (E is reserved for interaction)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyQ') {
                this.cameraAngle += 0.1;
            } else if (e.code === 'KeyR') {
                this.cameraAngle -= 0.1;
            }
        });
    }

    // Set scene reference and load character
    setScene(scene) {
        this.scene = scene;
        this.loadCharacter();
    }

    // Load player character model
    async loadCharacter() {
        try {
            const characterPath = './models/kenney_blocky-characters/Models/GLB format/character-a.glb';
            const model = await assetLoader.loadModel(characterPath);
            
            if (model) {
                this.character = new THREE.Group();
                this.character.position.copy(this.position);
                
                // Add the model to a body group for animation
                this.bodyGroup = new THREE.Group();
                model.scale.set(1.5, 1.5, 1.5);
                this.bodyGroup.add(model);
                this.character.add(this.bodyGroup);
                
                // Enable shadows
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                this.scene.add(this.character);
                console.log('Player character loaded');
            }
        } catch (error) {
            console.warn('Failed to load player character, using placeholder', error);
            this.createPlaceholderCharacter();
        }
    }

    // Create a placeholder character if model fails to load
    createPlaceholderCharacter() {
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.2, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xf5d0a9 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.6;
        head.castShadow = true;
        group.add(head);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 2.65, 0.35);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 2.65, 0.35);
        group.add(rightEye);
        
        this.character = group;
        this.character.position.copy(this.position);
        this.scene.add(this.character);
    }

    // Handle key down
    onKeyDown(event) {
        if (!this.canMove) return;
        
        // Mark as locked when movement starts
        this.isLocked = true;
        
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                if (this.stamina > 10) {
                    this.isSprinting = true;
                }
                break;
        }
    }

    // Handle key up
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.isSprinting = false;
                break;
        }
    }

    // Lock (start game)
    lock() {
        this.isLocked = true;
        document.getElementById('crosshair').style.display = 'none';
    }

    // Unlock
    unlock() {
        this.isLocked = false;
    }

    // Set whether player can move
    setCanMove(canMove) {
        this.canMove = canMove;
        if (!canMove) {
            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
            this.velocity.set(0, 0, 0);
        }
    }

    // Set collision objects
    setColliders(colliders) {
        this.colliders = colliders;
    }

    // Add a single collider
    addCollider(collider) {
        this.colliders.push(collider);
    }

    // Set movement boundaries
    setBounds(bounds) {
        this.bounds = { ...this.bounds, ...bounds };
    }

    // Check collision with objects
    checkCollision(newPosition) {
        // Simple boundary check
        if (newPosition.x < this.bounds.minX || newPosition.x > this.bounds.maxX ||
            newPosition.z < this.bounds.minZ || newPosition.z > this.bounds.maxZ) {
            return true;
        }

        // Check collision with collider objects
        for (const collider of this.colliders) {
            if (!collider.geometry) continue;
            
            const box = new THREE.Box3().setFromObject(collider);
            const playerBox = new THREE.Box3(
                new THREE.Vector3(
                    newPosition.x - this.playerRadius,
                    0,
                    newPosition.z - this.playerRadius
                ),
                new THREE.Vector3(
                    newPosition.x + this.playerRadius,
                    3,
                    newPosition.z + this.playerRadius
                )
            );

            if (box.intersectsBox(playerBox)) {
                return true;
            }
        }

        return false;
    }

    // Update player position
    update(delta) {
        if (!this.canMove) return;

        // Handle stamina and sprinting
        this.updateStamina(delta);

        // Calculate movement direction based on camera angle
        const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        this.isWalking = isMoving;
        
        // Determine current speed
        this.currentSpeed = (this.isSprinting && this.stamina > 0) ? this.sprintSpeed : this.speed;
        
        if (isMoving) {
            // Calculate movement vector relative to camera
            let moveX = 0;
            let moveZ = 0;
            
            if (this.moveForward) moveZ -= 1;
            if (this.moveBackward) moveZ += 1;
            if (this.moveLeft) moveX -= 1;
            if (this.moveRight) moveX += 1;
            
            // Normalize diagonal movement
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            if (length > 0) {
                moveX /= length;
                moveZ /= length;
            }
            
            // Rotate movement by camera angle
            const sin = Math.sin(this.cameraAngle);
            const cos = Math.cos(this.cameraAngle);
            const rotatedX = moveX * cos - moveZ * sin;
            const rotatedZ = moveX * sin + moveZ * cos;
            
            // Calculate new position using current speed
            const newPosition = this.position.clone();
            newPosition.x += rotatedX * this.currentSpeed * delta;
            newPosition.z += rotatedZ * this.currentSpeed * delta;
            
            // Check collision and apply movement
            if (!this.checkCollision(newPosition)) {
                this.position.copy(newPosition);
            } else {
                // Try X only
                newPosition.copy(this.position);
                newPosition.x += rotatedX * this.currentSpeed * delta;
                if (!this.checkCollision(newPosition)) {
                    this.position.x = newPosition.x;
                }
                
                // Try Z only
                newPosition.copy(this.position);
                newPosition.z += rotatedZ * this.currentSpeed * delta;
                if (!this.checkCollision(newPosition)) {
                    this.position.z = newPosition.z;
                }
            }
            
            // Update character rotation to face movement direction
            this.targetRotation = Math.atan2(rotatedX, rotatedZ);
            
            // Auto-rotate camera to follow behind character when moving forward
            if (this.moveForward && !this.moveLeft && !this.moveRight) {
                // Smoothly rotate camera to be behind character
                const targetCameraAngle = this.targetRotation + Math.PI;
                let angleDiff = targetCameraAngle - this.cameraAngle;
                // Normalize angle difference
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                this.cameraAngle += angleDiff * 0.02; // Slow follow
            }
            
            // Walking animation - faster when sprinting
            const animSpeed = this.isSprinting && this.stamina > 0 ? 18 : 10;
            this.walkTime += delta * animSpeed;
            
            // Play footstep sounds
            audioSystem.updateWalking(true, this.isSprinting && this.stamina > 0);
        }
        
        // Smoothly rotate character (faster rotation)
        const rotationDiff = this.targetRotation - this.currentRotation;
        // Handle angle wrapping
        let adjustedDiff = rotationDiff;
        if (adjustedDiff > Math.PI) adjustedDiff -= Math.PI * 2;
        if (adjustedDiff < -Math.PI) adjustedDiff += Math.PI * 2;
        this.currentRotation += adjustedDiff * 8.0 * delta; // Faster rotation
        
        // Update character position and rotation
        if (this.character) {
            this.character.position.copy(this.position);
            this.character.rotation.y = this.currentRotation;
            
            // Human-like walking animation
            if (this.isWalking) {
                // Vertical bobbing (up and down with each step) - more intense when sprinting
                const bobMultiplier = this.isSprinting && this.stamina > 0 ? 1.5 : 1;
                const bobAmount = Math.abs(Math.sin(this.walkTime * 2)) * 0.12 * bobMultiplier;
                this.character.position.y = bobAmount;
                
                // Body sway (slight left-right tilt)
                if (this.bodyGroup) {
                    this.bodyGroup.rotation.z = Math.sin(this.walkTime) * 0.04;
                    // Slight forward lean when walking
                    this.bodyGroup.rotation.x = 0.05;
                    // Hip rotation
                    this.bodyGroup.rotation.y = Math.sin(this.walkTime) * 0.03;
                }
            } else {
                this.character.position.y = 0;
                // Reset body rotation when standing
                if (this.bodyGroup) {
                    this.bodyGroup.rotation.z *= 0.9;
                    this.bodyGroup.rotation.x *= 0.9;
                    this.bodyGroup.rotation.y *= 0.9;
                }
            }
        }
        
        // Update camera to follow character
        this.updateCamera();
    }

    // Update camera position to follow character
    updateCamera() {
        if (!this.camera) return;
        
        // Calculate target camera position based on angle and distance
        // Use base position (not affected by walking bob)
        const targetCameraX = this.position.x + Math.sin(this.cameraAngle) * this.cameraDistance;
        const targetCameraZ = this.position.z + Math.cos(this.cameraAngle) * this.cameraDistance;
        const targetCameraY = this.cameraHeight + this.cameraPitch * this.cameraDistance;
        
        // Very smooth camera interpolation for cinematic feel
        const smoothFactor = 0.05; // Lower = smoother
        this.camera.position.x += (targetCameraX - this.camera.position.x) * smoothFactor;
        this.camera.position.y += (targetCameraY - this.camera.position.y) * smoothFactor;
        this.camera.position.z += (targetCameraZ - this.camera.position.z) * smoothFactor;
        
        // Smooth look target (don't follow character bobbing)
        const lookTarget = new THREE.Vector3(
            this.position.x,
            this.cameraLookHeight,
            this.position.z
        );
        
        // Smoothly interpolate where camera looks
        if (!this.currentLookTarget) {
            this.currentLookTarget = lookTarget.clone();
        }
        this.currentLookTarget.lerp(lookTarget, 0.08);
        this.camera.lookAt(this.currentLookTarget);
    }

    // Get player position
    getPosition() {
        return this.position.clone();
    }

    // Get player direction
    getDirection() {
        return new THREE.Vector3(
            Math.sin(this.currentRotation),
            0,
            Math.cos(this.currentRotation)
        );
    }

    // Check if controls are locked (game started)
    isControlsLocked() {
        return this.isLocked;
    }

    // Update stamina
    updateStamina(delta) {
        const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        const wasSprinting = this.isSprinting && this.stamina > 0;
        
        if (this.isSprinting && isMoving) {
            // Drain stamina while sprinting
            this.stamina -= this.staminaDrain * delta;
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.isSprinting = false;
                audioSystem.playStaminaLow();
            } else if (this.stamina < 20 && this.stamina + this.staminaDrain * delta >= 20) {
                // Warning when low
                audioSystem.playStaminaLow();
            }
        } else {
            // Regenerate stamina when not sprinting
            this.stamina += this.staminaRegen * delta;
            if (this.stamina > this.maxStamina) {
                this.stamina = this.maxStamina;
            }
        }

        // Update stamina bar UI
        this.updateStaminaUI();
    }

    // Update stamina bar UI
    updateStaminaUI() {
        let staminaBar = document.getElementById('staminaBar');
        let staminaContainer = document.getElementById('staminaContainer');
        
        if (!staminaContainer) {
            // Create stamina UI
            staminaContainer = document.createElement('div');
            staminaContainer.id = 'staminaContainer';
            staminaContainer.innerHTML = `
                <div class="stamina-label"><i class="fas fa-bolt"></i> STAMINA</div>
                <div class="stamina-bar-bg">
                    <div id="staminaBar" class="stamina-bar-fill"></div>
                </div>
            `;
            document.body.appendChild(staminaContainer);
            staminaBar = document.getElementById('staminaBar');
        }

        // Update bar width
        const percent = (this.stamina / this.maxStamina) * 100;
        staminaBar.style.width = `${percent}%`;

        // Change color based on stamina level
        if (percent < 20) {
            staminaBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        } else if (percent < 50) {
            staminaBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        } else {
            staminaBar.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
        }

        // Show/hide based on sprinting or low stamina
        if (this.isSprinting || this.stamina < this.maxStamina) {
            staminaContainer.style.opacity = '1';
        } else {
            staminaContainer.style.opacity = '0.3';
        }
    }

    // Get stamina percentage
    getStaminaPercent() {
        return (this.stamina / this.maxStamina) * 100;
    }

    // Check if sprinting
    getIsSprinting() {
        return this.isSprinting && this.stamina > 0;
    }
}

// Singleton instance
const player = new Player();
export default player;
