// ═══════════════════════════════════════════════════════════════
// Optical Bench Dynamic Visualizer
// Editorial Optics Laboratory · Warm Liquid Glass
// Renders the physical optical path:
// Laser Transmitter -> Atmospheric Turbulence Chamber -> Deformable Mirror -> Receiver Airy Disk
// Works over the photorealistic optical bench scene with live physical parameters.
// ═══════════════════════════════════════════════════════════════

class OpticalBenchVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.time = 0;
    this.animId = null;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Wave parameters updated by simulation
    this.turbulenceIntensity = 1.0;
    this.correctionActive = true;
    this.wavefrontQuality = 0.78; // 0 (distorted) to 1.0 (perfect)
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.start();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    this.width = rect.width;
    this.height = Math.max(280, Math.min(480, rect.height || 380));
    
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  setTurbulence(intensity) {
    this.turbulenceIntensity = Math.max(0.2, Math.min(3.0, intensity));
  }

  setQuality(strehl) {
    this.wavefrontQuality = Math.max(0.05, Math.min(1.0, strehl || 0.78));
  }

  start() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const render = () => {
      this.time += 0.02;
      this.draw();
      this.animId = requestAnimationFrame(render);
    };
    if (!this.isReducedMotion) {
      this.animId = requestAnimationFrame(render);
    } else {
      this.draw();
    }
  }

  stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Bench optical axis baseline coordinates
    const cy = h * 0.52;
    const xTransmitter = w * 0.12;
    const xTurbStart = w * 0.28;
    const xTurbEnd = w * 0.52;
    const xMirror = w * 0.70;
    const xReceiver = w * 0.88;

    // 1. Draw Optical Bench Table / Rail with warm graphite and bronze marks
    this.drawBenchSurface(ctx, w, h, cy);

    // 2. Draw Transmitter Mount & Collimator Lens
    this.drawTransmitter(ctx, xTransmitter, cy);

    // 3. Draw Atmospheric Turbulence Chamber (refractive glass with plasma disturbance)
    this.drawTurbulenceChamber(ctx, xTurbStart, xTurbEnd, cy);

    // 4. Draw Deformable Mirror Assembly with micro-actuators
    this.drawDeformableMirror(ctx, xMirror, cy);

    // 5. Draw Receiver Target & Airy Spot
    this.drawReceiver(ctx, xReceiver, cy);

    // 6. Draw Propagating Optical Beam (Warm champagne & white core)
    this.drawLaserBeam(ctx, xTransmitter, xTurbStart, xTurbEnd, xMirror, xReceiver, cy);

    // 7. Draw Precision Laboratory Labels
    this.drawLabels(ctx, xTurbStart, xTurbEnd, xMirror, xReceiver, cy);
  }

  drawBenchSurface(ctx, w, h, cy) {
    // Optical rail line in warm neutral
    ctx.strokeStyle = 'rgba(75, 64, 49, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.05, cy + 55);
    ctx.lineTo(w * 0.95, cy + 55);
    ctx.stroke();

    // Rail support ticks with warm spacing
    for (let x = w * 0.08; x < w * 0.95; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, cy + 55);
      ctx.lineTo(x, cy + 61);
      ctx.strokeStyle = 'rgba(75, 64, 49, 0.14)';
      ctx.stroke();
    }
  }

  drawTransmitter(ctx, x, cy) {
    ctx.save();
    // Heavy cylindrical mount in graphite
    ctx.fillStyle = '#29251F';
    ctx.strokeStyle = 'rgba(168, 117, 67, 0.4)';
    ctx.lineWidth = 1.5;

    // Base post
    ctx.fillRect(x - 14, cy + 18, 28, 38);
    ctx.strokeRect(x - 14, cy + 18, 28, 38);

    // Collimator barrel
    ctx.beginPath();
    ctx.roundRect(x - 28, cy - 22, 50, 44, 4);
    ctx.fillStyle = '#3A342D';
    ctx.fill();
    ctx.stroke();

    // Aperture brass ring
    ctx.beginPath();
    ctx.ellipse(x + 22, cy, 6, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1F1B16';
    ctx.fill();
    ctx.strokeStyle = '#D8B994';
    ctx.stroke();

    // Laser core warm glow
    const glow = ctx.createRadialGradient(x + 22, cy, 0, x + 22, cy, 16);
    glow.addColorStop(0, '#FFFFFF');
    glow.addColorStop(0.3, '#F5DEB3');
    glow.addColorStop(0.6, 'rgba(216, 185, 148, 0.7)');
    glow.addColorStop(1, 'rgba(168, 117, 67, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x + 22, cy, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawTurbulenceChamber(ctx, x1, x2, cy) {
    ctx.save();
    const boxW = x2 - x1;
    const boxH = 120;
    const yTop = cy - boxH / 2;
    const isoOffset = 18;

    // Back face
    ctx.fillStyle = 'rgba(234, 226, 216, 0.35)';
    ctx.beginPath();
    ctx.rect(x1 + isoOffset, yTop - isoOffset, boxW, boxH);
    ctx.fill();

    // Connecting top plane
    ctx.fillStyle = 'rgba(216, 185, 148, 0.12)';
    ctx.beginPath();
    ctx.moveTo(x1, yTop);
    ctx.lineTo(x1 + isoOffset, yTop - isoOffset);
    ctx.lineTo(x2 + isoOffset, yTop - isoOffset);
    ctx.lineTo(x2, yTop);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(75, 64, 49, 0.2)';
    ctx.stroke();

    // Front glass face (Translucent Warm Liquid Glass)
    ctx.fillStyle = 'rgba(255, 253, 248, 0.45)';
    ctx.strokeStyle = 'rgba(75, 64, 49, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x1, yTop, boxW, boxH);
    ctx.fillRect(x1, yTop, boxW, boxH);

    // Warm glass surface highlight
    const grad = ctx.createLinearGradient(x1, yTop, x2, yTop + boxH);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(1, 'rgba(216, 185, 148, 0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(x1, yTop, boxW, boxH);

    // Dynamic turbulent phase ripple inside chamber
    ctx.save();
    ctx.beginPath();
    ctx.rect(x1, yTop, boxW, boxH);
    ctx.clip();

    const turbAmp = 12 * this.turbulenceIntensity;
    ctx.strokeStyle = 'rgba(168, 117, 67, 0.25)';
    ctx.lineWidth = 1.2;

    for (let line = 0; line < 3; line++) {
      ctx.beginPath();
      for (let x = x1; x <= x2; x += 6) {
        const prog = (x - x1) / boxW;
        const wave = Math.sin(prog * 8 + this.time * 2 + line * 1.5) * turbAmp
                   + Math.cos(prog * 14 - this.time * 1.2) * (turbAmp * 0.4);
        const y = cy - 25 + line * 25 + wave;
        if (x === x1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  drawDeformableMirror(ctx, x, cy) {
    ctx.save();
    // Mount Stand
    ctx.fillStyle = '#29251F';
    ctx.strokeStyle = 'rgba(168, 117, 67, 0.4)';
    ctx.fillRect(x - 10, cy + 24, 20, 32);
    ctx.strokeRect(x - 10, cy + 24, 20, 32);

    // Outer frame in dark bronze
    ctx.beginPath();
    ctx.roundRect(x - 18, cy - 55, 36, 88, 6);
    ctx.fillStyle = '#3A342D';
    ctx.fill();
    ctx.strokeStyle = '#A87543';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Actuator grid (segmented micro-actuator matrix)
    const rows = 6;
    const cols = 3;
    const startX = x - 10;
    const startY = cy - 44;
    const cellW = 8;
    const cellH = 12;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = startX + c * cellW;
        const py = startY + r * cellH;
        // Subtle piezo actuator activation pulse
        const phaseShift = Math.sin(this.time * 2.5 + r * 0.8 + c * 1.2);
        const glowAlpha = 0.25 + 0.45 * (phaseShift * 0.5 + 0.5);

        ctx.fillStyle = `rgba(216, 185, 148, ${glowAlpha})`;
        ctx.fillRect(px + 1, py + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = 'rgba(75, 64, 49, 0.35)';
        ctx.strokeRect(px, py, cellW, cellH);
      }
    }

    // Reflective surface line
    ctx.strokeStyle = '#D8B994';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, cy - 44);
    ctx.lineTo(x - 10, cy + 28);
    ctx.stroke();

    ctx.restore();
  }

  drawReceiver(ctx, x, cy) {
    ctx.save();
    // Receiver mount
    ctx.fillStyle = '#29251F';
    ctx.strokeStyle = 'rgba(168, 117, 67, 0.4)';
    ctx.fillRect(x - 10, cy + 18, 20, 38);
    ctx.strokeRect(x - 10, cy + 18, 20, 38);

    // Sensor housing ring
    ctx.beginPath();
    ctx.ellipse(x, cy, 14, 46, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3A342D';
    ctx.fill();
    ctx.strokeStyle = '#A87543';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Focal plane detector area
    ctx.beginPath();
    ctx.ellipse(x, cy, 8, 30, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1A1815';
    ctx.fill();

    // Concentrated Airy disk spot at receiver
    const spotRadius = Math.max(2.5, 14 * (1.1 - this.wavefrontQuality));
    const spotGlow = ctx.createRadialGradient(x, cy, 0, x, cy, spotRadius * 2.8);
    spotGlow.addColorStop(0, '#FFFFFF');
    spotGlow.addColorStop(0.3, '#F5DEB3');
    spotGlow.addColorStop(0.7, 'rgba(168, 117, 67, 0.6)');
    spotGlow.addColorStop(1, 'rgba(168, 117, 67, 0)');
    ctx.fillStyle = spotGlow;
    ctx.beginPath();
    ctx.arc(x, cy, spotRadius * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Concentric Airy diffraction rings
    ctx.strokeStyle = 'rgba(216, 185, 148, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, cy, spotRadius * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawLaserBeam(ctx, xSrc, xTurb1, xTurb2, xMirr, xRecv, cy) {
    ctx.save();

    // ── Section 1: Collimator to Turbulence (Clean Coherent Gaussian Beam) ──
    const grad1 = ctx.createLinearGradient(xSrc, cy, xTurb1, cy);
    grad1.addColorStop(0, 'rgba(216, 185, 148, 0.9)');
    grad1.addColorStop(1, 'rgba(216, 185, 148, 0.75)');

    ctx.strokeStyle = grad1;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(xSrc + 22, cy);
    ctx.lineTo(xTurb1, cy);
    ctx.stroke();

    // Bright core
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(xSrc + 22, cy);
    ctx.lineTo(xTurb1, cy);
    ctx.stroke();

    // ── Section 2: Inside Turbulent Atmosphere (Scattering & Aberration) ──
    const turbSteps = 24;
    const dx = (xTurb2 - xTurb1) / turbSteps;
    const amp = 6 * this.turbulenceIntensity;

    // Distorted outer envelope
    ctx.strokeStyle = 'rgba(216, 185, 148, 0.65)';
    ctx.lineWidth = 8 + this.turbulenceIntensity * 3;
    ctx.beginPath();
    ctx.moveTo(xTurb1, cy);
    for (let i = 1; i <= turbSteps; i++) {
      const cx = xTurb1 + i * dx;
      const wobble = Math.sin(i * 0.9 + this.time * 3) * amp
                   + Math.cos(i * 1.4 - this.time * 2) * (amp * 0.5);
      ctx.lineTo(cx, cy + wobble);
    }
    ctx.stroke();

    // Scintillating core
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(xTurb1, cy);
    for (let i = 1; i <= turbSteps; i++) {
      const cx = xTurb1 + i * dx;
      const wobble = Math.sin(i * 0.9 + this.time * 3) * amp * 0.6;
      ctx.lineTo(cx, cy + wobble);
    }
    ctx.stroke();

    // ── Section 3: Chamber exit to Deformable Mirror ──
    const exitWobble = Math.sin(turbSteps * 0.9 + this.time * 3) * amp;
    ctx.strokeStyle = 'rgba(216, 185, 148, 0.7)';
    ctx.lineWidth = 7 + this.turbulenceIntensity * 2;
    ctx.beginPath();
    ctx.moveTo(xTurb2, cy + exitWobble);
    ctx.lineTo(xMirr - 10, cy);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(xTurb2, cy + exitWobble);
    ctx.lineTo(xMirr - 10, cy);
    ctx.stroke();

    // ── Section 4: Deformable Mirror to Receiver (Corrected Beam) ──
    // Recovers tightly focused convergence towards receiver Airy disk
    const gradRec = ctx.createLinearGradient(xMirr, cy, xRecv, cy);
    gradRec.addColorStop(0, 'rgba(216, 185, 148, 0.85)');
    gradRec.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

    const correctedWidth = Math.max(3, 8 * (1.1 - this.wavefrontQuality));
    ctx.strokeStyle = gradRec;
    ctx.lineWidth = correctedWidth;
    ctx.beginPath();
    ctx.moveTo(xMirr, cy);
    ctx.lineTo(xRecv, cy);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xMirr, cy);
    ctx.lineTo(xRecv, cy);
    ctx.stroke();

    ctx.restore();
  }

  drawLabels(ctx, x1, x2, xMirr, xRecv, cy) {
    ctx.save();
    ctx.font = '500 10px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#6D655B';
    ctx.textAlign = 'center';

    // Label 1: Laser Source
    ctx.fillText('λ = 1550 nm TX', w(0.12), cy + 74);

    // Label 2: Turbulence Box
    const turbLabel = `Cn² = ${(Math.pow(10, Math.log10(this.turbulenceIntensity) - 13)).toExponential(1)}`;
    ctx.fillText(`Turbulence Chamber (${turbLabel})`, (x1 + x2) / 2, cy + 74);

    // Label 3: DM
    ctx.fillText('Deformable Mirror (AO)', xMirr, cy + 74);

    // Label 4: Receiver Airy Disc
    const strehlText = `Airy RX (S = ${this.wavefrontQuality.toFixed(2)})`;
    ctx.fillText(strehlText, xRecv, cy + 74);

    function w(fraction) {
      return ctx.canvas.width / (window.devicePixelRatio || 1) * fraction;
    }

    ctx.restore();
  }
}
