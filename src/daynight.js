import * as THREE from 'three';

class DayNightCycle {
    constructor() {
        this.scene = null;
        this.sunLight = null;
        this.ambientLight = null;
        this.skyMesh = null;
        
        // Time settings
        this.timeOfDay = 0.3; // 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
        this.cycleSpeed = 0.01; // How fast day progresses (per second)
        this.isPaused = false;
        
        // Light colors for different times
        this.skyColors = {
            night: new THREE.Color(0x0a0a20),
            dawn: new THREE.Color(0xff7744),
            day: new THREE.Color(0x87ceeb),
            dusk: new THREE.Color(0xff6633)
        };
        
        this.sunColors = {
            night: new THREE.Color(0x222244),
            dawn: new THREE.Color(0xffaa66),
            day: new THREE.Color(0xffffff),
            dusk: new THREE.Color(0xff8844)
        };
        
        this.ambientColors = {
            night: new THREE.Color(0x111133),
            dawn: new THREE.Color(0x554433),
            day: new THREE.Color(0x666666),
            dusk: new THREE.Color(0x443322)
        };
        
        // Street lights
        this.streetLights = [];
        this.lightsOn = false;
    }

    // Initialize the day/night system
    init(scene, sunLight, ambientLight) {
        this.scene = scene;
        this.sunLight = sunLight;
        this.ambientLight = ambientLight;
        
        this.createSkyDome();
        this.createStars();
        this.createStreetLights();
        this.createTimeUI();
        this.setupControls();
    }

    // Create sky dome
    createSkyDome() {
        const skyGeometry = new THREE.SphereGeometry(900, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x87ceeb) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 20 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });

        this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skyMesh);
    }

    // Create stars (visible at night)
    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 850;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)); // Only upper hemisphere
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            transparent: true,
            opacity: 0
        });

        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }

    // Create street lights along the road
    createStreetLights() {
        const lightPositions = [];
        
        // Generate light positions along both sides of the road
        for (let z = -400; z <= 400; z += 60) {
            lightPositions.push({ x: -25, z: z });
            lightPositions.push({ x: 25, z: z });
        }

        lightPositions.forEach(pos => {
            // Light pole
            const poleGeometry = new THREE.CylinderGeometry(0.3, 0.4, 8, 8);
            const poleMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x333333,
                metalness: 0.8,
                roughness: 0.3
            });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, 4, pos.z);
            pole.castShadow = true;
            this.scene.add(pole);

            // Light arm
            const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
            const arm = new THREE.Mesh(armGeometry, poleMaterial);
            arm.position.set(pos.x + (pos.x > 0 ? -1.2 : 1.2), 7.5, pos.z);
            arm.rotation.z = Math.PI / 2;
            this.scene.add(arm);

            // Light fixture
            const fixtureGeometry = new THREE.CylinderGeometry(0.8, 0.5, 0.6, 8);
            const fixtureMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.6,
                roughness: 0.4
            });
            const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            fixture.position.set(pos.x + (pos.x > 0 ? -2.2 : 2.2), 7.3, pos.z);
            this.scene.add(fixture);

            // Light bulb (emissive when on)
            const bulbGeometry = new THREE.SphereGeometry(0.4, 16, 16);
            const bulbMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffaa,
                emissive: 0x000000,
                emissiveIntensity: 0
            });
            const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
            bulb.position.set(pos.x + (pos.x > 0 ? -2.2 : 2.2), 7, pos.z);
            this.scene.add(bulb);

            // Point light (off by default)
            const pointLight = new THREE.PointLight(0xffaa44, 0, 30);
            pointLight.position.copy(bulb.position);
            pointLight.castShadow = false; // For performance
            this.scene.add(pointLight);

            this.streetLights.push({
                bulb: bulb,
                light: pointLight,
                position: pos
            });
        });
    }

    // Create time UI
    createTimeUI() {
        const container = document.createElement('div');
        container.id = 'timeContainer';
        container.innerHTML = `
            <div class="time-display">
                <span class="time-icon">☀️</span>
                <span id="timeText">12:00</span>
            </div>
            <div class="time-controls">
                <button id="timeSlower" class="time-btn">◀◀</button>
                <button id="timePause" class="time-btn">⏸️</button>
                <button id="timeFaster" class="time-btn">▶▶</button>
            </div>
        `;
        document.body.appendChild(container);
    }

    // Setup keyboard controls
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyT') {
                this.isPaused = !this.isPaused;
                this.updatePauseButton();
            }
            if (e.code === 'BracketLeft') {
                this.cycleSpeed = Math.max(0.001, this.cycleSpeed * 0.5);
            }
            if (e.code === 'BracketRight') {
                this.cycleSpeed = Math.min(0.1, this.cycleSpeed * 2);
            }
        });

        // Button controls
        setTimeout(() => {
            const pauseBtn = document.getElementById('timePause');
            const slowerBtn = document.getElementById('timeSlower');
            const fasterBtn = document.getElementById('timeFaster');

            if (pauseBtn) {
                pauseBtn.addEventListener('click', () => {
                    this.isPaused = !this.isPaused;
                    this.updatePauseButton();
                });
            }
            if (slowerBtn) {
                slowerBtn.addEventListener('click', () => {
                    this.cycleSpeed = Math.max(0.001, this.cycleSpeed * 0.5);
                });
            }
            if (fasterBtn) {
                fasterBtn.addEventListener('click', () => {
                    this.cycleSpeed = Math.min(0.1, this.cycleSpeed * 2);
                });
            }
        }, 100);
    }

    updatePauseButton() {
        const btn = document.getElementById('timePause');
        if (btn) {
            btn.textContent = this.isPaused ? '▶️' : '⏸️';
        }
    }

    // Update the day/night cycle
    update(delta) {
        if (!this.isPaused) {
            this.timeOfDay += this.cycleSpeed * delta;
            if (this.timeOfDay > 1) this.timeOfDay -= 1;
        }

        this.updateLighting();
        this.updateSky();
        this.updateStreetLights();
        this.updateUI();
    }

    // Update lighting based on time
    updateLighting() {
        const time = this.timeOfDay;
        
        // Calculate sun position
        const sunAngle = time * Math.PI * 2 - Math.PI / 2;
        const sunHeight = Math.sin(sunAngle);
        const sunDistance = 500;

        if (this.sunLight) {
            this.sunLight.position.set(
                Math.cos(sunAngle) * sunDistance,
                sunHeight * sunDistance + 100,
                0
            );

            // Sun intensity based on height
            const intensity = Math.max(0, sunHeight) * 1.5 + 0.1;
            this.sunLight.intensity = intensity;

            // Sun color
            const sunColor = this.getColorForTime(this.sunColors);
            this.sunLight.color.copy(sunColor);
        }

        if (this.ambientLight) {
            const ambientColor = this.getColorForTime(this.ambientColors);
            this.ambientLight.color.copy(ambientColor);
            this.ambientLight.intensity = 0.3 + Math.max(0, Math.sin(sunAngle)) * 0.4;
        }
    }

    // Update sky colors
    updateSky() {
        if (this.skyMesh) {
            const skyColor = this.getColorForTime(this.skyColors);
            const horizonColor = this.getHorizonColor();

            this.skyMesh.material.uniforms.topColor.value.copy(skyColor);
            this.skyMesh.material.uniforms.bottomColor.value.copy(horizonColor);
        }

        // Stars visibility
        if (this.stars) {
            const nightAmount = this.getNightAmount();
            this.stars.material.opacity = nightAmount * 0.8;
        }
    }

    // Get interpolated color for current time
    getColorForTime(colorSet) {
        const time = this.timeOfDay;
        let color1, color2, t;

        if (time < 0.2) {
            // Night to dawn
            color1 = colorSet.night;
            color2 = colorSet.dawn;
            t = time / 0.2;
        } else if (time < 0.35) {
            // Dawn to day
            color1 = colorSet.dawn;
            color2 = colorSet.day;
            t = (time - 0.2) / 0.15;
        } else if (time < 0.7) {
            // Day
            color1 = colorSet.day;
            color2 = colorSet.day;
            t = 0;
        } else if (time < 0.85) {
            // Day to dusk
            color1 = colorSet.day;
            color2 = colorSet.dusk;
            t = (time - 0.7) / 0.15;
        } else {
            // Dusk to night
            color1 = colorSet.dusk;
            color2 = colorSet.night;
            t = (time - 0.85) / 0.15;
        }

        return new THREE.Color().lerpColors(color1, color2, t);
    }

    // Get horizon color (warmer during sunrise/sunset)
    getHorizonColor() {
        const time = this.timeOfDay;
        
        if (time > 0.15 && time < 0.35) {
            // Sunrise
            return new THREE.Color(0xffaa66);
        } else if (time > 0.7 && time < 0.9) {
            // Sunset
            return new THREE.Color(0xff6644);
        } else if (time < 0.15 || time > 0.9) {
            // Night
            return new THREE.Color(0x111122);
        } else {
            // Day
            return new THREE.Color(0xaaccff);
        }
    }

    // Get how "night" it is (0-1)
    getNightAmount() {
        const time = this.timeOfDay;
        if (time < 0.2 || time > 0.85) {
            return 1;
        } else if (time < 0.3) {
            return 1 - (time - 0.2) / 0.1;
        } else if (time > 0.75) {
            return (time - 0.75) / 0.1;
        }
        return 0;
    }

    // Update street lights
    updateStreetLights() {
        const nightAmount = this.getNightAmount();
        const shouldBeOn = nightAmount > 0.3;

        if (shouldBeOn !== this.lightsOn) {
            this.lightsOn = shouldBeOn;
        }

        this.streetLights.forEach(light => {
            const targetIntensity = this.lightsOn ? 2 : 0;
            const targetEmissive = this.lightsOn ? 1 : 0;

            // Smooth transition
            light.light.intensity += (targetIntensity - light.light.intensity) * 0.1;
            
            const currentEmissive = light.bulb.material.emissiveIntensity;
            light.bulb.material.emissiveIntensity += (targetEmissive - currentEmissive) * 0.1;
            
            if (this.lightsOn) {
                light.bulb.material.emissive.setHex(0xffaa44);
            }
        });
    }

    // Update time UI
    updateUI() {
        const timeText = document.getElementById('timeText');
        const timeIcon = document.querySelector('.time-icon');
        
        if (timeText) {
            // Convert to 24-hour time
            const hours = Math.floor(this.timeOfDay * 24);
            const minutes = Math.floor((this.timeOfDay * 24 - hours) * 60);
            timeText.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }

        if (timeIcon) {
            const time = this.timeOfDay;
            if (time < 0.2 || time > 0.85) {
                timeIcon.textContent = '🌙';
            } else if (time < 0.3) {
                timeIcon.textContent = '🌅';
            } else if (time > 0.75) {
                timeIcon.textContent = '🌆';
            } else {
                timeIcon.textContent = '☀️';
            }
        }
    }

    // Set specific time (0-1)
    setTime(time) {
        this.timeOfDay = time % 1;
    }

    // Get current time info
    getTimeInfo() {
        return {
            time: this.timeOfDay,
            isNight: this.getNightAmount() > 0.5,
            lightsOn: this.lightsOn
        };
    }
}

const dayNightCycle = new DayNightCycle();
export default dayNightCycle;
