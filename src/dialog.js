import * as THREE from 'three';
import player from './player.js';
import { audioSystem } from './audio.js';

class DialogSystem {
    constructor() {
        this.scene = null;
        this.activeDialog = null;
        this.dialogBubbles = new Map();
        this.npcs = [];
        this.currentNPC = null;
        this.isDialogOpen = false;
        this.dialogQueue = [];
        
        // Dialog settings
        this.proximityDistance = 20;
        this.interactDistance = 12;
        
        // NPC dialog data
        this.npcDialogs = {
            greeting: [
                "Halo! Senang bertemu denganmu!",
                "Hai! Selamat datang di kota pembelajaran!",
                "Wah, ada pengunjung baru! Hai!",
                "Selamat datang, pelajar yang rajin!",
                "Hei! Aku sudah menunggumu!"
            ],
            intro: [
                "Aku di sini untuk membantumu belajar {topic}.",
                "Mau belajar tentang {topic}? Aku bisa bantu!",
                "Topik hari ini adalah {topic}. Menarik kan?",
                "Yuk, kita pelajari {topic} bersama!",
                "Ada video keren tentang {topic} lho!"
            ],
            encourage: [
                "Kamu pasti bisa memahami ini!",
                "Jangan khawatir, materinya seru kok!",
                "Belajar itu menyenangkan!",
                "Semangat! Kamu akan jadi pintar!",
                "Ini akan mudah dipahami, percaya deh!"
            ],
            prompt: [
                "Tekan [E] untuk mulai belajar!",
                "Siap belajar? Tekan [E]!",
                "Klik [E] untuk menonton videonya!",
                "Ayo mulai! Tekan tombol [E]!",
                "Tekan [E] dan mari kita mulai!"
            ]
        };
    }

    // Initialize dialog system
    init(scene) {
        this.scene = scene;
        this.createDialogUI();
        this.setupInteractionKey();
    }

    // Create dialog UI elements
    createDialogUI() {
        // Main dialog container
        const dialogContainer = document.createElement('div');
        dialogContainer.id = 'dialogContainer';
        dialogContainer.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-header">
                    <div class="npc-avatar">
                        <i class="fas fa-user-tie" id="npcIcon"></i>
                    </div>
                    <div class="npc-info">
                        <span class="npc-name" id="npcName">NPC</span>
                        <span class="npc-role" id="npcRole">Pengajar</span>
                    </div>
                </div>
                <div class="dialog-content">
                    <p id="dialogText"></p>
                    <div class="dialog-typing" id="dialogTyping">
                        <span></span><span></span><span></span>
                    </div>
                </div>
                <div class="dialog-actions">
                    <button class="dialog-btn dialog-btn-primary" id="dialogActionBtn">
                        <i class="fas fa-play"></i>
                        <span id="dialogActionText">Lanjutkan</span>
                    </button>
                    <button class="dialog-btn dialog-btn-secondary" id="dialogSkipBtn">
                        <i class="fas fa-times"></i> Nanti saja
                    </button>
                </div>
                <div class="dialog-hint">
                    <kbd>E</kbd> Bicara &nbsp; <kbd>ESC</kbd> Tutup
                </div>
            </div>
        `;
        dialogContainer.style.display = 'none';
        document.body.appendChild(dialogContainer);

        // Proximity indicator (shows when near NPC)
        const proximityIndicator = document.createElement('div');
        proximityIndicator.id = 'proximityIndicator';
        proximityIndicator.innerHTML = `
            <div class="proximity-content">
                <div class="proximity-icon"><i class="fas fa-comments"></i></div>
                <div class="proximity-text">
                    <span id="proximityNpcName">NPC</span>
                    <span class="proximity-hint">Tekan <kbd>E</kbd> untuk bicara</span>
                </div>
            </div>
        `;
        proximityIndicator.style.display = 'none';
        document.body.appendChild(proximityIndicator);

        // Store references
        this.dialogContainer = dialogContainer;
        this.proximityIndicator = proximityIndicator;
        this.dialogText = document.getElementById('dialogText');
        this.dialogTyping = document.getElementById('dialogTyping');
        this.dialogActionBtn = document.getElementById('dialogActionBtn');
        this.dialogSkipBtn = document.getElementById('dialogSkipBtn');
        this.npcNameEl = document.getElementById('npcName');
        this.npcRoleEl = document.getElementById('npcRole');
        this.npcIconEl = document.getElementById('npcIcon');
        this.proximityNpcName = document.getElementById('proximityNpcName');

        // Setup button events
        this.dialogActionBtn.addEventListener('click', () => this.onDialogAction());
        this.dialogSkipBtn.addEventListener('click', () => this.closeDialog());
    }

    // Setup interaction key (E)
    setupInteractionKey() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE' && !e.repeat) {
                if (this.isDialogOpen) {
                    // Progress dialog or start learning
                    this.onDialogAction();
                } else if (this.currentNPC) {
                    // Open dialog with nearby NPC
                    this.startDialog(this.currentNPC);
                }
            }
            
            if (e.code === 'Escape' && this.isDialogOpen) {
                this.closeDialog();
            }
        });
    }

    // Register an NPC
    registerNPC(npc) {
        this.npcs.push(npc);
        this.createBubbleForNPC(npc);
    }

    // Create 3D speech bubble for NPC
    createBubbleForNPC(npc) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;

        // Draw bubble background
        context.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.drawBubble(context, 10, 10, 236, 90, 15);
        context.fill();

        // Draw bubble border
        context.strokeStyle = '#4CAF50';
        context.lineWidth = 3;
        this.drawBubble(context, 10, 10, 236, 90, 15);
        context.stroke();

        // Draw "..." thinking indicator
        context.fillStyle = '#666';
        context.font = 'bold 40px Arial';
        context.textAlign = 'center';
        context.fillText('💬', 128, 60);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0
        });

        const bubble = new THREE.Sprite(spriteMaterial);
        bubble.scale.set(8, 4, 1);
        bubble.visible = false;

        npc.bubble = bubble;
        npc.bubbleMaterial = spriteMaterial;
        
        if (npc.character) {
            bubble.position.set(0, 5, 0);
            npc.character.add(bubble);
        }

        this.dialogBubbles.set(npc.id, bubble);
    }

    // Draw speech bubble shape
    drawBubble(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        
        // Bubble tail
        ctx.lineTo(x + width * 0.6, y + height);
        ctx.lineTo(x + width * 0.5, y + height + 15);
        ctx.lineTo(x + width * 0.4, y + height);
        
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // Update dialog system (called every frame)
    update(time) {
        if (this.isDialogOpen) return;

        const playerPos = player.getPosition();
        let nearestNPC = null;
        let nearestDistance = Infinity;

        // Check proximity to all NPCs
        this.npcs.forEach(npc => {
            if (npc.checkpoint && npc.checkpoint.completed) {
                // Hide bubble for completed checkpoints
                if (npc.bubble) {
                    npc.bubble.visible = false;
                }
                return;
            }

            const npcPos = npc.character ? npc.character.position : npc.position;
            const distance = playerPos.distanceTo(npcPos);

            // Show/hide bubble based on proximity
            if (npc.bubble) {
                if (distance < this.proximityDistance) {
                    npc.bubble.visible = true;
                    // Animate bubble
                    const pulseScale = 1 + Math.sin(time * 4) * 0.1;
                    npc.bubble.scale.set(8 * pulseScale, 4 * pulseScale, 1);
                    npc.bubbleMaterial.opacity = Math.min(1, (this.proximityDistance - distance) / 5);
                } else {
                    npc.bubble.visible = false;
                }
            }

            // Track nearest NPC within interaction distance
            if (distance < this.interactDistance && distance < nearestDistance) {
                nearestDistance = distance;
                nearestNPC = npc;
            }
        });

        // Update current NPC and proximity indicator
        if (nearestNPC !== this.currentNPC) {
            this.currentNPC = nearestNPC;
            
            if (nearestNPC) {
                this.showProximityIndicator(nearestNPC);
                // Play proximity ping sound
                audioSystem.playCheckpointNear();
            } else {
                this.hideProximityIndicator();
            }
        }
    }

    // Show proximity indicator
    showProximityIndicator(npc) {
        if (this.proximityNpcName) {
            this.proximityNpcName.textContent = npc.name || 'Pengajar';
        }
        this.proximityIndicator.style.display = 'flex';
        this.proximityIndicator.classList.add('show');
    }

    // Hide proximity indicator
    hideProximityIndicator() {
        this.proximityIndicator.classList.remove('show');
        setTimeout(() => {
            if (!this.proximityIndicator.classList.contains('show')) {
                this.proximityIndicator.style.display = 'none';
            }
        }, 300);
    }

    // Start dialog with NPC
    startDialog(npc) {
        this.isDialogOpen = true;
        this.currentDialogNPC = npc;
        this.dialogStep = 0;
        
        // Pause player
        player.setCanMove(false);
        
        // Hide proximity indicator
        this.hideProximityIndicator();

        // Setup dialog content
        const topic = npc.checkpoint ? npc.checkpoint.topicName : 'Matematika';
        
        // NPC icons based on index
        const npcIcons = [
            'fa-user-tie', 'fa-user-graduate', 'fa-chalkboard-teacher', 'fa-user-astronaut',
            'fa-user-ninja', 'fa-user-secret', 'fa-user-md', 'fa-user-nurse',
            'fa-user-cog', 'fa-user-shield', 'fa-user-check', 'fa-user-edit'
        ];
        const iconClass = npcIcons[npc.checkpoint ? npc.checkpoint.id % npcIcons.length : 0];
        
        this.npcNameEl.textContent = npc.name || 'Pengajar';
        this.npcRoleEl.textContent = `Guru ${topic}`;
        if (this.npcIconEl) {
            this.npcIconEl.className = `fas ${iconClass}`;
        }

        // Build dialog sequence
        this.dialogQueue = [
            this.getRandomDialog('greeting'),
            this.getRandomDialog('intro').replace('{topic}', topic),
            this.getRandomDialog('encourage'),
            this.getRandomDialog('prompt')
        ];

        // Show dialog
        this.dialogContainer.style.display = 'flex';
        
        // Play dialog open sound
        audioSystem.playDialogOpen();
        
        // Start typing first message
        this.typeDialog(this.dialogQueue[0]);

        // Trigger excited animation on NPC
        if (npc.onDialogStart) {
            npc.onDialogStart();
        }
    }

    // Get random dialog from category
    getRandomDialog(category) {
        const dialogs = this.npcDialogs[category];
        return dialogs[Math.floor(Math.random() * dialogs.length)];
    }

    // Type dialog with animation
    typeDialog(text) {
        this.dialogTyping.style.display = 'flex';
        this.dialogText.textContent = '';
        
        let index = 0;
        const typeSpeed = 30;

        setTimeout(() => {
            this.dialogTyping.style.display = 'none';
            
            const typeInterval = setInterval(() => {
                if (index < text.length) {
                    this.dialogText.textContent += text[index];
                    // Play typing sound every few characters
                    if (index % 3 === 0) {
                        audioSystem.playTyping();
                    }
                    index++;
                } else {
                    clearInterval(typeInterval);
                }
            }, typeSpeed);
        }, 500);
    }

    // Handle dialog action button
    onDialogAction() {
        this.dialogStep++;
        audioSystem.playClick();

        if (this.dialogStep < this.dialogQueue.length) {
            // Show next dialog
            this.typeDialog(this.dialogQueue[this.dialogStep]);
            
            // Update button on last step
            if (this.dialogStep === this.dialogQueue.length - 1) {
                document.getElementById('dialogActionText').textContent = 'Mulai Belajar!';
                this.dialogActionBtn.querySelector('i').className = 'fas fa-video';
            }
        } else {
            // Start learning - save reference before closing
            const npc = this.currentDialogNPC;
            
            // Close dialog first
            this.isDialogOpen = false;
            this.dialogContainer.style.display = 'none';
            this.dialogStep = 0;
            this.dialogQueue = [];
            document.getElementById('dialogActionText').textContent = 'Lanjutkan';
            this.dialogActionBtn.querySelector('i').className = 'fas fa-play';
            
            // Trigger checkpoint learning
            if (npc && npc.onStartLearning) {
                npc.onStartLearning();
            }
            
            this.currentDialogNPC = null;
        }
    }

    // Close dialog
    closeDialog() {
        this.isDialogOpen = false;
        this.dialogContainer.style.display = 'none';
        this.dialogStep = 0;
        this.dialogQueue = [];
        
        // Play close sound
        audioSystem.playDialogClose();
        
        // Reset button text
        document.getElementById('dialogActionText').textContent = 'Lanjutkan';
        
        // Resume player if not starting learning
        if (!this.currentDialogNPC?.startingLearning) {
            player.setCanMove(true);
        }
        
        this.currentDialogNPC = null;
    }

    // Check if dialog is currently open
    isOpen() {
        return this.isDialogOpen;
    }
}

const dialogSystem = new DialogSystem();
export default dialogSystem;
