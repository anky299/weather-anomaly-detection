/**
 * 3D Rotating Earth — Landing Page Background
 * =============================================
 * Three.js powered Earth with:
 *   • Procedural continent/ocean textures (2048×1024)
 *   • Transparent cloud layer (rotates faster)
 *   • Atmospheric glow (soft blue halo)
 *   • Day/night sunlight simulation
 *   • Mouse parallax effect
 *   • Floating ambient particles
 *
 * CRITICAL: Renders at full opacity, no blur. The globe is the hero.
 */

(function () {
    'use strict';

    function initEarth() {
    // ── Guard: only run on landing page ──
    const earthContainer = document.getElementById('earth-canvas-container');
    if (!earthContainer) return;

    // ── Three.js CDN loaded check ──
    if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded. Earth background disabled.');
        return;
    }
    
    console.log('Three.js loaded successfully. Initializing Earth...');

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        earthRadius: 2.8,
        cloudRadius: 2.85,
        atmosphereRadius: 3.3,
        earthRotationSpeed: 0.0008,   // Much slower — realistic feel
        cloudRotationSpeed: 0.0012,
        particleCount: 120,
        parallaxIntensity: 0.08,
        cameraDistance: 7.5,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SCENE SETUP
    // ═══════════════════════════════════════════════════════════════════════

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        45,
        earthContainer.clientWidth / earthContainer.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0.3, CONFIG.cameraDistance);

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
    });
    renderer.setSize(earthContainer.clientWidth, earthContainer.clientHeight);
    // Sharp rendering: use full device pixel ratio (capped at 3)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    earthContainer.appendChild(renderer.domElement);

    // ═══════════════════════════════════════════════════════════════════════
    // PROCEDURAL EARTH TEXTURE (High Detail 2048x1024)
    // ═══════════════════════════════════════════════════════════════════════

    function createEarthTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Ocean base — rich deep gradient
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        oceanGrad.addColorStop(0, '#072d5b');
        oceanGrad.addColorStop(0.25, '#0b4a80');
        oceanGrad.addColorStop(0.5, '#0e5a99');
        oceanGrad.addColorStop(0.75, '#0b4a80');
        oceanGrad.addColorStop(1, '#072d5b');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add ocean depth variation
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const r = Math.random() * 60 + 20;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, `rgba(${8 + Math.random() * 15}, ${60 + Math.random() * 40}, ${120 + Math.random() * 50}, 0.25)`);
            grad.addColorStop(1, 'rgba(7, 45, 91, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }

        // Continent data — approximate lat/lon mapped to canvas coordinates
        const continents = [
            // North America
            { cx: 400, cy: 280, shapes: [
                { x: 320, y: 180, w: 200, h: 220, rot: -0.1 },
                { x: 280, y: 220, w: 120, h: 140, rot: 0.2 },
                { x: 380, y: 310, w: 160, h: 100, rot: -0.15 },
                { x: 340, y: 190, w: 180, h: 80, rot: 0.05 },
                { x: 420, y: 160, w: 80, h: 60, rot: 0.1 },
            ]},
            // South America
            { cx: 540, cy: 580, shapes: [
                { x: 520, y: 440, w: 100, h: 280, rot: 0.15 },
                { x: 500, y: 480, w: 80, h: 200, rot: -0.1 },
                { x: 540, y: 520, w: 90, h: 240, rot: 0.05 },
            ]},
            // Europe
            { cx: 1020, cy: 260, shapes: [
                { x: 960, y: 200, w: 140, h: 120, rot: 0.1 },
                { x: 980, y: 230, w: 100, h: 80, rot: -0.05 },
                { x: 1020, y: 180, w: 80, h: 100, rot: 0.15 },
                { x: 940, y: 260, w: 60, h: 60, rot: 0 },
            ]},
            // Africa
            { cx: 1060, cy: 480, shapes: [
                { x: 990, y: 340, w: 180, h: 300, rot: 0 },
                { x: 1010, y: 380, w: 140, h: 260, rot: 0.05 },
                { x: 1050, y: 360, w: 120, h: 220, rot: -0.05 },
            ]},
            // Asia
            { cx: 1300, cy: 280, shapes: [
                { x: 1100, y: 160, w: 400, h: 240, rot: 0 },
                { x: 1150, y: 200, w: 350, h: 180, rot: 0.05 },
                { x: 1200, y: 240, w: 300, h: 140, rot: -0.03 },
                { x: 1350, y: 280, w: 180, h: 120, rot: 0.1 },
                { x: 1100, y: 280, w: 200, h: 160, rot: -0.05 },
                // India
                { x: 1240, y: 360, w: 100, h: 140, rot: 0.05 },
            ]},
            // Australia
            { cx: 1580, cy: 560, shapes: [
                { x: 1520, y: 500, w: 160, h: 120, rot: 0 },
                { x: 1540, y: 520, w: 130, h: 90, rot: 0.05 },
            ]},
            // Antarctica 
            { cx: 1024, cy: 950, shapes: [
                { x: 200, y: 910, w: 1600, h: 120, rot: 0 },
            ]},
            // Greenland
            { cx: 620, cy: 130, shapes: [
                { x: 580, y: 100, w: 100, h: 80, rot: 0.1 },
            ]},
        ];

        // Draw continents with natural-looking borders
        continents.forEach(continent => {
            continent.shapes.forEach(shape => {
                ctx.save();
                ctx.translate(shape.x + shape.w / 2, shape.y + shape.h / 2);
                ctx.rotate(shape.rot);

                // Main landmass
                const landGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(shape.w, shape.h) * 0.6);
                landGrad.addColorStop(0, '#3a7d44');
                landGrad.addColorStop(0.4, '#2d6a3a');
                landGrad.addColorStop(0.7, '#4a8c54');
                landGrad.addColorStop(1, '#1e5a2a');

                ctx.fillStyle = landGrad;
                ctx.beginPath();

                // Organic shape using bezier curves
                const points = 14;
                const angleStep = (Math.PI * 2) / points;
                for (let i = 0; i <= points; i++) {
                    const angle = i * angleStep;
                    const rx = shape.w / 2 * (0.7 + Math.sin(angle * 3 + shape.x) * 0.3);
                    const ry = shape.h / 2 * (0.7 + Math.cos(angle * 2 + shape.y) * 0.3);
                    const px = Math.cos(angle) * rx;
                    const py = Math.sin(angle) * ry;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();

                // Terrain variation
                for (let t = 0; t < 20; t++) {
                    const tx = (Math.random() - 0.5) * shape.w * 0.6;
                    const ty = (Math.random() - 0.5) * shape.h * 0.6;
                    const tr = Math.random() * 22 + 8;
                    const tGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, tr);
                    const greenVariant = Math.random() > 0.3
                        ? `rgba(${50 + Math.random() * 40}, ${100 + Math.random() * 60}, ${40 + Math.random() * 30}, 0.5)`
                        : `rgba(${140 + Math.random() * 50}, ${130 + Math.random() * 40}, ${80 + Math.random() * 30}, 0.4)`;
                    tGrad.addColorStop(0, greenVariant);
                    tGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = tGrad;
                    ctx.fillRect(tx - tr, ty - tr, tr * 2, tr * 2);
                }

                ctx.restore();
            });

            // Mountain highlights
            for (let m = 0; m < 6; m++) {
                const mx = continent.cx + (Math.random() - 0.5) * 80;
                const my = continent.cy + (Math.random() - 0.5) * 60;
                const mr = Math.random() * 15 + 5;
                ctx.fillStyle = `rgba(${180 + Math.random() * 60}, ${170 + Math.random() * 50}, ${120 + Math.random() * 40}, 0.25)`;
                ctx.beginPath();
                ctx.arc(mx, my, mr, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Desert regions (subtle sandy patches in Africa/Middle East)
        const deserts = [
            { x: 1020, y: 380, w: 120, h: 60 },
            { x: 1160, y: 320, w: 80, h: 50 },
        ];
        deserts.forEach(d => {
            for (let i = 0; i < 8; i++) {
                const dx = d.x + Math.random() * d.w;
                const dy = d.y + Math.random() * d.h;
                const dr = Math.random() * 20 + 10;
                const dGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, dr);
                dGrad.addColorStop(0, `rgba(${180 + Math.random() * 40}, ${160 + Math.random() * 30}, ${100 + Math.random() * 30}, 0.35)`);
                dGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = dGrad;
                ctx.fillRect(dx - dr, dy - dr, dr * 2, dr * 2);
            }
        });

        // Polar ice caps
        const iceGrad1 = ctx.createRadialGradient(1024, 0, 0, 1024, 0, 320);
        iceGrad1.addColorStop(0, 'rgba(230, 240, 255, 0.9)');
        iceGrad1.addColorStop(0.4, 'rgba(210, 228, 250, 0.5)');
        iceGrad1.addColorStop(1, 'rgba(200, 220, 240, 0)');
        ctx.fillStyle = iceGrad1;
        ctx.fillRect(0, 0, canvas.width, 110);

        const iceGrad2 = ctx.createRadialGradient(1024, canvas.height, 0, 1024, canvas.height, 320);
        iceGrad2.addColorStop(0, 'rgba(230, 240, 255, 0.95)');
        iceGrad2.addColorStop(0.35, 'rgba(210, 228, 250, 0.6)');
        iceGrad2.addColorStop(1, 'rgba(200, 220, 240, 0)');
        ctx.fillStyle = iceGrad2;
        ctx.fillRect(0, canvas.height - 130, canvas.width, 130);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return texture;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PROCEDURAL CLOUD TEXTURE
    // ═══════════════════════════════════════════════════════════════════════

    function createCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Cloud bands at various latitudes
        const cloudBands = [
            { y: 150, density: 35, spread: 80 },
            { y: 350, density: 55, spread: 120 },
            { y: 512, density: 30, spread: 100 },
            { y: 650, density: 50, spread: 110 },
            { y: 850, density: 40, spread: 90 },
        ];

        cloudBands.forEach(band => {
            for (let c = 0; c < band.density; c++) {
                const cx = Math.random() * canvas.width;
                const cy = band.y + (Math.random() - 0.5) * band.spread;
                const rx = Math.random() * 120 + 40;
                const ry = Math.random() * 40 + 15;

                const numPuffs = Math.floor(Math.random() * 6) + 3;
                for (let p = 0; p < numPuffs; p++) {
                    const px = cx + (Math.random() - 0.5) * rx;
                    const py = cy + (Math.random() - 0.5) * ry;
                    const pr = Math.random() * 35 + 15;

                    const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
                    const alpha = Math.random() * 0.4 + 0.15;
                    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                    grad.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.4})`);
                    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(px, py, pr, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });

        // Large storm systems
        for (let s = 0; s < 10; s++) {
            const sx = Math.random() * canvas.width;
            const sy = 200 + Math.random() * 600;
            const sr = Math.random() * 80 + 40;

            for (let sp = 0; sp < 14; sp++) {
                const angle = (sp / 14) * Math.PI * 2;
                const dist = Math.random() * sr;
                const spx = sx + Math.cos(angle) * dist;
                const spy = sy + Math.sin(angle) * dist * 0.5;
                const spr = Math.random() * 25 + 10;

                const grad = ctx.createRadialGradient(spx, spy, 0, spx, spy, spr);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(spx, spy, spr, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return texture;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BUMP MAP (land elevation)
    // ═══════════════════════════════════════════════════════════════════════

    function createBumpTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 3500; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const r = Math.random() * 30 + 5;
            const brightness = Math.floor(Math.random() * 80 + 30);
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, `rgba(${brightness}, ${brightness}, ${brightness}, 0.2)`);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return texture;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SPECULAR MAP (ocean highlights)
    // ═══════════════════════════════════════════════════════════════════════

    function createSpecularTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Bright base = reflective ocean
        ctx.fillStyle = '#666666';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dark patches where land is (less reflective)
        // Reuse continent data for masking
        ctx.fillStyle = '#111111';
        const landRegions = [
            [280, 160, 260, 260],
            [480, 420, 140, 310],
            [920, 180, 180, 140],
            [960, 320, 220, 330],
            [1080, 140, 440, 280],
            [1200, 340, 140, 160],
            [1500, 480, 180, 140],
            [100, 880, 1800, 160],
            [560, 80, 120, 100],
        ];
        landRegions.forEach(([x, y, w, h]) => {
            const grad = ctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, Math.max(w, h) * 0.6);
            grad.addColorStop(0, '#111111');
            grad.addColorStop(1, '#333333');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, w, h);
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return texture;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EARTH SPHERE
    // ═══════════════════════════════════════════════════════════════════════

    const earthTexture = createEarthTexture();
    const bumpTexture = createBumpTexture();
    const specTexture = createSpecularTexture();

    const earthGeometry = new THREE.SphereGeometry(CONFIG.earthRadius, 128, 128);
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.06,
        specularMap: specTexture,
        specular: new THREE.Color(0x444466),
        shininess: 20,
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // ═══════════════════════════════════════════════════════════════════════
    // CLOUD LAYER
    // ═══════════════════════════════════════════════════════════════════════

    const cloudTexture = createCloudTexture();
    const cloudGeometry = new THREE.SphereGeometry(CONFIG.cloudRadius, 128, 128);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        side: THREE.DoubleSide,
    });

    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);

    // ═══════════════════════════════════════════════════════════════════════
    // ATMOSPHERIC GLOW
    // ═══════════════════════════════════════════════════════════════════════

    const atmosphereVertexShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const atmosphereFragmentShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 atmosphereColor = vec3(0.25, 0.55, 1.0);
            gl_FragColor = vec4(atmosphereColor, intensity * 0.75);
        }
    `;

    const atmosphereGeometry = new THREE.SphereGeometry(CONFIG.atmosphereRadius, 128, 128);
    const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Inner glow (rim light on the sphere edge)
    const innerGlowFS = `
        varying vec3 vNormal;
        void main() {
            float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
            vec3 glowColor = vec3(0.3, 0.6, 1.0);
            gl_FragColor = vec4(glowColor, intensity * 0.45);
        }
    `;

    const innerGlowGeometry = new THREE.SphereGeometry(CONFIG.earthRadius + 0.02, 128, 128);
    const innerGlowMaterial = new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: innerGlowFS,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: false,
    });

    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    scene.add(innerGlow);

    // ═══════════════════════════════════════════════════════════════════════
    // LIGHTING (Sunlight Simulation)
    // ═══════════════════════════════════════════════════════════════════════

    // Main sunlight — warm directional
    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.8);
    sunLight.position.set(5, 2, 5);
    scene.add(sunLight);

    // Cool fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0x4488cc, 0.35);
    fillLight.position.set(-5, -1, -3);
    scene.add(fillLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x1a2a44, 0.5);
    scene.add(ambientLight);

    // Rim highlight
    const rimLight = new THREE.DirectionalLight(0x88bbff, 0.25);
    rimLight.position.set(0, 5, -3);
    scene.add(rimLight);

    // ═══════════════════════════════════════════════════════════════════════
    // FLOATING PARTICLES (Stars / Dust)
    // ═══════════════════════════════════════════════════════════════════════

    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(CONFIG.particleCount * 3);
    const particleSizes = new Float32Array(CONFIG.particleCount);

    for (let i = 0; i < CONFIG.particleCount; i++) {
        const i3 = i * 3;
        const radius = 5 + Math.random() * 12;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        particlePositions[i3 + 2] = radius * Math.cos(phi);
        particleSizes[i] = Math.random() * 2.5 + 0.5;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const particleVertexShader = `
        attribute float size;
        varying float vAlpha;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            vAlpha = size / 3.0;
        }
    `;

    const particleFragmentShader = `
        varying float vAlpha;
        void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = vAlpha * (1.0 - dist * 2.0) * 0.5;
            gl_FragColor = vec4(0.65, 0.82, 1.0, alpha);
        }
    `;

    const particleMaterial = new THREE.ShaderMaterial({
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particles);

    // ═══════════════════════════════════════════════════════════════════════
    // MOUSE PARALLAX
    // ═══════════════════════════════════════════════════════════════════════

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    document.addEventListener('mousemove', (event) => {
        targetMouseX = (event.clientX / window.innerWidth - 0.5) * 2;
        targetMouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    });

    // ═══════════════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════════════════════════════════════════

    let animationId;
    const clock = new THREE.Clock();

    function animate() {
        animationId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Smooth mouse interpolation (slow for realism)
        mouseX += (targetMouseX - mouseX) * 0.02;
        mouseY += (targetMouseY - mouseY) * 0.02;

        // Earth rotation — smooth continuous
        earth.rotation.y += CONFIG.earthRotationSpeed;
        clouds.rotation.y += CONFIG.cloudRotationSpeed;

        // Fixed axial tilt (23.4° ≈ 0.41 rad) with barely perceptible wobble
        earth.rotation.x = 0.41 + Math.sin(elapsed * 0.03) * 0.005;
        clouds.rotation.x = 0.41 + Math.sin(elapsed * 0.03) * 0.005;

        // Mouse parallax — shift camera position
        camera.position.x = mouseX * CONFIG.parallaxIntensity;
        camera.position.y = 0.3 + (-mouseY * CONFIG.parallaxIntensity * 0.5);
        camera.lookAt(0, 0, 0);

        // Very slow particle drift
        particles.rotation.y += 0.00004;
        particles.rotation.x += 0.00001;

        // Animate individual particles (gentle float)
        const positions = particlesGeometry.attributes.position.array;
        for (let i = 0; i < CONFIG.particleCount; i++) {
            const i3 = i * 3;
            positions[i3 + 1] += Math.sin(elapsed * 0.2 + i) * 0.0004;
        }
        particlesGeometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    // ═══════════════════════════════════════════════════════════════════════
    // RESPONSIVE HANDLING
    // ═══════════════════════════════════════════════════════════════════════

    function handleResize() {
        const width = earthContainer.clientWidth;
        const height = earthContainer.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);

        // Scale Earth on smaller screens — keep it prominent
        if (width < 480) {
            const scale = 0.75;
            earth.scale.set(scale, scale, scale);
            clouds.scale.set(scale, scale, scale);
            atmosphere.scale.set(scale, scale, scale);
            innerGlow.scale.set(scale, scale, scale);
        } else if (width < 768) {
            const scale = 0.85;
            earth.scale.set(scale, scale, scale);
            clouds.scale.set(scale, scale, scale);
            atmosphere.scale.set(scale, scale, scale);
            innerGlow.scale.set(scale, scale, scale);
        } else if (width < 1200) {
            const scale = 0.92;
            earth.scale.set(scale, scale, scale);
            clouds.scale.set(scale, scale, scale);
            atmosphere.scale.set(scale, scale, scale);
            innerGlow.scale.set(scale, scale, scale);
        } else {
            earth.scale.set(1, 1, 1);
            clouds.scale.set(1, 1, 1);
            atmosphere.scale.set(1, 1, 1);
            innerGlow.scale.set(1, 1, 1);
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    // ═══════════════════════════════════════════════════════════════════════
    // FADE-IN ANIMATION (fast — don't delay user seeing the globe)
    // ═══════════════════════════════════════════════════════════════════════

    earthContainer.style.opacity = '0';
    earthContainer.style.transition = 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => {
        earthContainer.style.opacity = '1';
    }, 200);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        cancelAnimationFrame(animationId);
        renderer.dispose();
    });

    } // end initEarth

    // Ensure Three.js is fully loaded before initializing
    if (document.readyState === 'complete') {
        initEarth();
    } else {
        window.addEventListener('load', initEarth);
    }

})();
