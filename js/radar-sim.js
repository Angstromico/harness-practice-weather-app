/**
 * AETHER WEATHER - SIMULATED DOPPLER RADAR & TELEMETRY
 * Generates realistic animated radar sweep, precipitation echoes, and wind layers.
 */

class RadarSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");

    this.sweepAngle = 0;
    this.sweepSpeed = 0.035; // radians per frame
    this.layer = "precip"; // 'precip', 'wind', 'temp'
    this.condition = "sunny";

    this.blobs = [];
    this.windParticles = [];
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.generateEchoes();
    this.initWindParticles();
    this.animate();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.cx = this.width / 2;
    this.cy = this.height / 2;
    this.radius = Math.min(this.cx, this.cy) - 8;
  }

  setCondition(cond) {
    this.condition = cond;
    this.generateEchoes();
  }

  setLayer(layer) {
    this.layer = layer;
  }

  generateEchoes() {
    this.blobs = [];
    const isRain = this.condition === "rainy";
    const isStorm = this.condition === "thunderstorm";
    const isSnow = this.condition === "snowy";
    const hasPrecip = isRain || isStorm || isSnow;

    const count = hasPrecip ? (isStorm ? 16 : 10) : 4;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (this.radius * 0.75) + 15;
      this.blobs.push({
        x: this.cx + Math.cos(angle) * dist,
        y: this.cy + Math.sin(angle) * dist,
        radius: Math.random() * (isStorm ? 45 : 30) + 18,
        intensity: hasPrecip ? (isStorm ? Math.random() * 0.6 + 0.4 : Math.random() * 0.4 + 0.2) : 0.08,
        driftX: (Math.random() - 0.2) * 0.4,
        driftY: (Math.random() - 0.5) * 0.2,
        isSnow
      });
    }
  }

  initWindParticles() {
    this.windParticles = [];
    for (let i = 0; i < 70; i++) {
      this.windParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: Math.random() * 1.5 + 1.2,
        length: Math.random() * 12 + 6,
        life: Math.random() * 100
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawRadarGrid();

    if (this.layer === "precip") {
      this.drawPrecipEchoes();
    } else if (this.layer === "wind") {
      this.drawWindStreamlines();
    } else if (this.layer === "temp") {
      this.drawThermalHeatmap();
    }

    this.drawSweeperBeam();
    this.drawOverlays();

    this.sweepAngle = (this.sweepAngle + this.sweepSpeed) % (Math.PI * 2);

    requestAnimationFrame(() => this.animate());
  }

  drawRadarGrid() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
    ctx.lineWidth = 1;

    // Range rings
    const rings = 4;
    for (let i = 1; i <= rings; i++) {
      const r = (this.radius / rings) * i;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Range text
      ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
      ctx.font = "9px monospace";
      ctx.fillText(`${i * 25}km`, this.cx + 4, this.cy - r + 11);
    }

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(this.cx - this.radius, this.cy);
    ctx.lineTo(this.cx + this.radius, this.cy);
    ctx.moveTo(this.cx, this.cy - this.radius);
    ctx.lineTo(this.cx, this.cy + this.radius);
    ctx.stroke();

    ctx.restore();
  }

  drawPrecipEchoes() {
    const ctx = this.ctx;

    for (let b of this.blobs) {
      // Drift blobs slightly
      b.x += b.driftX;
      b.y += b.driftY;
      if (b.x < this.cx - this.radius) b.x = this.cx + this.radius;
      if (b.x > this.cx + this.radius) b.x = this.cx - this.radius;

      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);

      if (b.isSnow) {
        // Cyan / Ice echoes
        grad.addColorStop(0, `rgba(186, 230, 253, ${b.intensity})`);
        grad.addColorStop(0.5, `rgba(56, 189, 248, ${b.intensity * 0.5})`);
        grad.addColorStop(1, "rgba(56, 189, 248, 0)");
      } else {
        // Standard NEXRAD Doppler dBZ Colors
        if (b.intensity > 0.7) {
          grad.addColorStop(0, "rgba(239, 68, 68, 0.85)"); // Intense Core Red
          grad.addColorStop(0.4, "rgba(245, 158, 11, 0.7)"); // Orange
          grad.addColorStop(0.7, "rgba(16, 185, 129, 0.5)"); // Green
          grad.addColorStop(1, "rgba(2, 132, 199, 0)");
        } else if (b.intensity > 0.35) {
          grad.addColorStop(0, "rgba(245, 158, 11, 0.75)"); // Orange/Yellow
          grad.addColorStop(0.5, "rgba(16, 185, 129, 0.5)"); // Green
          grad.addColorStop(1, "rgba(2, 132, 199, 0)");
        } else {
          grad.addColorStop(0, "rgba(16, 185, 129, 0.45)"); // Light Green
          grad.addColorStop(0.6, "rgba(2, 132, 199, 0.25)"); // Light Blue
          grad.addColorStop(1, "rgba(2, 132, 199, 0)");
        }
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawWindStreamlines() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";

    for (let p of this.windParticles) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.length, p.y - p.length * 0.3);
      ctx.stroke();

      p.x += p.speed;
      p.y -= p.speed * 0.3;
      p.life++;

      if (p.x > this.width || p.y < 0) {
        p.x = 0;
        p.y = Math.random() * this.height;
      }
    }
    ctx.restore();
  }

  drawThermalHeatmap() {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(this.cx - 20, this.cy + 20, 10, this.cx, this.cy, this.radius);
    grad.addColorStop(0, "rgba(245, 158, 11, 0.35)");
    grad.addColorStop(0.5, "rgba(56, 189, 248, 0.25)");
    grad.addColorStop(1, "rgba(99, 102, 241, 0.15)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSweeperBeam() {
    const ctx = this.ctx;
    ctx.save();

    // Sweeping pie sector with phosphorescent fade
    const sweepSpread = 0.45; // angle of tail in radians
    const grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, this.radius);
    grad.addColorStop(0, "rgba(56, 189, 248, 0.3)");
    grad.addColorStop(1, "rgba(56, 189, 248, 0.05)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(this.cx, this.cy);
    ctx.arc(this.cx, this.cy, this.radius, this.sweepAngle - sweepSpread, this.sweepAngle);
    ctx.closePath();
    ctx.fill();

    // Leading bright line
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.8;
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(this.cx, this.cy);
    ctx.lineTo(
      this.cx + Math.cos(this.sweepAngle) * this.radius,
      this.cy + Math.sin(this.sweepAngle) * this.radius
    );
    ctx.stroke();

    ctx.restore();
  }

  drawOverlays() {
    const ctx = this.ctx;
    ctx.save();

    // Center site marker
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Boundary ring
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

window.RadarSimulator = RadarSimulator;
