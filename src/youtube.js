class YouTubeManager {
    constructor() {
        this.player = null;
        this.isReady = false;
        this.onEndCallback = null;
        this.onProgressCallback = null;
        this.watchThreshold = 30; // Minimum seconds to watch
        this.watchedTime = 0;
        this.totalDuration = 0;
        this.checkInterval = null;
    }

    // Initialize YouTube API
    init() {
        // Load YouTube IFrame API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Set up global callback for YouTube API
        window.onYouTubeIframeAPIReady = () => {
            this.isReady = true;
            console.log('YouTube API Ready');
        };
    }

    // Load and play a video
    loadVideo(videoId, onEndCallback, onProgressCallback) {
        this.onEndCallback = onEndCallback;
        this.onProgressCallback = onProgressCallback;
        this.watchedTime = 0;
        this.totalDuration = 0;

        const container = document.getElementById('videoContainer');
        if (!container) return;

        // Clear previous content
        container.innerHTML = '';

        // Create player div
        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtubePlayer';
        container.appendChild(playerDiv);

        // For placeholder videos, use a simulated experience
        if (videoId.startsWith('placeholder_')) {
            this.createPlaceholderVideo(container, videoId);
            return;
        }

        // Create YouTube player
        if (this.isReady) {
            this.createPlayer(videoId);
        } else {
            // Wait for API to be ready
            const checkReady = setInterval(() => {
                if (this.isReady) {
                    clearInterval(checkReady);
                    this.createPlayer(videoId);
                }
            }, 100);
        }
    }

    // Create YouTube player
    createPlayer(videoId) {
        this.player = new YT.Player('youtubePlayer', {
            height: '315',
            width: '560',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'controls': 1,
                'modestbranding': 1,
                'rel': 0
            },
            events: {
                'onReady': (event) => this.onPlayerReady(event),
                'onStateChange': (event) => this.onPlayerStateChange(event)
            }
        });
    }

    // Create placeholder video (for development/demo)
    createPlaceholderVideo(container, videoId) {
        const totalTime = 5; // 5 seconds for demo
        this.totalDuration = totalTime;
        
        container.innerHTML = `
            <div style="
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                position: absolute;
                top: 0;
                left: 0;
            ">
                <i class="fas fa-play-circle" style="font-size: 80px; margin-bottom: 20px; animation: pulse 2s infinite; color: #4CAF50;"></i>
                <h3 style="margin-bottom: 10px; font-size: 1.5rem;">Video Pembelajaran</h3>
                <p style="color: #4CAF50; margin-bottom: 25px; font-size: 1.1rem;">${this.getTopicFromVideoId(videoId)}</p>
                <div style="
                    width: 200px;
                    height: 8px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 15px;
                ">
                    <div id="placeholderProgressBar" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, #4CAF50, #8BC34A);
                        border-radius: 4px;
                        transition: width 0.5s ease;
                    "></div>
                </div>
                <p id="placeholderTimer" style="font-size: 1.3rem; color: #8BC34A; font-weight: bold;">Memulai...</p>
                <p style="color: #666; font-size: 0.85rem; margin-top: 15px;">Demo Mode - Video ID: ${videoId}</p>
            </div>
            <style>
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            </style>
        `;

        // Simulate video playback with countdown
        let elapsed = 0;
        const timerEl = document.getElementById('placeholderTimer');
        const progressBar = document.getElementById('placeholderProgressBar');
        
        this.checkInterval = setInterval(() => {
            elapsed++;
            const remaining = totalTime - elapsed;
            const progress = (elapsed / totalTime) * 100;
            
            if (timerEl) {
                timerEl.textContent = `Selesai dalam ${remaining}s`;
            }
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            // Report progress
            if (this.onProgressCallback) {
                this.onProgressCallback(progress);
            }
            
            if (elapsed >= totalTime) {
                clearInterval(this.checkInterval);
                if (timerEl) {
                    timerEl.innerHTML = '<i class="fas fa-check-circle"></i> Video Selesai!';
                    timerEl.style.color = '#4CAF50';
                }
                if (this.onEndCallback) {
                    this.onEndCallback();
                }
            }
        }, 1000);
    }

    // Get topic name from video ID
    getTopicFromVideoId(videoId) {
        const topics = {
            'placeholder_video_1': 'Pengenalan Bilangan',
            'placeholder_video_2': 'Penjumlahan Dasar',
            'placeholder_video_3': 'Pengurangan Dasar',
            'placeholder_video_4': 'Perkalian',
            'placeholder_video_5': 'Pembagian',
            'placeholder_video_6': 'Pecahan',
            'placeholder_video_7': 'Geometri Dasar',
            'placeholder_video_8': 'Pengukuran',
            'placeholder_video_9': 'Statistika Dasar',
            'placeholder_video_10': 'Aljabar Pengenalan',
            'placeholder_video_11': 'Bilangan Desimal',
            'placeholder_video_12': 'Perbandingan'
        };
        return topics[videoId] || 'Materi Pembelajaran';
    }

    // Player ready event
    onPlayerReady(event) {
        // Start tracking watch time
        this.startWatchTimeTracking();
    }

    // Player state change event
    onPlayerStateChange(event) {
        // YT.PlayerState.ENDED = 0
        if (event.data === 0) {
            this.onVideoEnded();
        }
    }

    // Start tracking watch time
    startWatchTimeTracking() {
        // Get video duration
        if (this.player && this.player.getDuration) {
            this.totalDuration = this.player.getDuration();
        }
        
        this.checkInterval = setInterval(() => {
            if (this.player && this.player.getPlayerState() === 1) { // Playing
                this.watchedTime++;
                
                // Calculate and report progress
                if (this.totalDuration > 0 && this.onProgressCallback) {
                    const progress = (this.watchedTime / this.totalDuration) * 100;
                    this.onProgressCallback(Math.min(progress, 100));
                }
                
                // Check if threshold reached
                if (this.watchedTime >= this.watchThreshold) {
                    this.onThresholdReached();
                }
            }
        }, 1000);
    }

    // Video ended callback
    onVideoEnded() {
        this.stopTracking();
        if (this.onEndCallback) {
            this.onEndCallback();
        }
    }

    // Watch threshold reached
    onThresholdReached() {
        this.stopTracking();
        if (this.onEndCallback) {
            this.onEndCallback();
        }
    }

    // Stop time tracking
    stopTracking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // Stop video playback
    stopVideo() {
        this.stopTracking();
        
        if (this.player && this.player.stopVideo) {
            this.player.stopVideo();
        }
        
        const container = document.getElementById('videoContainer');
        if (container) {
            container.innerHTML = '';
        }
        
        this.player = null;
    }

    // Get current watch time
    getWatchedTime() {
        return this.watchedTime;
    }

    // Check if video is playing
    isPlaying() {
        return this.player && this.player.getPlayerState() === 1;
    }
}

// Singleton instance
const youtubeManager = new YouTubeManager();
export default youtubeManager;
