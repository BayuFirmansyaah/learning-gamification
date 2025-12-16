import * as THREE from 'three';
import player from './player.js';
import checkpointSystem from './checkpoints.js';
import buildingsManager from './buildings.js';

class Minimap {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.compassCanvas = null;
        this.compassCtx = null;
        this.size = 180;
        this.scale = 0.2; // World to minimap scale
        this.isVisible = true;
    }

    // Initialize minimap
    init() {
        this.createMinimapUI();
        this.createCompassUI();
        this.setupToggle();
    }

    // Create minimap canvas
    createMinimapUI() {
        // Container
        const container = document.createElement('div');
        container.id = 'minimapContainer';
        container.innerHTML = `
            <div class="minimap-frame">
                <canvas id="minimapCanvas" width="${this.size}" height="${this.size}"></canvas>
                <div class="minimap-overlay"></div>
            </div>
            <div class="minimap-legend">
                <span class="legend-item"><span class="dot player"></span> Anda</span>
                <span class="legend-item"><span class="dot checkpoint"></span> Checkpoint</span>
                <span class="legend-item"><span class="dot completed"></span> Selesai</span>
            </div>
        `;
        document.body.appendChild(container);

        this.canvas = document.getElementById('minimapCanvas');
        this.ctx = this.canvas.getContext('2d');
    }

    // Create compass UI
    createCompassUI() {
        const compassContainer = document.createElement('div');
        compassContainer.id = 'compassContainer';
        compassContainer.innerHTML = `
            <canvas id="compassCanvas" width="60" height="60"></canvas>
            <div class="compass-directions">
                <span class="dir-n">U</span>
                <span class="dir-e">T</span>
                <span class="dir-s">S</span>
                <span class="dir-w">B</span>
            </div>
        `;
        document.body.appendChild(compassContainer);

        this.compassCanvas = document.getElementById('compassCanvas');
        this.compassCtx = this.compassCanvas.getContext('2d');
    }

    // Setup toggle key (M)
    setupToggle() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM') {
                this.toggle();
            }
        });
    }

    // Toggle minimap visibility
    toggle() {
        this.isVisible = !this.isVisible;
        const container = document.getElementById('minimapContainer');
        const compass = document.getElementById('compassContainer');
        if (container) {
            container.style.display = this.isVisible ? 'block' : 'none';
        }
        if (compass) {
            compass.style.display = this.isVisible ? 'block' : 'none';
        }
    }

    // Update minimap
    update() {
        if (!this.isVisible || !this.ctx) return;

        const playerPos = player.getPosition();
        const playerDir = player.getDirection();

        // Clear canvas
        this.ctx.fillStyle = 'rgba(20, 30, 40, 0.9)';
        this.ctx.fillRect(0, 0, this.size, this.size);

        // Draw grid
        this.drawGrid();

        // Draw roads
        this.drawRoads();

        // Draw buildings
        this.drawBuildings(playerPos);

        // Draw checkpoints
        this.drawCheckpoints(playerPos);

        // Draw train track
        this.drawTrainTrack(playerPos);

        // Draw player
        this.drawPlayer(playerDir);

        // Draw distance to nearest checkpoint
        this.drawDistanceIndicator(playerPos);

        // Update compass
        this.updateCompass(playerDir);
    }

    // Draw background grid
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(100, 120, 140, 0.3)';
        this.ctx.lineWidth = 0.5;

        const gridSize = 20;
        for (let i = 0; i <= this.size; i += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.size);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.size, i);
            this.ctx.stroke();
        }
    }

    // Draw roads on minimap
    drawRoads() {
        const centerX = this.size / 2;

        // Main road (vertical line in center)
        this.ctx.fillStyle = 'rgba(60, 60, 60, 0.8)';
        this.ctx.fillRect(centerX - 8, 0, 16, this.size);

        // Road markings
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, this.size);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    // Draw buildings
    drawBuildings(playerPos) {
        const buildings = buildingsManager.getBuildings();
        const centerX = this.size / 2;
        const centerY = this.size / 2;

        buildings.forEach(building => {
            // Calculate relative position
            const relX = (building.position.x - playerPos.x) * this.scale;
            const relZ = (building.position.z - playerPos.z) * this.scale;

            const screenX = centerX + relX;
            const screenY = centerY + relZ;

            // Only draw if on screen
            if (screenX > -10 && screenX < this.size + 10 && 
                screenY > -10 && screenY < this.size + 10) {
                
                this.ctx.fillStyle = 'rgba(100, 100, 120, 0.8)';
                this.ctx.fillRect(screenX - 6, screenY - 6, 12, 12);
                
                // Building outline
                this.ctx.strokeStyle = 'rgba(150, 150, 170, 0.5)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(screenX - 6, screenY - 6, 12, 12);
            }
        });
    }

    // Draw checkpoints
    drawCheckpoints(playerPos) {
        const checkpoints = checkpointSystem.checkpoints;
        const centerX = this.size / 2;
        const centerY = this.size / 2;

        checkpoints.forEach((checkpoint, index) => {
            const relX = (checkpoint.position.x - playerPos.x) * this.scale;
            const relZ = (checkpoint.position.z - playerPos.z) * this.scale;

            const screenX = centerX + relX;
            const screenY = centerY + relZ;

            // Only draw if on screen
            if (screenX > -10 && screenX < this.size + 10 && 
                screenY > -10 && screenY < this.size + 10) {
                
                // Checkpoint marker
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
                
                if (checkpoint.completed) {
                    this.ctx.fillStyle = '#2ecc71'; // Green for completed
                } else {
                    this.ctx.fillStyle = '#e74c3c'; // Red for pending
                    
                    // Pulse effect for pending checkpoints
                    const pulse = Math.sin(Date.now() * 0.005 + index) * 0.3 + 0.7;
                    this.ctx.globalAlpha = pulse;
                }
                
                this.ctx.fill();
                this.ctx.globalAlpha = 1;

                // Checkpoint number
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 8px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText((index + 1).toString(), screenX, screenY);
            }
        });
    }

    // Draw train track
    drawTrainTrack(playerPos) {
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        const trackOffset = 140 * this.scale;

        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([3, 3]);

        // Left track
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - trackOffset, 0);
        this.ctx.lineTo(centerX - trackOffset, this.size);
        this.ctx.stroke();

        // Right track
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + trackOffset, 0);
        this.ctx.lineTo(centerX + trackOffset, this.size);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    // Draw player marker
    drawPlayer(playerDir) {
        const centerX = this.size / 2;
        const centerY = this.size / 2;

        // Player direction arrow
        const angle = Math.atan2(playerDir.x, playerDir.z);

        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(-angle);

        // Outer glow
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        this.ctx.fill();

        // Arrow shape
        this.ctx.beginPath();
        this.ctx.moveTo(0, -8);
        this.ctx.lineTo(-5, 6);
        this.ctx.lineTo(0, 3);
        this.ctx.lineTo(5, 6);
        this.ctx.closePath();

        this.ctx.fillStyle = '#3498db';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.restore();
    }

    // Draw distance to nearest checkpoint
    drawDistanceIndicator(playerPos) {
        const checkpoints = checkpointSystem.checkpoints;
        let nearestDist = Infinity;
        let nearestCheckpoint = null;

        checkpoints.forEach(checkpoint => {
            if (checkpoint.completed) return;
            const dist = playerPos.distanceTo(checkpoint.position);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestCheckpoint = checkpoint;
            }
        });

        if (nearestCheckpoint) {
            // Distance text at bottom
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, this.size - 20, this.size, 20);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const distText = nearestDist < 100 
                ? `${Math.round(nearestDist)}m ke Checkpoint ${nearestCheckpoint.id + 1}`
                : `${Math.round(nearestDist)}m`;
            this.ctx.fillText(distText, this.size / 2, this.size - 10);
        }
    }

    // Update compass
    updateCompass(playerDir) {
        if (!this.compassCtx) return;

        const size = 60;
        const center = size / 2;

        // Clear
        this.compassCtx.clearRect(0, 0, size, size);

        // Background circle
        this.compassCtx.beginPath();
        this.compassCtx.arc(center, center, 28, 0, Math.PI * 2);
        this.compassCtx.fillStyle = 'rgba(20, 30, 40, 0.9)';
        this.compassCtx.fill();
        this.compassCtx.strokeStyle = 'rgba(100, 150, 200, 0.5)';
        this.compassCtx.lineWidth = 2;
        this.compassCtx.stroke();

        // Calculate rotation based on player direction
        const angle = Math.atan2(playerDir.x, playerDir.z);

        this.compassCtx.save();
        this.compassCtx.translate(center, center);
        this.compassCtx.rotate(angle);

        // North pointer (red)
        this.compassCtx.beginPath();
        this.compassCtx.moveTo(0, -22);
        this.compassCtx.lineTo(-6, 0);
        this.compassCtx.lineTo(0, -5);
        this.compassCtx.lineTo(6, 0);
        this.compassCtx.closePath();
        this.compassCtx.fillStyle = '#e74c3c';
        this.compassCtx.fill();

        // South pointer (white)
        this.compassCtx.beginPath();
        this.compassCtx.moveTo(0, 22);
        this.compassCtx.lineTo(-6, 0);
        this.compassCtx.lineTo(0, 5);
        this.compassCtx.lineTo(6, 0);
        this.compassCtx.closePath();
        this.compassCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.compassCtx.fill();

        this.compassCtx.restore();

        // Center dot
        this.compassCtx.beginPath();
        this.compassCtx.arc(center, center, 3, 0, Math.PI * 2);
        this.compassCtx.fillStyle = '#fff';
        this.compassCtx.fill();
    }
}

const minimap = new Minimap();
export default minimap;
