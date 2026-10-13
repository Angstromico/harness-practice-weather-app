/**
 * AETHER WEATHER - ATMOSPHERIC CANVAS PARTICLE ENGINE
 * Renders rain, snow, drifting clouds, lightning, sun rays, and celestial stars.
 */

class WeatherCanvasFX {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");

    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.condition = "sunny";
    this.isDay = true;
    this.windSpeed = 10;

    this.particles = [];
    this.lightningAlpha = 0;
    this.nextLightningTime = 0;

    this.init();
  }

  init() {
    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
    this.populateParticles();
    this.animate();
  }

  handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.populateParticles();
  }

  setCondition(condType, isDay, windSpeed = 12) {
    if (this.condition === condType && this.isDay === isDay && Math.abs(this.windSpeed - windSpeed) < 3) return;
    this.condition = condType;
    this.isDay = isDay;
    this.windSpeed = windSpeed;
    this.populateParticles();
  }

  populateParticles() {
    this.particles = [];
    const count = this.getParticleCount();

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  getParticleCount() {
    if (this.condition === "rainy") return Math.min(220, Math.floor(this.width * 0.18));
    if (this.condition === "thunderstorm") return Math.min(320, Math.floor(this.width * 0.25));
    if (this.condition === "snowy") return Math.min(180, Math.floor(this.width * 0.15));
    if (this.condition === "cloudy") return 18;
    if (this.condition === "clear-night" || !this.isDay) return 120; // stars
    return 35; // sunny dust motes / sun rays
  }

  createParticle() {
    const p = {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: 1,
      speedX: 0,
      speedY: 0,
      opacity: 0.5,
      alphaSpeed: 0.01,
      angle: 0,
      wobbleSpeed: 0.02
    };

    if (this.condition === "rainy" || this.condition === "thunderstorm") {
      const isThunder = this.condition === "thunderstorm";
      p.length = Math.random() * 22 + (isThunder ? 24 : 14);
      p.speedY = Math.random() * 8 + (isThunder ? 18 : 12);
      p.speedX = (this.windSpeed / 10) * (isThunder ? 4 : 2);
      p.size = Math.random() * 1.5 + 0.8;
      p.opacity = Math.random() * 0.4 + 0.3;
    } else if (this.condition === "snowy") {
      p.size = Math.random() * 3.5 + 1.2;
      p.speedY = Math.random() * 1.5 + 0.8;
      p.speedX = (Math.random() - 0.5) * 0.8 + (this.windSpeed / 20);
      p.opacity = Math.random() * 0.6 + 0.3;
      p.wobbleSpeed = Math.random() * 0.04 + 0.01;
      p.angle = Math.random() * Math.PI * 2;
    } else if (this.condition === "cloudy") {
      p.size = Math.random() * 160 + 120;
      p.speedX = (Math.random() * 0.2 + 0.1) * (this.windSpeed / 10 + 0.5);
      p.speedY = (Math.random() - 0.5) * 0.05;
      p.opacity = Math.random() * 0.12 + 0.04;
    } else if (this.condition === "clear-night" || !this.isDay) {
      // Star particle
      p.size = Math.random() * 2.2 + 0.5;
      p.opacity = Math.random() * 0.8 + 0.2;
      p.alphaSpeed = Math.random() * 0.03 + 0.005;
      p.twinkleDir = Math.random() > 0.5 ? 1 : -1;
    } else {
      // Sunny warm sunbeam motes
      p.size = Math.random() * 2.5 + 1;
      p.speedY = -Math.random() * 0.4 - 0.1;
      p.speedX = (Math.random() - 0.5) * 0.3;
      p.opacity = Math.random() * 0.4 + 0.2;
      p.alphaSpeed = Math.random() * 0.02 + 0.005;
    }

    return p;
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render weather specific layers
    if (this.condition === "rainy" || this.condition === "thunderstorm") {
      this.drawRain();
    } else if (this.condition === "snowy") {
      this.drawSnow();
    } else if (this.condition === "cloudy") {
      this.drawClouds();
    } else if (this.condition === "clear-night" || !this.isDay) {
      this.drawStars();
    } else {
      this.drawSunRays();
    }

    requestAnimationFrame(() => this.animate());
  }

  drawRain() {
    const isThunder = this.condition === "thunderstorm";

    // Handle lightning flashes
    if (isThunder) {
      const now = Date.now();
      if (now > this.nextLightningTime) {
        this.lightningAlpha = 0.85;
        this.nextLightningTime = now + Math.random() * 6000 + 4000;
      }

      if (this.lightningAlpha > 0) {
        this.ctx.fillStyle = `rgba(235, 240, 255, ${this.lightningAlpha * 0.35})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.lightningAlpha -= 0.04;
      }
    }

    this.ctx.lineWidth = 1.2;
    for (let p of this.particles) {
      this.ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity})`;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x + p.speedX * 2, p.y + p.length);
      this.ctx.stroke();

      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y > this.height) {
        p.y = -p.length;
        p.x = Math.random() * this.width;
      }
      if (p.x > this.width) p.x = 0;
      if (p.x < 0) p.x = this.width;
    }
  }

  drawSnow() {
    for (let p of this.particles) {
      this.ctx.fillStyle = `rgba(240, 249, 255, ${p.opacity})`;
      this.ctx.beginPath();
      p.angle += p.wobbleSpeed;
      const wobbleX = Math.sin(p.angle) * 1.5;
      this.ctx.arc(p.x + wobbleX, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y > this.height) {
        p.y = -5;
        p.x = Math.random() * this.width;
      }
      if (p.x > this.width) p.x = 0;
      if (p.x < 0) p.x = this.width;
    }
  }

  drawClouds() {
    for (let p of this.particles) {
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, `rgba(203, 213, 225, ${p.opacity})`);
      gradient.addColorStop(0.7, `rgba(148, 163, 184, ${p.opacity * 0.5})`);
      gradient.addColorStop(1, "rgba(148, 163, 184, 0)");

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x - p.size > this.width) {
        p.x = -p.size;
        p.y = Math.random() * (this.height * 0.6);
      }
    }
  }

  drawStars() {
    for (let p of this.particles) {
      p.opacity += p.alphaSpeed * p.twinkleDir;
      if (p.opacity > 0.95) { p.opacity = 0.95; p.twinkleDir = -1; }
      if (p.opacity < 0.15) { p.opacity = 0.15; p.twinkleDir = 1; }

      this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawSunRays() {
    // Subtle sun flare glow at top corner
    const grad = this.ctx.createRadialGradient(this.width * 0.85, 0, 0, this.width * 0.85, 0, this.width * 0.6);
    grad.addColorStop(0, "rgba(251, 191, 36, 0.12)");
    grad.addColorStop(0.4, "rgba(245, 158, 11, 0.05)");
    grad.addColorStop(1, "rgba(245, 158, 11, 0)");
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Warm golden ambient motes
    for (let p of this.particles) {
      p.opacity += p.alphaSpeed;
      if (p.opacity > 0.6 || p.opacity < 0.1) p.alphaSpeed = -p.alphaSpeed;

      this.ctx.fillStyle = `rgba(253, 224, 71, ${Math.max(0, p.opacity)})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y < -10) {
        p.y = this.height + 5;
        p.x = Math.random() * this.width;
      }
    }
  }
}

window.WeatherCanvasFX = WeatherCanvasFX;
