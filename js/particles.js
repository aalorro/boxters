import { COLORS } from './constants.js';

class Particle {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.vx = config.vx || (Math.random() - 0.5) * 2;
        this.vy = config.vy || (Math.random() - 0.5) * 2;
        this.life = config.life || 1.0;
        this.decay = config.decay || 0.01;
        this.size = config.size || 2;
        this.color = config.color || '#ffd700';
        this.alpha = config.alpha || 1.0;
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 0.99;
    }

    update(dt) {
        this.vy += this.gravity * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.life -= this.decay * dt * 60;
        this.alpha = Math.max(0, this.life);
    }

    get isDead() {
        return this.life <= 0;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.stars = [];
        this._initStars();
    }

    _initStars() {
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 1.5 + 0.5,
                brightness: Math.random(),
                speed: Math.random() * 0.5 + 0.2,
                phase: Math.random() * Math.PI * 2,
                color: COLORS.stars[Math.floor(Math.random() * COLORS.stars.length)]
            });
        }
    }

    emit(x, y, count, config = {}) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = (config.speed || 2) * (0.5 + Math.random() * 0.5);
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: config.life || 1.0,
                decay: config.decay || 0.02,
                size: config.size || (Math.random() * 3 + 1),
                color: config.color || COLORS.board.stroke,
                gravity: config.gravity || 0,
                friction: config.friction || 0.98
            }));
        }
    }

    emitVictoryBurst(x, y) {
        const colors = [COLORS.board.stroke, '#4ade80', '#60a5fa', '#f97316', '#c084fc'];
        for (let i = 0; i < 60; i++) {
            const angle = (Math.PI * 2 * i) / 60;
            const speed = 3 + Math.random() * 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.008,
                size: Math.random() * 4 + 2,
                color,
                gravity: 0.02,
                friction: 0.97
            }));
        }
    }

    emitClearEffect(x, y) {
        this.emit(x, y, 10, {
            speed: 2.5, life: 0.7, decay: 0.02,
            size: 3, color: COLORS.modes.clear.accent, friction: 0.95
        });
    }

    emitChainReplace(x, y) {
        this.emit(x, y, 8, {
            speed: 1.5, life: 0.6, decay: 0.025,
            size: 2.5, color: COLORS.modes.chain.accent, friction: 0.97
        });
    }

    emitIlluminate(x, y) {
        this.emit(x, y, 6, {
            speed: 1.0, life: 1.0, decay: 0.012,
            size: 3, color: COLORS.modes.illuminate.accent, friction: 0.99
        });
    }

    emitConfetti(width, height) {
        const colors = ['#ffd700', '#ff6b6b', '#4ade80', '#60a5fa', '#c084fc', '#f97316', '#ec4899', '#22d3ee'];
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * width;
            this.particles.push(new Particle(x, -10 - Math.random() * 200, {
                vx: (Math.random() - 0.5) * 2,
                vy: 1.5 + Math.random() * 2.5,
                life: 1.0,
                decay: 0.008,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                gravity: 0.03,
                friction: 0.995
            }));
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].isDead) {
                this.particles.splice(i, 1);
            }
        }
    }

    renderStars(ctx, width, height, time) {
        for (const star of this.stars) {
            const brightness = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * star.speed + star.phase));
            ctx.globalAlpha = brightness * 0.8;
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    renderParticles(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = p.size * 3;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}
