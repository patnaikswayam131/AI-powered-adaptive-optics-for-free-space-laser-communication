// ═══════════════════════════════════════════════════════════════
// Ambient Laboratory Dust Particle System
// Editorial Optics Laboratory · Warm Liquid Glass
// Simulates microscopic optical dust particles suspended in softly
// illuminated laboratory light. Highly restrained, quiet, and subtle.
// ═══════════════════════════════════════════════════════════════

class LaboratoryDustSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.time = 0;
    this.animId = null;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Very low density: 32 particles on desktop, 16 on mobile
    this.isMobile = window.innerWidth < 768;
    this.particleCount = this.isMobile ? 16 : 34;

    this.resize();
    this.initParticles();
    
    window.addEventListener('resize', () => {
      this.resize();
    });

    if (!this.isReducedMotion) {
      this.animate();
    } else {
      // Draw single static frame if reduced motion is requested
      this.drawStaticFrame();
    }
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement || document.body;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.width = rect.width || window.innerWidth;
    this.height = rect.height || window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle(false));
    }
  }

  createParticle(randomY = true) {
    // Warm optical laboratory palette:
    // Warm greys, subtle champagne highlights, and soft optical bronze
    const palette = [
      { r: 109, g: 101, b: 91, maxAlpha: 0.28 },   // Warm grey
      { r: 168, g: 117, b: 67, maxAlpha: 0.32 },   // Muted optical bronze
      { r: 216, g: 185, b: 148, maxAlpha: 0.35 },  // Warm champagne
      { r: 140, g: 130, b: 118, maxAlpha: 0.22 }   // Secondary grey
    ];

    const color = palette[Math.floor(Math.random() * palette.length)];
    const depth = 0.4 + Math.random() * 0.6; // Depth factor (0.4 = far, 1.0 = near)

    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : Math.random() * this.height,
      vx: (0.04 + Math.random() * 0.08) * depth,        // Very slow non-repeating horizontal drift
      vy: (Math.sin(Math.random() * Math.PI) - 0.5) * 0.04 * depth, // Subtle vertical Brownian drift
      radius: (0.75 + Math.random() * 1.6) * depth,     // 0.75px to 2.35px
      color: color,
      baseAlpha: color.maxAlpha * (0.6 + Math.random() * 0.4),
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.008 + Math.random() * 0.012,
      depth: depth
    };
  }

  animate() {
    this.time += 0.01;
    this.update();
    this.draw();
    this.animId = requestAnimationFrame(() => this.animate());
  }

  update() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Gentle drift
      p.x += p.vx;
      p.y += p.vy + Math.sin(this.time * 0.5 + p.pulsePhase) * 0.03;
      p.pulsePhase += p.pulseSpeed;

      // Wrap around seamlessly
      if (p.x > this.width + 10) p.x = -10;
      if (p.x < -10) p.x = this.width + 10;
      if (p.y > this.height + 10) p.y = -10;
      if (p.y < -10) p.y = this.height + 10;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Smooth sinusoidal oscillation of visibility (soft shimmer, no blinking)
      const alphaOsc = 0.75 + 0.25 * Math.sin(p.pulsePhase);
      const alpha = p.baseAlpha * alphaOsc;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
      ctx.fill();

      // Subtle warm halo for near champagne particles
      if (p.radius > 1.6 && p.color.r === 216) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(216, 185, 148, ${alpha * 0.2})`;
        ctx.fill();
      }
    }
  }

  drawStaticFrame() {
    this.draw();
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}

// Global initialization helper
window.initAmbientLaboratoryParticles = function(canvasId = 'ambient-particles-canvas') {
  if (typeof window.ambientDustSystem !== 'undefined' && window.ambientDustSystem) {
    window.ambientDustSystem.destroy();
  }
  window.ambientDustSystem = new LaboratoryDustSystem(canvasId);
  return window.ambientDustSystem;
};
