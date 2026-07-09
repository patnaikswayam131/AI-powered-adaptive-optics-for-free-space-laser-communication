// ============================================================================
// Turbulent Atmosphere Particle System
// Simulates atmospheric turbulence for the hero section
// Particles represent refractive index fluctuations drifting in wind
// ============================================================================

class TurbulentParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.connections = [];
    this.time = 0;
    this.animId = null;
    this.mouseX = -1000;
    this.mouseY = -1000;
    
    // Configuration
    this.config = {
      particleCount: 130,
      connectionDistance: 120,
      windSpeed: 0.3,
      turbulenceScale: 0.003,
      turbulenceStrength: 1.5,
      eddyFrequency: 0.02,
      laserY: 0.5,  // laser beam at 50% height
      colors: {
        cyan: { r: 0, g: 212, b: 255 },
        violet: { r: 124, g: 58, b: 237 },
        orange: { r: 255, g: 122, b: 23 }
      }
    };
    
    this.resize();
    this.initParticles();
    this.bindEvents();
    this.animate();
  }
  
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.width = rect.width;
    this.height = rect.height;
  }
  
  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }
  
  createParticle(x, y) {
    // Particles have a "layer" - determines their turbulence behavior
    const layer = Math.random();
    const posY = y || Math.random() * this.height;
    const isNearLaser = Math.abs(posY / this.height - this.config.laserY) < 0.15;
    
    return {
      x: x || Math.random() * this.width,
      y: posY,
      baseX: 0,
      baseY: 0,
      vx: (0.2 + Math.random() * 0.8) * this.config.windSpeed,  // wind drift (left to right)
      vy: (Math.random() - 0.5) * 0.2,  // slight vertical drift
      size: 1 + Math.random() * 2.5,
      opacity: 0.15 + Math.random() * 0.5,
      layer: layer,
      phase: Math.random() * Math.PI * 2,  // individual turbulence phase
      eddyRadius: 10 + Math.random() * 30,
      eddySpeed: 0.5 + Math.random() * 1.5,
      // Color: cyan near laser, violet elsewhere, occasional orange
      color: isNearLaser 
        ? this.config.colors.cyan 
        : (Math.random() < 0.15 ? this.config.colors.orange : this.config.colors.violet),
      life: 1,
      maxLife: 300 + Math.random() * 500
    };
  }
  
  // Simplex-like noise function (simplified Perlin)
  // Produces smooth, continuous turbulence fields
  noise(x, y, t) {
    const s = this.config.turbulenceScale;
    return Math.sin(x * s * 2.3 + t * 0.7) * Math.cos(y * s * 1.7 + t * 0.5) +
           Math.sin(x * s * 3.1 + y * s * 2.8 + t * 0.3) * 0.5 +
           Math.cos(x * s * 1.4 - y * s * 0.9 + t * 0.8) * 0.3;
  }
  
  updateParticles() {
    this.time += 0.016;  // ~60fps timestep
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      // Turbulent displacement (eddy motion)
      const noiseX = this.noise(p.x, p.y, this.time) * this.config.turbulenceStrength;
      const noiseY = this.noise(p.x + 500, p.y + 500, this.time) * this.config.turbulenceStrength;
      
      // Eddy rotation (particles swirl in local vortices)
      const eddyAngle = this.time * p.eddySpeed + p.phase;
      const eddyX = Math.cos(eddyAngle) * p.eddyRadius * 0.02;
      const eddyY = Math.sin(eddyAngle) * p.eddyRadius * 0.02;
      
      // Update position: wind + turbulence + eddy
      p.x += p.vx + noiseX * 0.5 + eddyX;
      p.y += p.vy + noiseY * 0.3 + eddyY;
      
      // Mouse interaction (particles scatter from cursor like disturbed air)
      const dx = p.x - this.mouseX;
      const dy = p.y - this.mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100 && dist > 0) {
        const force = (100 - dist) / 100 * 2;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }
      
      // Wrap around edges
      if (p.x > this.width + 20) p.x = -20;
      if (p.x < -20) p.x = this.width + 20;
      if (p.y > this.height + 20) p.y = -20;
      if (p.y < -20) p.y = this.height + 20;
      
      // Opacity pulsing (simulates scintillation)
      p.opacity = (0.15 + Math.random() * 0.1) + 
                  Math.sin(this.time * 2 + p.phase) * 0.1;
    }
  }
  
  drawLaserBeam() {
    // Draw a faint, wavering laser beam across the canvas
    const ctx = this.ctx;
    const y = this.height * this.config.laserY;
    
    ctx.beginPath();
    ctx.moveTo(0, y);
    
    // Wavy laser beam path - multiple sine frequencies for realistic distortion
    for (let x = 0; x <= this.width; x += 4) {
      const wave = Math.sin(x * 0.01 + this.time * 2) * 3 +
                   Math.sin(x * 0.03 + this.time * 1.5) * 2 +
                   this.noise(x, y, this.time * 2) * 5;
      ctx.lineTo(x, y + wave);
    }
    
    // Outer cyan glow (widest, faintest)
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.12)';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Mid glow
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Core beam (brightest, thinnest)
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  drawParticles() {
    const ctx = this.ctx;
    
    for (const p of this.particles) {
      const { r, g, b } = p.color;
      
      // Core particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
      ctx.fill();
      
      // Glow effect for brighter particles (simulates optical scattering)
      if (p.opacity > 0.3) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.1})`;
        ctx.fill();
      }
    }
  }
  
  drawConnections() {
    // Connect nearby particles to create a 'wavefront mesh' effect
    const ctx = this.ctx;
    const maxDist = this.config.connectionDistance;
    
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.15;
          // Blend colors between connected particles
          const r = (a.color.r + b.color.r) / 2;
          const g = (a.color.g + b.color.g) / 2;
          const bl = (a.color.b + b.color.b) / 2;
          
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${bl}, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }
  
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawLaserBeam();
    this.drawConnections();
    this.drawParticles();
  }
  
  animate() {
    this.updateParticles();
    this.draw();
    this.animId = requestAnimationFrame(() => this.animate());
  }
  
  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.mouseX = -1000;
      this.mouseY = -1000;
    });
  }
  
  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
