/**
 * =========================================================================
 * 🏺 JAR MODULE - Canvas Physics & Visual Renderer
 * =========================================================================
 * 
 * If you want to change how the jar looks in the future,
 * YOU ONLY NEED TO EDIT THIS FILE!
 * 
 * All jar visuals (glass, cork lid, glares, reflections, dimensions,
 * paper slip appearance, colors, and motion physics) are centralized below.
 */

export const JAR_STYLE = {
    // 1. Overall Jar Dimensions (as fraction of canvas size)
    dimensions: {
        bodyWidthRatio: 0.64,    // Width of the jar body (0.64 = 64% of canvas width)
        bodyHeightRatio: 0.64,   // Height of the jar body
        bodyYRatio: 0.26,        // Vertical starting position (top of jar body)
        cornerRadius: 32,        // Curvature of jar bottom corners
        neckWidthRatio: 0.42,    // Width of the jar mouth opening
        neckHeightRatio: 0.035,  // Thickness of jar glass rim
    },

    // 2. Cork Lid Styling
    cork: {
        widthRatio: 0.40,        // Width of the cork stopper
        height: 24,              // Height in px
        color: '#b45309',        // Primary cork color
        accentLineColor: '#92400e', // Texture line color
        shadowColor: 'rgba(0, 0, 0, 0.25)',
        topCornerRadius: [8, 8, 2, 2], // Rounded top
    },

    // 3. Glass Appearance & Reflections
    glass: {
        // Outline stroke
        strokeColor: 'rgba(255, 255, 255, 0.65)',
        strokeWidth: 3.5,
        rimStrokeColor: 'rgba(255, 255, 255, 0.85)',
        rimStrokeWidth: 4,

        // Glass transparency gradient (left to right)
        gradientStops: [
            { offset: 0.00, color: 'rgba(255, 255, 255, 0.38)' },
            { offset: 0.15, color: 'rgba(255, 255, 255, 0.09)' },
            { offset: 0.85, color: 'rgba(255, 255, 255, 0.06)' },
            { offset: 1.00, color: 'rgba(255, 255, 255, 0.32)' }
        ],

        // Front specular reflection highlights
        highlights: [
            {
                xOffset: 12,
                topOffset: 36,
                bottomOffset: 28,
                lineWidth: 5,
                color: 'rgba(255, 255, 255, 0.55)'
            },
            {
                xOffset: 24,
                topOffset: 48,
                height: 55,
                lineWidth: 2.5,
                color: 'rgba(255, 255, 255, 0.35)'
            }
        ]
    },

    // 4. Paper Slips Visuals
    slips: {
        minWidth: 26,
        maxWidth: 34,
        minHeight: 14,
        maxHeight: 18,
        borderRadius: 3.5,
        creaseOpacity: 0.22,
        shadowColor: 'rgba(0, 0, 0, 0.14)',
        shadowOffset: 2,

        // Category-based colors for slips inside the jar
        categoryColors: {
            mine: '#FBBF24',      // Warm Amber (My Movie)
            hers: '#FB7185',      // Soft Rose / Pink (Her Movie)
            rewatch: '#818CF8',   // Indigo / Violet (Rewatches)
            default: '#38BDF8'    // Soft Cyan
        },

        // Fallback pastel palette if category is unspecified
        palette: [
            '#FCA5A5', // Soft Red
            '#FDBA74', // Soft Orange
            '#FDE047', // Soft Yellow
            '#86EFAC', // Soft Green
            '#93C5FD', // Soft Blue
            '#C084FC', // Soft Purple
            '#F472B6'  // Soft Pink
        ]
    },

    // 5. Physics & Movement
    physics: {
        gravity: 0.16,
        frictionX: 0.95,
        frictionY: 0.95,
        angularDamping: 0.96,
        shakeForceY: 5.5,
        shakeForceX: 6.0,
        shakeDecay: 0.90,
    }
};

/**
 * Jar Class: Manages canvas rendering, slip particles, and physics simulation
 */
export class Jar {
    /**
     * @param {HTMLCanvasElement|string} canvas - Canvas element or ID
     * @param {Object} options - Custom overrides or sound callbacks
     */
    constructor(canvas, options = {}) {
        this.canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
        if (!this.canvas) {
            throw new Error(`Jar canvas element not found: ${canvas}`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.options = options;
        this.style = { ...JAR_STYLE, ...(options.style || {}) };

        this.particles = [];
        this.items = [];
        this.shakeAmount = 0;
        this.animFrameId = null;
        this.width = 0;
        this.height = 0;

        this.boundResize = this.resize.bind(this);
        window.addEventListener('resize', this.boundResize);

        this.resize();
        this.startLoop();
    }

    /**
     * Set the current movie slips to display inside the jar
     * @param {Array<{title: string, category?: string, genre?: string, color?: string}>} items
     */
    setItems(items) {
        this.items = Array.isArray(items) ? [...items] : [];
        this.initParticles();
    }

    /**
     * Initialize physical particles for each movie item inside jar boundaries
     */
    initParticles() {
        const bounds = this.getJarBounds();
        this.particles = [];

        this.items.forEach((item, index) => {
            const color = this.getItemColor(item, index);
            const w = this.style.slips.minWidth + Math.random() * (this.style.slips.maxWidth - this.style.slips.minWidth);
            const h = this.style.slips.minHeight + Math.random() * (this.style.slips.maxHeight - this.style.slips.minHeight);

            this.particles.push({
                x: bounds.left + 15 + Math.random() * (bounds.right - bounds.left - 30),
                y: bounds.bottom - 15 - Math.random() * (bounds.bottom - bounds.top) * 0.7,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                angle: Math.random() * Math.PI * 2,
                vAngle: (Math.random() - 0.5) * 0.05,
                width: w,
                height: h,
                color: color,
                data: item
            });
        });
    }

    /**
     * Get slip color based on movie category
     */
    getItemColor(item, index) {
        if (item.color) return item.color;
        if (item.category && this.style.slips.categoryColors[item.category]) {
            return this.style.slips.categoryColors[item.category];
        }
        return this.style.slips.palette[index % this.style.slips.palette.length];
    }

    /**
     * Calculate bounding box coordinates of jar interior
     */
    getJarBounds() {
        const w = this.width;
        const h = this.height;
        const d = this.style.dimensions;

        const jarX = w * ((1 - d.bodyWidthRatio) / 2);
        const jarY = h * d.bodyYRatio;
        const jarW = w * d.bodyWidthRatio;
        const jarH = h * d.bodyHeightRatio;

        return {
            x: jarX,
            y: jarY,
            width: jarW,
            height: jarH,
            left: jarX,
            right: jarX + jarW,
            top: jarY + 20,
            bottom: jarY + jarH - 8
        };
    }

    /**
     * Trigger a physical shake animation
     * @param {number} [intensity=18]
     */
    shake(intensity = 18) {
        this.shakeAmount = intensity;

        if (typeof this.options.onShake === 'function') {
            this.options.onShake();
        }

        const pCfg = this.style.physics;
        this.particles.forEach(p => {
            p.vx += (Math.random() - 0.5) * pCfg.shakeForceX;
            p.vy -= Math.random() * pCfg.shakeForceY + 2;
            p.vAngle += (Math.random() - 0.5) * 0.35;
        });
    }

    /**
     * Draw the jar's cork lid and glass body
     */
    drawJarBody() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const d = this.style.dimensions;
        const cork = this.style.cork;
        const glass = this.style.glass;

        const jarX = w * ((1 - d.bodyWidthRatio) / 2);
        const jarY = h * d.bodyYRatio;
        const jarW = w * d.bodyWidthRatio;
        const jarH = h * d.bodyHeightRatio;
        const radius = d.cornerRadius;

        ctx.save();

        // 1. Draw Cork Lid
        const corkW = w * cork.widthRatio;
        const corkX = (w - corkW) / 2;
        const corkY = jarY - cork.height;

        ctx.fillStyle = cork.color;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(corkX, corkY, corkW, cork.height, cork.topCornerRadius);
        } else {
            ctx.rect(corkX, corkY, corkW, cork.height);
        }
        ctx.fill();

        // Cork shadow & wood grain accents
        ctx.fillStyle = cork.accentLineColor;
        ctx.fillRect(corkX + corkW * 0.08, jarY - cork.height * 0.65, corkW * 0.84, 3);
        ctx.fillRect(corkX + corkW * 0.15, jarY - cork.height * 0.35, corkW * 0.70, 2);

        // 2. Jar Rim
        ctx.strokeStyle = glass.rimStrokeColor;
        ctx.lineWidth = glass.rimStrokeWidth;
        ctx.beginPath();
        ctx.ellipse(w * 0.5, jarY, jarW * (d.neckWidthRatio / d.bodyWidthRatio), d.neckHeightRatio * h, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Main Glass Silhouette
        ctx.beginPath();
        const neckEdge = (w - (w * d.neckWidthRatio)) / 2;
        ctx.moveTo(neckEdge, jarY);
        ctx.lineTo(jarX + radius, jarY + 12);
        ctx.quadraticCurveTo(jarX, jarY + 12, jarX, jarY + 12 + radius);
        ctx.lineTo(jarX, jarY + jarH - radius);
        ctx.quadraticCurveTo(jarX, jarY + jarH, jarX + radius, jarY + jarH);
        ctx.lineTo(jarX + jarW - radius, jarY + jarH);
        ctx.quadraticCurveTo(jarX + jarW, jarY + jarH, jarX + jarW, jarY + jarH - radius);
        ctx.lineTo(jarX + jarW, jarY + 12 + radius);
        ctx.quadraticCurveTo(jarX + jarW, jarY + 12, jarX + jarW - radius, jarY + 12);
        ctx.lineTo(w - neckEdge, jarY);
        ctx.closePath();

        // Glass Gradient Fill
        const glassGrad = ctx.createLinearGradient(jarX, 0, jarX + jarW, 0);
        glass.gradientStops.forEach(stop => {
            glassGrad.addColorStop(stop.offset, stop.color);
        });
        ctx.fillStyle = glassGrad;
        ctx.fill();

        // Glass Outer Outline
        ctx.strokeStyle = glass.strokeColor;
        ctx.lineWidth = glass.strokeWidth;
        ctx.stroke();

        // 4. Glass Glare & Specular Highlights
        glass.highlights.forEach(gl => {
            ctx.beginPath();
            if (gl.height) {
                ctx.moveTo(jarX + gl.xOffset, jarY + gl.topOffset);
                ctx.lineTo(jarX + gl.xOffset, jarY + gl.topOffset + gl.height);
            } else {
                ctx.moveTo(jarX + gl.xOffset, jarY + gl.topOffset);
                ctx.lineTo(jarX + gl.xOffset, jarY + jarH - gl.bottomOffset);
            }
            ctx.strokeStyle = gl.color;
            ctx.lineWidth = gl.lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
        });

        ctx.restore();
    }

    /**
     * Render frame loop
     */
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        ctx.save();

        // Apply Jar Shake Translation
        if (this.shakeAmount > 0.1) {
            const offsetX = (Math.random() - 0.5) * this.shakeAmount;
            const offsetY = (Math.random() - 0.5) * this.shakeAmount;
            ctx.translate(offsetX, offsetY);
            this.shakeAmount *= this.style.physics.shakeDecay;
        } else {
            this.shakeAmount = 0;
        }

        const bounds = this.getJarBounds();
        const pCfg = this.style.physics;
        const sCfg = this.style.slips;

        // Simulate & Draw Paper Slips
        for (let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.angle += p.vAngle;

            // Physics (gravity + damping)
            p.vy += pCfg.gravity;
            p.vx *= pCfg.frictionX;
            p.vy *= pCfg.frictionY;
            p.vAngle *= pCfg.angularDamping;

            // Collision with Jar walls
            if (p.x < bounds.left + 8) { p.x = bounds.left + 8; p.vx *= -0.5; }
            if (p.x > bounds.right - 8) { p.x = bounds.right - 8; p.vx *= -0.5; }
            if (p.y > bounds.bottom) { p.y = bounds.bottom; p.vy *= -0.3; }
            if (p.y < bounds.top) { p.y = bounds.top; p.vy *= -0.5; }

            // Draw Paper Slip
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);

            // Shadow
            ctx.fillStyle = sCfg.shadowColor;
            ctx.fillRect(-p.width / 2 + sCfg.shadowOffset, -p.height / 2 + sCfg.shadowOffset, p.width, p.height);

            // Folded Slip Body
            ctx.fillStyle = p.color;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, sCfg.borderRadius);
            } else {
                ctx.rect(-p.width / 2, -p.height / 2, p.width, p.height);
            }
            ctx.fill();

            // Fold Crease Line
            ctx.strokeStyle = `rgba(0,0,0,${sCfg.creaseOpacity})`;
            ctx.beginPath();
            ctx.moveTo(-p.width / 4, -p.height / 2);
            ctx.lineTo(-p.width / 4, p.height / 2);
            ctx.stroke();

            ctx.restore();
        }

        // Render Glass Jar on top of the slips for true 3D glass look
        this.drawJarBody();

        ctx.restore();
    }

    /**
     * Start animation frame loop
     */
    startLoop() {
        const loop = () => {
            this.render();
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }

    /**
     * Handle responsive canvas sizing & High-DPI screens
     */
    resize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width || 320;
        this.height = rect.height || 400;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.resetTransform?.();
        this.ctx.scale(dpr, dpr);

        this.initParticles();
    }

    /**
     * Clean up listeners and loops
     */
    destroy() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
        }
        window.removeEventListener('resize', this.boundResize);
    }
}
