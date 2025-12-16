import checkpointSystem from './checkpoints.js';
import player from './player.js';
import youtubeManager from './youtube.js';

class UI {
    constructor() {
        this.startScreen = null;
        this.learningPopup = null;
        this.progressHUD = null;
        this.continueButton = null;
        this.currentCheckpoint = null;
    }

    // Initialize UI elements
    init() {
        this.startScreen = document.getElementById('startScreen');
        this.learningPopup = document.getElementById('learningPopup');
        this.progressHUD = document.getElementById('progressHUD');
        this.continueButton = document.getElementById('continueButton');
        this.popupTitle = document.getElementById('popupTitle');
        this.videoContainer = document.getElementById('videoContainer');
        this.checkpointCount = document.getElementById('checkpointCount');
        this.watchProgress = document.getElementById('watchProgress');
        this.videoProgressFill = document.getElementById('videoProgressFill');
        this.popupCheckpointInfo = document.getElementById('popupCheckpointInfo');
        this.watchTimer = document.getElementById('watchTimer');

        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Start button
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => this.startGame());
        }

        // Continue button
        if (this.continueButton) {
            this.continueButton.addEventListener('click', () => this.closeLearningPopup());
        }
    }

    // Start the game
    startGame() {
        this.hideStartScreen();
        player.lock();
    }

    // Hide start screen
    hideStartScreen() {
        if (this.startScreen) {
            this.startScreen.style.display = 'none';
        }
    }

    // Show start screen
    showStartScreen() {
        if (this.startScreen) {
            this.startScreen.style.display = 'flex';
        }
    }

    // Show learning popup
    showLearningPopup(checkpoint) {
        this.currentCheckpoint = checkpoint;
        
        if (this.learningPopup) {
            this.learningPopup.style.display = 'flex';
        }
        
        if (this.popupTitle) {
            this.popupTitle.textContent = checkpoint.topicName;
        }

        // Update checkpoint info
        if (this.popupCheckpointInfo) {
            const totalCheckpoints = checkpointSystem.getCheckpointCount();
            this.popupCheckpointInfo.textContent = `Checkpoint ${checkpoint.id + 1} dari ${totalCheckpoints}`;
        }

        // Reset progress bar
        if (this.videoProgressFill) {
            this.videoProgressFill.style.width = '0%';
        }

        // Disable continue button initially
        if (this.continueButton) {
            this.continueButton.disabled = true;
        }

        // Show watch progress message
        if (this.watchProgress) {
            this.watchProgress.classList.remove('completed');
            this.watchProgress.innerHTML = '<p>⏳ Tonton video hingga selesai untuk melanjutkan</p>';
        }

        // Update timer text
        if (this.watchTimer) {
            this.watchTimer.textContent = 'Menunggu video dimulai...';
        }

        // Load YouTube video with progress callback
        youtubeManager.loadVideo(checkpoint.videoId, () => {
            // Enable continue button when video ends or threshold reached
            this.enableContinueButton();
        }, (progress) => {
            // Update progress bar
            this.updateVideoProgress(progress);
        });
    }

    // Enable continue button
    enableContinueButton() {
        if (this.continueButton) {
            this.continueButton.disabled = false;
        }
        if (this.watchProgress) {
            this.watchProgress.classList.add('completed');
            this.watchProgress.innerHTML = '<p>✅ Video selesai! Klik tombol di bawah untuk melanjutkan</p>';
        }
        if (this.videoProgressFill) {
            this.videoProgressFill.style.width = '100%';
        }
        if (this.watchTimer) {
            this.watchTimer.textContent = 'Video selesai!';
        }
    }

    // Update video progress
    updateVideoProgress(progress) {
        if (this.videoProgressFill) {
            this.videoProgressFill.style.width = `${progress}%`;
        }
        if (this.watchTimer) {
            this.watchTimer.textContent = `Progress: ${Math.round(progress)}%`;
        }
    }

    // Close learning popup
    closeLearningPopup() {
        if (this.learningPopup) {
            this.learningPopup.style.display = 'none';
        }

        // Stop video
        youtubeManager.stopVideo();

        // Complete checkpoint
        if (this.currentCheckpoint) {
            checkpointSystem.completeCheckpoint(this.currentCheckpoint.id);
        }

        // Relock pointer for player movement
        setTimeout(() => {
            player.lock();
        }, 100);

        this.currentCheckpoint = null;
    }

    // Update progress display
    updateProgress(completed, total) {
        if (this.checkpointCount) {
            this.checkpointCount.textContent = `${completed}/${total}`;
        }

        // Check for completion
        if (completed === total) {
            this.showCompletionMessage();
        }
    }

    // Show completion message
    showCompletionMessage() {
        // Could show a congratulations overlay
        console.log('Selamat! Semua materi telah diselesaikan!');
    }

    // Show loading screen
    showLoading(message = 'Loading...') {
        let loadingDiv = document.getElementById('loadingScreen');
        
        if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.id = 'loadingScreen';
            loadingDiv.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p id="loadingMessage">${message}</p>
                </div>
            `;
            loadingDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                color: white;
                font-size: 1.5rem;
            `;
            document.body.appendChild(loadingDiv);
        } else {
            const messageEl = document.getElementById('loadingMessage');
            if (messageEl) messageEl.textContent = message;
            loadingDiv.style.display = 'flex';
        }
    }

    // Hide loading screen
    hideLoading() {
        const loadingDiv = document.getElementById('loadingScreen');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }

    // Update loading message
    updateLoadingMessage(message) {
        const messageEl = document.getElementById('loadingMessage');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }
}

// Singleton instance
const ui = new UI();
export default ui;
