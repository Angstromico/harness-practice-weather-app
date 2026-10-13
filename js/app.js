/**
 * AETHER WEATHER - APPLICATION CONTROLLER
 * Coordinates UI rendering, event listeners, unit conversions, and simulator controls.
 */

class WeatherApp {
  constructor() {
    this.currentCityName = "Tokyo";
    this.unit = "C"; // 'C' or 'F'
    this.currentData = null;

    // Subsystems
    this.engine = window.WeatherEngine;
    this.canvasFX = null;
    this.radarSim = null;

    this.init();
  }

  init() {
    // Initialize canvas systems
    this.canvasFX = new WeatherCanvasFX("weather-canvas");
    this.radarSim = new RadarSimulator("radar-canvas");

    this.bindEvents();
    this.loadCity(this.currentCityName);

    // Live clock ticker
    setInterval(() => {
      if (this.currentData && this.engine.overrides.timeHourOffset === null) {
        this.updateClockDisplay();
      }
    }, 1000);
  }

  /* Unit Conversion Helpers */
  toDisplayTemp(celsius) {
    if (this.unit === "F") {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  }

  getTempUnitLabel() {
    return `°${this.unit}`;
  }

  /* Load and synthesize city weather data */
  loadCity(cityName) {
    const profile = this.engine.getCityProfile(cityName);
    this.currentCityName = profile.name;
    this.currentData = this.engine.computeWeather(profile);

    this.renderAll();
    this.updateActiveCityChip();
  }

  renderAll() {
    if (!this.currentData) return;
    const d = this.currentData;

    // 1. Update Body Theme
    this.applyTheme(d.conditionType, d.isDay);

    // 2. Update Canvas Particles & Radar
    this.canvasFX.setCondition(d.conditionType, d.isDay, d.windSpeed);
    this.radarSim.setCondition(d.conditionType);

    // 3. Render Hero Section
    document.getElementById("location-name").textContent = d.city;
    document.getElementById("location-country").textContent = d.country;
    document.getElementById("climate-zone").textContent = d.climateZone;
    document.getElementById("coordinates").textContent = d.coordinates;
    document.getElementById("local-time").textContent = `${d.localTimeFormatted} local`;

    // Temperature Hero
    const heroTempEl = document.getElementById("hero-temp");
    heroTempEl.textContent = this.toDisplayTemp(d.temp);
    document.getElementById("hero-temp-unit").textContent = this.getTempUnitLabel();

    document.getElementById("hi-temp-val").textContent = `${this.toDisplayTemp(d.highTemp)}°`;
    document.getElementById("low-temp-val").textContent = `${this.toDisplayTemp(d.lowTemp)}°`;
    document.getElementById("feels-like-val").textContent = `${this.toDisplayTemp(d.feelsLike)}°${this.unit}`;

    document.getElementById("condition-label").textContent = d.condition;
    document.getElementById("condition-summary").textContent = d.summary;

    // SVG icon showcase
    const iconShowcase = document.getElementById("weather-icon-showcase");
    iconShowcase.innerHTML = `<div class="weather-art-icon">${d.iconSvg}</div>`;

    // 4. Render Bento Details
    this.renderBentoMetrics(d);

    // 5. Render Hourly Track
    this.renderHourly(d.hourlyForecast);

    // 6. Render 7-Day Forecast
    this.renderDaily(d.dailyForecast);

    // 7. Check for Severe Weather Alert Toast
    this.checkWeatherAlert(d);

    // 8. Update Telemetry info
    this.updateTelemetryStamp();
  }

  applyTheme(condType, isDay) {
    document.body.className = "";
    if (condType === "thunderstorm") {
      document.body.classList.add("theme-thunderstorm");
    } else if (condType === "rainy") {
      document.body.classList.add("theme-rainy");
    } else if (condType === "snowy") {
      document.body.classList.add("theme-snowy");
    } else if (condType === "cloudy") {
      document.body.classList.add("theme-cloudy");
    } else if (!isDay) {
      document.body.classList.add("theme-clear-night");
    } else {
      document.body.classList.add("theme-sunny");
    }
  }

  renderBentoMetrics(d) {
    // Air Quality
    const aqiValEl = document.getElementById("aqi-val");
    if (aqiValEl) aqiValEl.textContent = d.aqi;
    const aqiPillEl = document.getElementById("aqi-pill");
    if (aqiPillEl) {
      aqiPillEl.textContent = d.aqiLabel;
      aqiPillEl.className = `aqi-pill ${d.aqiClass}`;
    }
    const aqiBar = document.getElementById("aqi-meter-fill");
    if (aqiBar) {
      const pct = Math.min(100, Math.max(5, (d.aqi / 200) * 100));
      aqiBar.style.width = `${pct}%`;
    }
    const aqiMeta = document.getElementById("aqi-meta");
    if (aqiMeta) aqiMeta.textContent = `PM2.5: ${d.aqiPollutants.pm25} • O3: ${d.aqiPollutants.o3}`;

    // Wind & Compass
    const windSpeedEl = document.getElementById("wind-speed-val");
    if (windSpeedEl) windSpeedEl.textContent = d.windSpeed;
    const windDirEl = document.getElementById("wind-dir-val");
    if (windDirEl) windDirEl.textContent = d.windDirection;
    const compassNeedle = document.getElementById("compass-needle");
    if (compassNeedle) {
      compassNeedle.style.transform = `rotate(${d.windBearing}deg)`;
    }
    const windGustEl = document.getElementById("wind-gust-val");
    if (windGustEl) windGustEl.textContent = `Gusts up to ${d.windGust} km/h`;

    // UV Index
    const uvValEl = document.getElementById("uv-val");
    if (uvValEl) uvValEl.textContent = d.uvIndex;
    const uvCategoryEl = document.getElementById("uv-category-val");
    if (uvCategoryEl) uvCategoryEl.textContent = d.uvCategory;
    const uvBarFill = document.getElementById("uv-bar-fill");
    if (uvBarFill) {
      uvBarFill.style.width = `${Math.min(100, (d.uvIndex / 11) * 100)}%`;
    }

    // Humidity & Dew Point
    const humidityValEl = document.getElementById("humidity-val");
    if (humidityValEl) humidityValEl.textContent = `${d.humidity}%`;
    const dewPointValEl = document.getElementById("dewpoint-val");
    if (dewPointValEl) {
      dewPointValEl.textContent = `Dew point is ${this.toDisplayTemp(d.dewPoint)}°${this.unit} right now.`;
    }

    // Pressure
    const pressureValEl = document.getElementById("pressure-val");
    if (pressureValEl) pressureValEl.textContent = d.pressure;
    const pressureTrendEl = document.getElementById("pressure-trend-val");
    if (pressureTrendEl) pressureTrendEl.textContent = d.pressureTrend;

    // Visibility
    const visibilityValEl = document.getElementById("visibility-val");
    if (visibilityValEl) visibilityValEl.textContent = d.visibility;

    // Sun Arc
    this.renderSunArc(d);
  }

  renderSunArc(d) {
    const sunriseLabel = document.getElementById("sunrise-time");
    const sunsetLabel = document.getElementById("sunset-time");
    if (sunriseLabel) sunriseLabel.textContent = d.sunCycle.sunriseStr;
    if (sunsetLabel) sunsetLabel.textContent = d.sunCycle.sunsetStr;

    const sunDot = document.getElementById("sun-orbit-dot");
    if (!sunDot) return;

    // Calculate progression along arc [0, 1]
    const sr = d.sunCycle.sunriseHour;
    const ss = d.sunCycle.sunsetHour;
    const cur = d.localHour;

    let progress = 0;
    if (cur < sr) {
      progress = 0; // below horizon left
    } else if (cur > ss) {
      progress = 1; // below horizon right
    } else {
      progress = (cur - sr) / (ss - sr);
    }

    // Quadratic bezier arc: P0=(10, 50), P1=(100, -10), P2=(190, 50)
    const t = Math.max(0, Math.min(1, progress));
    const p0x = 10, p0y = 50;
    const p1x = 100, p1y = 5;
    const p2x = 190, p2y = 50;

    const x = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
    const y = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;

    sunDot.setAttribute("cx", x);
    sunDot.setAttribute("cy", y);
    sunDot.setAttribute("fill", d.isDay ? "#fbbf24" : "#94a3b8");
  }

  renderHourly(hourlyList) {
    const track = document.getElementById("hourly-track");
    if (!track) return;
    track.innerHTML = "";

    hourlyList.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = `hourly-card ${idx === 0 ? "now" : ""}`;

      card.innerHTML = `
        <span class="hourly-time">${item.label}</span>
        <div class="hourly-icon">${item.iconSvg}</div>
        <span class="hourly-temp">${this.toDisplayTemp(item.temp)}°</span>
        <span class="hourly-pop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
          ${item.pop}%
        </span>
      `;

      card.addEventListener("click", () => {
        this.engine.overrides.timeHourOffset = item.hour;
        const slider = document.getElementById("sim-time-slider");
        if (slider) slider.value = item.hour;
        const label = document.getElementById("sim-time-val");
        if (label) label.textContent = item.label;
        this.loadCity(this.currentCityName);
      });

      track.appendChild(card);
    });
  }

  renderDaily(dailyList) {
    const listContainer = document.getElementById("forecast-days-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    // Find global min and max in week for proportional bar scaling
    const allMins = dailyList.map(d => d.min);
    const allMaxs = dailyList.map(d => d.max);
    const globalMin = Math.min(...allMins);
    const globalMax = Math.max(...allMaxs);
    const range = Math.max(1, globalMax - globalMin);

    dailyList.forEach(item => {
      const row = document.createElement("div");
      row.className = "forecast-row";

      // Proportional bar width calculation
      const leftPct = ((item.min - globalMin) / range) * 80;
      const widthPct = Math.max(12, ((item.max - item.min) / range) * 80);

      row.innerHTML = `
        <div class="forecast-day-info">
          <div class="forecast-day-name">${item.dayName}</div>
          <div class="forecast-day-date">${item.dateStr}</div>
        </div>
        <div class="forecast-condition-cell">
          <div style="width:28px;height:28px;">${item.iconSvg}</div>
          <span class="forecast-condition-label">${item.condLabel}</span>
          ${item.pop > 30 ? `<span class="forecast-pop-badge">${item.pop}%</span>` : ""}
        </div>
        <div class="forecast-bar-cell">
          <span class="range-min">${this.toDisplayTemp(item.min)}°</span>
          <div class="range-track">
            <div class="range-segment" style="left: ${leftPct}%; width: ${widthPct}%;"></div>
          </div>
          <span class="range-max">${this.toDisplayTemp(item.max)}°</span>
        </div>
      `;

      listContainer.appendChild(row);
    });
  }

  checkWeatherAlert(d) {
    const toast = document.getElementById("weather-toast");
    if (!toast) return;

    if (d.conditionType === "thunderstorm") {
      document.getElementById("toast-title").textContent = "Severe Thunderstorm Warning";
      document.getElementById("toast-desc").textContent = "Simulated convective band active. High gusts and cloud-to-ground lightning detected.";
      toast.classList.add("show");
    } else if (d.windSpeed > 30) {
      document.getElementById("toast-title").textContent = "High Wind Advisory";
      document.getElementById("toast-desc").textContent = `Simulated gusts exceeding ${d.windGust} km/h across the metropolitan boundary.`;
      toast.classList.add("show");
    } else {
      toast.classList.remove("show");
    }
  }

  updateTelemetryStamp() {
    const stampEl = document.getElementById("telemetry-seed-badge");
    if (stampEl) {
      const latLon = this.currentData ? this.currentData.coordinates : "0.0°N, 0.0°E";
      const latency = Math.floor(Math.random() * 8 + 8);
      stampEl.textContent = `SEED: ${latLon} | STOCHASTIC: OK (${latency}ms)`;
    }
  }

  updateClockDisplay() {
    if (!this.currentData) return;
    const now = new Date();
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    const profile = this.engine.getCityProfile(this.currentCityName);
    const localHour = (utcHours + profile.tz + 24) % 24;
    document.getElementById("local-time").textContent = `${this.engine._formatDecimalTime(localHour)} local`;
  }

  updateActiveCityChip() {
    document.querySelectorAll(".city-chip").forEach(chip => {
      const city = chip.getAttribute("data-city");
      if (city && city.toLowerCase() === this.currentCityName.toLowerCase()) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  }

  bindEvents() {
    // 1. Search Bar & Dropdown Auto-Complete
    const searchInput = document.getElementById("search-input");
    const searchResults = document.getElementById("search-results");
    const clearBtn = document.getElementById("search-clear");

    searchInput.addEventListener("input", e => {
      const query = e.target.value.trim();
      clearBtn.classList.toggle("visible", query.length > 0);

      if (query.length < 1) {
        searchResults.classList.remove("active");
        return;
      }

      // Filter preset cities
      const matches = this.engine.cities.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.country.toLowerCase().includes(query.toLowerCase())
      );

      searchResults.innerHTML = "";
      if (matches.length > 0) {
        matches.forEach(m => {
          const item = document.createElement("div");
          item.className = "search-result-item";
          item.innerHTML = `
            <div class="search-item-info">
              <span class="search-item-city">${m.name}</span>
              <span class="search-item-region">${m.country} • ${m.zone}</span>
            </div>
            <span class="search-item-temp">${m.lat >= 0 ? "NH" : "SH"}</span>
          `;
          item.addEventListener("click", () => {
            this.loadCity(m.name);
            searchInput.value = "";
            clearBtn.classList.remove("visible");
            searchResults.classList.remove("active");
          });
          searchResults.appendChild(item);
        });
      } else {
        // Offer custom simulated location synthesis
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.innerHTML = `
          <div class="search-item-info">
            <span class="search-item-city">Simulate "${query}"</span>
            <span class="search-item-region">Synthesize realistic micro-climate</span>
          </div>
          <span class="search-item-temp">Generate</span>
        `;
        item.addEventListener("click", () => {
          this.loadCity(query);
          searchInput.value = "";
          clearBtn.classList.remove("visible");
          searchResults.classList.remove("active");
        });
        searchResults.appendChild(item);
      }

      searchResults.classList.add("active");
    });

    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          this.loadCity(query);
          searchInput.value = "";
          clearBtn.classList.remove("visible");
          searchResults.classList.remove("active");
        }
      }
    });

    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearBtn.classList.remove("visible");
      searchResults.classList.remove("active");
      searchInput.focus();
    });

    document.addEventListener("click", e => {
      if (!e.target.closest(".search-container")) {
        searchResults.classList.remove("active");
      }
    });

    // 2. Unit Toggles (°C / °F)
    const btnC = document.getElementById("btn-unit-c");
    const btnF = document.getElementById("btn-unit-f");

    btnC.addEventListener("click", () => {
      this.unit = "C";
      btnC.classList.add("active");
      btnF.classList.remove("active");
      this.renderAll();
    });

    btnF.addEventListener("click", () => {
      this.unit = "F";
      btnF.classList.add("active");
      btnC.classList.remove("active");
      this.renderAll();
    });

    // 3. Quick Cities Strip Chips
    document.querySelectorAll(".city-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const city = chip.getAttribute("data-city");
        if (city) this.loadCity(city);
      });
    });

    // 4. Random Telemetry Trigger button
    document.getElementById("btn-re-simulate").addEventListener("click", () => {
      this.engine.overrides.forcedCondition = null;
      this.engine.overrides.timeHourOffset = null;
      this.engine.overrides.tempDelta = 0;
      this.resetSimulatorControlsUI();
      this.loadCity(this.currentCityName);
    });

    // 5. Radar Layer Toggles
    document.querySelectorAll(".layer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".layer-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const layer = btn.getAttribute("data-layer");
        this.radarSim.setLayer(layer);
      });
    });

    // 6. Simulator Studio Interactive Controls
    const timeSlider = document.getElementById("sim-time-slider");
    const timeValLabel = document.getElementById("sim-time-val");
    timeSlider.addEventListener("input", e => {
      const val = parseInt(e.target.value);
      if (val === -1) {
        this.engine.overrides.timeHourOffset = null;
        timeValLabel.textContent = "Auto (Real Time)";
      } else {
        this.engine.overrides.timeHourOffset = val;
        const h12 = val % 12 || 12;
        const ampm = val >= 12 ? "PM" : "AM";
        timeValLabel.textContent = `${h12}:00 ${ampm}`;
      }
      this.loadCity(this.currentCityName);
    });

    const tempSlider = document.getElementById("sim-temp-slider");
    const tempValLabel = document.getElementById("sim-temp-val");
    tempSlider.addEventListener("input", e => {
      const delta = parseInt(e.target.value);
      this.engine.overrides.tempDelta = delta;
      tempValLabel.textContent = `${delta > 0 ? "+" : ""}${delta}°C`;
      this.loadCity(this.currentCityName);
    });

    document.querySelectorAll(".sim-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const cond = btn.getAttribute("data-cond");
        this.engine.overrides.forcedCondition = cond === "auto" ? null : cond;
        this.loadCity(this.currentCityName);
      });
    });

    const resetSimBtn = document.getElementById("btn-reset-sim");
    if (resetSimBtn) {
      resetSimBtn.addEventListener("click", () => {
        this.engine.overrides.forcedCondition = null;
        this.engine.overrides.timeHourOffset = null;
        this.engine.overrides.tempDelta = 0;
        this.resetSimulatorControlsUI();
        this.loadCity(this.currentCityName);
      });
    }

    // Dismiss toast
    const toastClose = document.getElementById("toast-close");
    if (toastClose) {
      toastClose.addEventListener("click", () => {
        document.getElementById("weather-toast").classList.remove("show");
      });
    }
  }

  resetSimulatorControlsUI() {
    const timeSlider = document.getElementById("sim-time-slider");
    if (timeSlider) timeSlider.value = -1;
    const timeValLabel = document.getElementById("sim-time-val");
    if (timeValLabel) timeValLabel.textContent = "Auto (Real Time)";

    const tempSlider = document.getElementById("sim-temp-slider");
    if (tempSlider) tempSlider.value = 0;
    const tempValLabel = document.getElementById("sim-temp-val");
    if (tempValLabel) tempValLabel.textContent = "0°C";
  }
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new WeatherApp();
});
