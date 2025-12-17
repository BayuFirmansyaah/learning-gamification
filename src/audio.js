// Audio System - Fun sounds for Math City!

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        this.isInitialized = false;
        this.isMuted = false;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        
        // Background music oscillators
        this.musicOscillators = [];
        this.musicPlaying = false;
        
        // Sound effects cache
        this.sounds = {};
        
        // Footstep timing
        this.lastFootstep = 0;
        this.footstepInterval = 350; // ms between footsteps
        this.isWalking = false;
        this.isSprinting = false;
    }
    
    // Initialize audio context (must be called after user interaction)
    init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.7;
            
            // Music gain
            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = this.musicVolume;
            
            // SFX gain
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = this.sfxVolume;
            
            this.isInitialized = true;
            console.log('🎵 Audio system initialized!');
            
            // Create UI for audio controls
            this.createAudioUI();
            
        } catch (e) {
            console.warn('Audio not supported:', e);
        }
    }
    
    // Create audio control UI
    createAudioUI() {
        const audioControl = document.createElement('div');
        audioControl.id = 'audio-control';
        audioControl.innerHTML = `
            <button id="music-toggle" title="Toggle Music">
                <i class="fas fa-music"></i>
            </button>
            <button id="sfx-toggle" title="Toggle Sound Effects">
                <i class="fas fa-volume-high"></i>
            </button>
        `;
        document.body.appendChild(audioControl);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #audio-control {
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                gap: 10px;
                z-index: 1000;
            }
            
            #audio-control button {
                width: 45px;
                height: 45px;
                border-radius: 50%;
                border: none;
                background: linear-gradient(145deg, #2a2a4a, #1a1a2e);
                color: #4CAF50;
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            }
            
            #audio-control button:hover {
                transform: scale(1.1);
                background: linear-gradient(145deg, #3a3a5a, #2a2a4e);
            }
            
            #audio-control button.muted {
                color: #666;
            }
            
            #audio-control button.muted i::after {
                content: '';
                position: absolute;
                width: 2px;
                height: 20px;
                background: #ff4444;
                transform: rotate(45deg);
                top: 50%;
                left: 50%;
                margin-left: -1px;
                margin-top: -10px;
            }
            
            #audio-control button i {
                position: relative;
            }
        `;
        document.head.appendChild(style);
        
        // Event listeners
        document.getElementById('music-toggle').addEventListener('click', () => {
            this.toggleMusic();
        });
        
        document.getElementById('sfx-toggle').addEventListener('click', () => {
            this.toggleSFX();
        });
    }
    
    // Toggle music
    toggleMusic() {
        const btn = document.getElementById('music-toggle');
        if (this.musicPlaying) {
            this.stopMusic();
            btn.classList.add('muted');
        } else {
            this.playBackgroundMusic();
            btn.classList.remove('muted');
        }
    }
    
    // Toggle SFX
    toggleSFX() {
        const btn = document.getElementById('sfx-toggle');
        if (this.sfxGain.gain.value > 0) {
            this.sfxGain.gain.value = 0;
            btn.classList.add('muted');
        } else {
            this.sfxGain.gain.value = this.sfxVolume;
            btn.classList.remove('muted');
        }
    }
    
    // Play a note
    playNote(frequency, duration, type = 'sine', gainValue = 0.3, delay = 0) {
        if (!this.isInitialized || this.isMuted) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
        gain.gain.linearRampToValueAtTime(gainValue, this.audioContext.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + delay + duration);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(this.audioContext.currentTime + delay);
        osc.stop(this.audioContext.currentTime + delay + duration);
        
        return osc;
    }
    
    // Play chord
    playChord(frequencies, duration, type = 'sine', gainValue = 0.15) {
        frequencies.forEach(freq => {
            this.playNote(freq, duration, type, gainValue);
        });
    }
    
    // Background music - Chill lo-fi style loop
    playBackgroundMusic() {
        if (!this.isInitialized || this.musicPlaying) return;
        
        this.musicPlaying = true;
        
        // Lo-fi chord progression
        const chords = [
            [261.63, 329.63, 392.00], // C major
            [293.66, 369.99, 440.00], // D minor  
            [349.23, 440.00, 523.25], // F major
            [392.00, 493.88, 587.33], // G major
        ];
        
        let chordIndex = 0;
        
        const playChordLoop = () => {
            if (!this.musicPlaying) return;
            
            const chord = chords[chordIndex];
            
            // Play soft pad chord
            chord.forEach(freq => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                osc.type = 'sine';
                osc.frequency.value = freq * 0.5; // Lower octave
                
                filter.type = 'lowpass';
                filter.frequency.value = 800;
                
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.5);
                gain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 1.5);
                gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.musicGain);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 2);
                
                this.musicOscillators.push(osc);
            });
            
            // Add subtle bass
            const bass = this.audioContext.createOscillator();
            const bassGain = this.audioContext.createGain();
            
            bass.type = 'sine';
            bass.frequency.value = chord[0] * 0.25;
            
            bassGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            bassGain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
            bassGain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 1.5);
            bassGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
            
            bass.connect(bassGain);
            bassGain.connect(this.musicGain);
            
            bass.start();
            bass.stop(this.audioContext.currentTime + 2);
            
            this.musicOscillators.push(bass);
            
            chordIndex = (chordIndex + 1) % chords.length;
            
            // Schedule next chord
            this.musicTimeout = setTimeout(playChordLoop, 2000);
        };
        
        playChordLoop();
        console.log('🎶 Background music started');
    }
    
    // Stop background music
    stopMusic() {
        this.musicPlaying = false;
        if (this.musicTimeout) {
            clearTimeout(this.musicTimeout);
        }
        this.musicOscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.musicOscillators = [];
        console.log('🔇 Background music stopped');
    }
    
    // === SOUND EFFECTS ===
    
    // Footstep sound
    playFootstep(isSprinting = false) {
        if (!this.isInitialized) return;
        
        const now = Date.now();
        const interval = isSprinting ? this.footstepInterval * 0.6 : this.footstepInterval;
        
        if (now - this.lastFootstep < interval) return;
        this.lastFootstep = now;
        
        // Create footstep sound
        const noise = this.audioContext.createBufferSource();
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.1));
        }
        
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = isSprinting ? 400 : 300;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = isSprinting ? 0.15 : 0.1;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        noise.start();
    }
    
    // Interaction sound (E key)
    playInteraction() {
        if (!this.isInitialized) return;
        
        // Friendly "boop" sound
        this.playNote(523.25, 0.1, 'sine', 0.3); // C5
        this.playNote(659.25, 0.15, 'sine', 0.25, 0.05); // E5
        this.playNote(783.99, 0.2, 'sine', 0.2, 0.1); // G5
    }
    
    // Success/completion sound
    playSuccess() {
        if (!this.isInitialized) return;
        
        // Happy ascending arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            this.playNote(freq, 0.3, 'sine', 0.25, i * 0.1);
        });
        
        // Add sparkle
        setTimeout(() => {
            this.playNote(1318.51, 0.4, 'sine', 0.15); // E6
        }, 400);
    }
    
    // Dialog popup sound
    playDialogOpen() {
        if (!this.isInitialized) return;
        
        this.playNote(440, 0.1, 'sine', 0.2);
        this.playNote(554.37, 0.15, 'sine', 0.15, 0.08);
    }
    
    // Dialog close sound
    playDialogClose() {
        if (!this.isInitialized) return;
        
        this.playNote(554.37, 0.1, 'sine', 0.15);
        this.playNote(440, 0.15, 'sine', 0.1, 0.08);
    }
    
    // Typing sound for dialog
    playTyping() {
        if (!this.isInitialized) return;
        
        const freq = 800 + Math.random() * 400;
        this.playNote(freq, 0.02, 'square', 0.05);
    }
    
    // Button click sound
    playClick() {
        if (!this.isInitialized) return;
        
        this.playNote(800, 0.05, 'square', 0.1);
        this.playNote(1000, 0.08, 'square', 0.08, 0.03);
    }
    
    // Checkpoint nearby ping
    playCheckpointNear() {
        if (!this.isInitialized) return;
        
        this.playNote(880, 0.2, 'sine', 0.15);
        this.playNote(1108.73, 0.3, 'sine', 0.1, 0.15);
    }
    
    // Video start sound
    playVideoStart() {
        if (!this.isInitialized) return;
        
        // Cinematic whoosh
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }
    
    // Ambient city sound (subtle)
    playAmbientCity() {
        if (!this.isInitialized) return;
        
        // Create subtle ambient noise
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.01;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.3;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        noise.start();
        
        this.ambientNoise = noise;
    }
    
    // Sprint start sound
    playSprintStart() {
        if (!this.isInitialized) return;
        
        this.playNote(300, 0.1, 'sawtooth', 0.1);
        this.playNote(400, 0.15, 'sawtooth', 0.08, 0.05);
    }
    
    // Stamina low warning
    playStaminaLow() {
        if (!this.isInitialized) return;
        
        this.playNote(200, 0.2, 'sine', 0.15);
        this.playNote(150, 0.3, 'sine', 0.1, 0.15);
    }
    
    // Update walking state
    updateWalking(isMoving, isSprinting) {
        this.isWalking = isMoving;
        this.isSprinting = isSprinting;
        
        if (isMoving) {
            this.playFootstep(isSprinting);
        }
    }
}

// Create and export singleton instance
export const audioSystem = new AudioSystem();
