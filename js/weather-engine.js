/**
 * AETHER WEATHER - SIMULATED BACKEND ENGINE
 * Generates realistic atmospheric telemetry and forecasts
 * using meteorological principles, diurnal curves, and climate baselines.
 */

class WeatherEngine {
  constructor() {
    // Curated catalog of global cities with realistic geographic & climatological seeds
    this.cities = [
      { name: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503, tz: 9, zone: "Humid Subtropical", baseTemps: [5, 6, 9, 14, 19, 22, 26, 28, 24, 18, 12, 7] },
      { name: "New York", country: "United States", lat: 40.7128, lon: -74.0060, tz: -4, zone: "Humid Continental", baseTemps: [0, 2, 6, 12, 17, 22, 25, 24, 20, 14, 8, 3] },
      { name: "London", country: "United Kingdom", lat: 51.5074, lon: -0.1278, tz: 1, zone: "Oceanic", baseTemps: [5, 6, 8, 11, 14, 17, 19, 19, 16, 12, 8, 6] },
      { name: "Paris", country: "France", lat: 48.8566, lon: 2.3522, tz: 2, zone: "Oceanic", baseTemps: [5, 6, 9, 12, 16, 19, 21, 21, 17, 13, 8, 5] },
      { name: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093, tz: 11, zone: "Temperate Marine", baseTemps: [23, 23, 22, 19, 16, 14, 13, 14, 16, 18, 20, 22] },
      { name: "Reykjavik", country: "Iceland", lat: 64.1466, lon: -21.9426, tz: 0, zone: "Subpolar Oceanic", baseTemps: [0, 0, 1, 3, 6, 9, 11, 11, 8, 5, 2, 0] },
      { name: "Cairo", country: "Egypt", lat: 30.0444, lon: 31.2357, tz: 3, zone: "Arid Desert", baseTemps: [14, 15, 18, 22, 26, 29, 30, 30, 27, 24, 20, 15] },
      { name: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198, tz: 8, zone: "Tropical Rainforest", baseTemps: [27, 27, 28, 28, 28, 28, 28, 28, 27, 27, 27, 26] },
      { name: "San Francisco", country: "United States", lat: 37.7749, lon: -122.4194, tz: -7, zone: "Mediterranean Marine", baseTemps: [10, 12, 13, 14, 15, 16, 16, 17, 18, 17, 14, 11] },
      { name: "Zurich", country: "Switzerland", lat: 47.3769, lon: 8.5417, tz: 2, zone: "Central European Alpine", baseTemps: [1, 2, 6, 10, 14, 18, 20, 19, 15, 10, 5, 2] },
      { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lon: -43.1729, tz: -3, zone: "Tropical Wet", baseTemps: [27, 27, 26, 25, 23, 22, 22, 22, 23, 24, 25, 26] },
      { name: "Dubai", country: "United Arab Emirates", lat: 25.2048, lon: 55.2708, tz: 4, zone: "Subtropical Desert", baseTemps: [19, 21, 24, 28, 32, 34, 36, 36, 33, 29, 25, 21] }
    ];

    // Simulator override state
    this.overrides = {
      forcedCondition: null, // null = realistic auto, or 'Sunny', 'Cloudy', 'Rainy', 'Thunderstorm', 'Snowy', 'Foggy'
      timeHourOffset: null,   // null = current local time, or 0-23
      tempDelta: 0           // user slider adjustment
    };
  }

  /**
   * Deterministic string hash for consistent procedural synthesis
   */
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Seeded pseudo-random float [0, 1)
   */
  _seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Find or procedurally generate city profile
   */
  getCityProfile(query) {
    const clean = query.trim().toLowerCase();
    const found = this.cities.find(c => c.name.toLowerCase() === clean);
    if (found) return found;

    // Procedural generation for custom city names
    const hash = this._hashString(clean);
    const lat = ((hash % 12000) / 100) - 50; // -50 to 70 deg
    const lon = ((hash % 36000) / 100) - 180;
    const tz = Math.round(lon / 15);
    
    // Base temperature curve based on latitude
    const equatorDist = Math.abs(lat) / 90; // 0 at equator, 1 at poles
    const meanAnnual = Math.round(30 - equatorDist * 40); // 30°C equator down to -10°C poles
    const seasonAmp = Math.round(equatorDist * 16); // seasonal swing
    
    const baseTemps = [];
    for (let m = 0; m < 12; m++) {
      // Northern Hemisphere peak July (m=6), Southern peak January (m=0)
      const phase = lat >= 0 ? (m - 6) : m;
      const angle = (phase / 12) * 2 * Math.PI;
      const t = Math.round(meanAnnual - Math.cos(angle) * seasonAmp);
      baseTemps.push(t);
    }

    const zones = ["Temperate Maritime", "Continental", "Semi-Arid", "Subtropical", "Subalpine", "Maritime"];
    const zone = zones[hash % zones.length];

    return {
      name: query.charAt(0).toUpperCase() + query.slice(1),
      country: "Global Station",
      lat: parseFloat(lat.toFixed(2)),
      lon: parseFloat(lon.toFixed(2)),
      tz: Math.min(14, Math.max(-12, tz)),
      zone,
      baseTemps
    };
  }

  /**
   * Calculates realistic solar sunrise and sunset in local hours
   */
  calculateSunCycle(lat, dayOfYear) {
    // Solar declination approximation
    const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
    const latRad = (lat * Math.PI) / 180;
    const decRad = (declination * Math.PI) / 180;

    let cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
    cosHourAngle = Math.max(-1, Math.min(1, cosHourAngle)); // Clamp for polar days/nights

    const hourAngle = (Math.acos(cosHourAngle) * 180) / Math.PI;
    const halfDayHours = hourAngle / 15;

    const solarNoon = 12.0;
    const sunrise = Math.max(4.0, Math.min(9.0, solarNoon - halfDayHours));
    const sunset = Math.max(15.0, Math.min(22.0, solarNoon + halfDayHours));

    return {
      sunriseHour: sunrise,
      sunsetHour: sunset,
      sunriseStr: this._formatDecimalTime(sunrise),
      sunsetStr: this._formatDecimalTime(sunset)
    };
  }

  _formatDecimalTime(dec) {
    const hours = Math.floor(dec);
    const minutes = Math.floor((dec - hours) * 60);
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    const mStr = minutes.toString().padStart(2, "0");
    return `${h12}:${mStr} ${ampm}`;
  }

  /**
   * Meteorological Diurnal Temperature Curve
   * Min temp occurs right around sunrise (~6 AM)
   * Max temp occurs around 14:30 (2:30 PM) due to thermal inertia
   */
  _diurnalCurve(hour) {
    // Map hour 0..24 onto sinusoidal swing [-1, 1]
    const lagHour = (hour - 8 + 24) % 24;
    return Math.sin(((lagHour - 6) / 24) * 2 * Math.PI);
  }

  /**
   * Computes comprehensive weather packet for a given moment
   */
  computeWeather(cityProfile, customDate = new Date()) {
    const now = new Date(customDate);
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    let localHour = (utcHours + cityProfile.tz + 24) % 24;

    if (this.overrides.timeHourOffset !== null) {
      localHour = this.overrides.timeHourOffset;
    }

    const month = now.getUTCMonth(); // 0 - 11
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const sunCycle = this.calculateSunCycle(cityProfile.lat, dayOfYear);
    const isDay = localHour >= sunCycle.sunriseHour && localHour <= sunCycle.sunsetHour;

    // Seed combining city coords + date for temporal continuity
    const dateSeed = cityProfile.lat * 100 + cityProfile.lon + (now.getFullYear() * 365 + dayOfYear);
    const dayNoise = this._seededRandom(dateSeed) * 6 - 3; // +/- 3°C synoptic fluctuation
    const monthlyBase = cityProfile.baseTemps[month];

    // Diurnal amplitude depends on climate zone (arid = 12°C swing, oceanic = 6°C swing)
    let diurnalAmp = 4;
    if (cityProfile.zone.includes("Desert") || cityProfile.zone.includes("Arid")) diurnalAmp = 7.5;
    if (cityProfile.zone.includes("Oceanic") || cityProfile.zone.includes("Maritime")) diurnalAmp = 3.0;

    let tempCelsius = monthlyBase + (this._diurnalCurve(localHour) * diurnalAmp) + dayNoise + this.overrides.tempDelta;
    tempCelsius = Math.round(tempCelsius * 10) / 10;

    // Condition Generation
    let condition = this._determineCondition(cityProfile, tempCelsius, dateSeed, localHour, isDay);
    if (this.overrides.forcedCondition) {
      condition = this._applyForcedCondition(this.overrides.forcedCondition, isDay, tempCelsius);
    }

    // Relative Humidity & Dew Point
    let humidity = Math.round(this._calculateHumidity(condition.type, cityProfile.zone, localHour, dateSeed));
    
    // Magnus Dew Point formula
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * tempCelsius) / (b + tempCelsius)) + Math.log(humidity / 100);
    const dewPoint = Math.round(((b * alpha) / (a - alpha)) * 10) / 10;

    // Feels Like calculation
    const feelsLike = this._calculateFeelsLike(tempCelsius, humidity, condition.windSpeed);

    // Barometric pressure
    let pressure = Math.round(1013.25 + condition.pressureDelta + Math.sin(localHour / 3) * 1.5);

    // UV Index (0 at night, peak around noon, reduced by clouds/rain)
    let uvIndex = 0;
    if (isDay) {
      const solarDist = Math.abs(localHour - 12);
      const rawUV = Math.max(0, 10 - solarDist * 2.2);
      const cloudFilter = condition.cloudCoverage > 0.7 ? 0.35 : (condition.cloudCoverage > 0.3 ? 0.7 : 1.0);
      uvIndex = Math.min(11, Math.max(0, Math.round(rawUV * cloudFilter * 10) / 10));
    }

    // Air Quality Index (AQI)
    const aqi = this._calculateAQI(cityProfile, condition.windSpeed, humidity, dateSeed);

    // High & Low for today
    const highTemp = Math.round((monthlyBase + diurnalAmp + dayNoise + this.overrides.tempDelta + 1) * 10) / 10;
    const lowTemp = Math.round((monthlyBase - diurnalAmp + dayNoise + this.overrides.tempDelta - 1) * 10) / 10;

    // Generate 24-Hour Forecast
    const hourlyForecast = this._generateHourly(cityProfile, now, localHour, monthlyBase, diurnalAmp, dayNoise);

    // Generate 7-Day Forecast
    const dailyForecast = this._generateDaily(cityProfile, now, monthlyBase, diurnalAmp);

    return {
      city: cityProfile.name,
      country: cityProfile.country,
      climateZone: cityProfile.zone,
      coordinates: `${Math.abs(cityProfile.lat).toFixed(1)}°${cityProfile.lat >= 0 ? "N" : "S"}, ${Math.abs(cityProfile.lon).toFixed(1)}°${cityProfile.lon >= 0 ? "E" : "W"}`,
      localHour,
      localTimeFormatted: this._formatDecimalTime(localHour),
      isDay,
      temp: tempCelsius,
      highTemp: Math.max(tempCelsius, highTemp),
      lowTemp: Math.min(tempCelsius, lowTemp),
      feelsLike,
      dewPoint,
      humidity,
      pressure,
      pressureTrend: condition.pressureDelta < -5 ? "Falling rapidly" : (condition.pressureDelta > 4 ? "Rising" : "Steady"),
      uvIndex,
      uvCategory: this._getUVCategory(uvIndex),
      visibility: condition.visibilityKm,
      windSpeed: condition.windSpeed,
      windGust: Math.round(condition.windSpeed * 1.4 + 4),
      windDirection: condition.windDir,
      windBearing: condition.windBearing,
      aqi: aqi.val,
      aqiLabel: aqi.label,
      aqiClass: aqi.cls,
      aqiPollutants: aqi.pollutants,
      sunCycle,
      condition: condition.label,
      conditionType: condition.type, // 'sunny', 'clear-night', 'cloudy', 'rainy', 'thunderstorm', 'snowy'
      summary: condition.summary,
      iconSvg: condition.iconSvg,
      hourlyForecast,
      dailyForecast
    };
  }

  _determineCondition(city, temp, dateSeed, hour, isDay) {
    const r1 = this._seededRandom(dateSeed + 1);
    const r2 = this._seededRandom(dateSeed + 2);

    let type = "sunny";
    let label = isDay ? "Sunny" : "Clear Night";
    let cloudCoverage = 0.1;
    let visibilityKm = 10;
    let windSpeed = Math.round(8 + r1 * 14);
    let pressureDelta = Math.round(r2 * 10 - 5);
    let summary = "Optimal atmospheric visibility and calm conditions.";

    // Probability shifts by climate zone
    const isArid = city.zone.includes("Desert") || city.zone.includes("Arid");
    const isRainProne = city.zone.includes("Oceanic") || city.zone.includes("Tropical") || city.zone.includes("Subtropical");
    const isCold = temp <= 1.0;

    // Arid climates rarely rain (4% chance); rain-prone regions rain more frequently (35% chance)
    const precipThreshold = isArid ? 0.96 : (isRainProne ? 0.65 : 0.78);

    if (r1 > precipThreshold) {
      // Precipitation event
      if (isCold) {
        type = "snowy";
        label = "Snow Flurries";
        summary = "Cold arctic front with light drifting snowfall.";
        cloudCoverage = 0.95;
        visibilityKm = 5.2;
        pressureDelta = -8;
      } else if (r2 > 0.65 && (temp > 18 || city.zone.includes("Tropical"))) {
        type = "thunderstorm";
        label = "Severe Thunderstorm";
        summary = "Active convective cell with lightning strikes and heavy downpours.";
        cloudCoverage = 1.0;
        visibilityKm = 3.5;
        windSpeed = Math.round(26 + r1 * 20);
        pressureDelta = -16;
      } else {
        type = "rainy";
        label = r2 > 0.4 ? "Passing Rain Showers" : "Continuous Light Rain";
        summary = "Moist low-pressure front carrying intermittent rain bands.";
        cloudCoverage = 0.85;
        visibilityKm = 6.8;
        pressureDelta = -7;
      }
    } else if (r1 > (isArid ? 0.85 : 0.42)) {
      type = "cloudy";
      label = r2 > 0.5 ? "Scattered Clouds" : "Overcast Skies";
      summary = "High altitude stratocumulus cloud deck filtering direct sunlight.";
      cloudCoverage = 0.65;
      visibilityKm = 9.5;
      pressureDelta = 0;
    } else {
      type = isDay ? "sunny" : "clear-night";
      label = isDay ? (temp > 28 ? "Hot & Radiant" : "Sunny & Clear") : "Clear Night Sky";
      summary = isDay ? "High barometric pressure keeping skies crisp and radiant." : "Crisp night with clear celestial visibility.";
      cloudCoverage = 0.1;
      visibilityKm = 10;
      pressureDelta = 8;
    }

    // Direction calculation
    const bearings = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const bearingIdx = Math.floor(this._seededRandom(dateSeed + 5) * bearings.length);
    const windBearing = bearingIdx * 22.5;

    return {
      type,
      label,
      summary,
      cloudCoverage,
      visibilityKm,
      windSpeed,
      windDir: bearings[bearingIdx],
      windBearing,
      pressureDelta,
      iconSvg: this._getIconSvg(type, isDay)
    };
  }

  _applyForcedCondition(forced, isDay, temp) {
    const f = forced.toLowerCase();
    let type = "sunny";
    let label = "Sunny";
    let summary = "Simulation active.";
    let cloudCoverage = 0.2;
    let visibilityKm = 10;
    let windSpeed = 12;
    let pressureDelta = 5;

    if (f.includes("rain")) {
      type = "rainy";
      label = "Heavy Rain Showers";
      summary = "Sustained simulated precipitation cell.";
      cloudCoverage = 0.9;
      visibilityKm = 6.2;
      windSpeed = 22;
      pressureDelta = -10;
    } else if (f.includes("thunder") || f.includes("storm")) {
      type = "thunderstorm";
      label = "Severe Thunderstorm";
      summary = "Simulated convective storm with lightning discharges.";
      cloudCoverage = 1.0;
      visibilityKm = 4.0;
      windSpeed = 38;
      pressureDelta = -18;
    } else if (f.includes("snow")) {
      type = "snowy";
      label = "Powder Snowfall";
      summary = "Simulated winter vortex with crisp ice crystals.";
      cloudCoverage = 0.95;
      visibilityKm = 5.0;
      windSpeed = 15;
      pressureDelta = -6;
    } else if (f.includes("cloud")) {
      type = "cloudy";
      label = "Broken Clouds";
      summary = "Simulated atmospheric cloud formation.";
      cloudCoverage = 0.7;
      visibilityKm = 9.0;
      pressureDelta = 1;
    } else {
      type = isDay ? "sunny" : "clear-night";
      label = isDay ? "Sunny & Clear" : "Clear Night";
      summary = "Simulated high pressure ridge with unobstructed skies.";
    }

    return {
      type,
      label,
      summary,
      cloudCoverage,
      visibilityKm,
      windSpeed,
      windDir: "WNW",
      windBearing: 292.5,
      pressureDelta,
      iconSvg: this._getIconSvg(type, isDay)
    };
  }

  _calculateHumidity(conditionType, zone, hour, seed) {
    let base = 60;
    if (zone.includes("Desert") || zone.includes("Arid")) base = 25;
    if (zone.includes("Tropical") || zone.includes("Rainforest")) base = 82;
    if (conditionType === "rainy" || conditionType === "thunderstorm") return 85 + this._seededRandom(seed) * 12;
    if (conditionType === "snowy") return 75 + this._seededRandom(seed) * 15;
    
    // Diurnal humidity curve: peak at night/morning when cool, lower in afternoon
    const diurnalHumidity = (Math.cos(((hour - 4) / 24) * 2 * Math.PI) * 14);
    return Math.min(98, Math.max(15, base + diurnalHumidity));
  }

  _calculateFeelsLike(t, rh, windKmH) {
    // Wind chill if cold & windy
    if (t <= 10 && windKmH > 4.8) {
      const v = Math.pow(windKmH, 0.16);
      const chill = 13.12 + 0.6215 * t - 11.37 * v + 0.3965 * t * v;
      return Math.round(chill * 10) / 10;
    }
    // Australian Apparent Temp / Heat index if warmer
    if (t >= 20) {
      const e = (rh / 100) * 6.105 * Math.exp((17.27 * t) / (237.7 + t));
      const app = t + 0.33 * e - 0.70 * (windKmH / 3.6) - 4.0;
      return Math.round(app * 10) / 10;
    }
    return t;
  }

  _calculateAQI(city, windSpeed, humidity, seed) {
    let baseAQI = 38; // Clean baseline
    if (["Tokyo", "New York", "Paris", "Cairo", "Dubai"].includes(city.name)) baseAQI = 65;
    if (city.name === "Reykjavik" || city.name === "Zurich") baseAQI = 18;

    // Wind dispersion reduces AQI; stagnant wind increases it
    const dispersion = (windSpeed - 12) * -1.2;
    let val = Math.round(baseAQI + dispersion + (this._seededRandom(seed + 8) * 18 - 9));
    val = Math.max(12, Math.min(220, val));

    let label = "Good";
    let cls = "good";
    if (val > 50 && val <= 100) { label = "Moderate"; cls = "moderate"; }
    else if (val > 100) { label = "Unhealthy for Sensitive"; cls = "unhealthy"; }

    return {
      val,
      label,
      cls,
      pollutants: {
        pm25: (val * 0.28).toFixed(1) + " µg/m³",
        pm10: (val * 0.45).toFixed(1) + " µg/m³",
        o3: (val * 0.6).toFixed(1) + " ppb",
        no2: (val * 0.32).toFixed(1) + " ppb"
      }
    };
  }

  _getUVCategory(uv) {
    if (uv <= 2) return "Low Risk (No protection needed)";
    if (uv <= 5) return "Moderate (Wear SPF 30 & hat)";
    if (uv <= 7) return "High (Protection required)";
    if (uv <= 10) return "Very High (Seek midday shade)";
    return "Extreme (Avoid direct sun)";
  }

  _generateHourly(city, now, currentLocalHour, monthlyBase, diurnalAmp, dayNoise) {
    const list = [];
    const currentBaseHour = Math.floor(currentLocalHour);

    for (let i = 0; i < 24; i++) {
      const h = (currentBaseHour + i) % 24;
      const isDay = h >= 6 && h <= 18;
      const temp = Math.round((monthlyBase + (this._diurnalCurve(h) * diurnalAmp) + dayNoise + this.overrides.tempDelta) * 10) / 10;
      
      const seed = city.lat + (now.getDate() * 24 + h);
      const rand = this._seededRandom(seed);
      let condType = "sunny";
      let pop = Math.round(rand * 30); // Probability of precipitation

      if (temp <= 0.5 && rand > 0.4) {
        condType = "snowy";
        pop = Math.round(60 + rand * 35);
      } else if (rand > 0.75) {
        condType = rand > 0.9 ? "thunderstorm" : "rainy";
        pop = Math.round(70 + rand * 25);
      } else if (rand > 0.45) {
        condType = "cloudy";
        pop = Math.round(20 + rand * 25);
      } else {
        condType = isDay ? "sunny" : "clear-night";
      }

      const h12 = h % 12 || 12;
      const ampm = h >= 12 ? "PM" : "AM";
      const timeLabel = i === 0 ? "Now" : `${h12} ${ampm}`;

      list.push({
        hour: h,
        label: timeLabel,
        temp,
        condType,
        pop,
        iconSvg: this._getIconSvg(condType, isDay)
      });
    }
    return list;
  }

  _generateDaily(city, now, monthlyBase, diurnalAmp) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const list = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);

      const dayName = i === 0 ? "Today" : days[d.getDay()];
      const dateStr = `${months[d.getMonth()]} ${d.getDate()}`;
      const daySeed = city.lat * 50 + (d.getFullYear() * 365 + d.getDate() * 12);
      const dayFluct = this._seededRandom(daySeed) * 5 - 2.5;

      const max = Math.round(monthlyBase + diurnalAmp + dayFluct + this.overrides.tempDelta);
      const min = Math.round(monthlyBase - diurnalAmp + dayFluct + this.overrides.tempDelta);

      const r = this._seededRandom(daySeed + 7);
      let condType = "sunny";
      let condLabel = "Sunny";
      let pop = Math.round(r * 25);

      if (max <= 1) {
        condType = "snowy";
        condLabel = "Light Snow";
        pop = 70;
      } else if (r > 0.75) {
        condType = r > 0.9 ? "thunderstorm" : "rainy";
        condLabel = r > 0.9 ? "Thunderstorms" : "Rain Showers";
        pop = 80;
      } else if (r > 0.45) {
        condType = "cloudy";
        condLabel = "Partly Cloudy";
        pop = 35;
      }

      list.push({
        dayName,
        dateStr,
        condType,
        condLabel,
        pop,
        min,
        max,
        iconSvg: this._getIconSvg(condType, true)
      });
    }
    return list;
  }

  _getIconSvg(type, isDay = true) {
    switch (type) {
      case "sunny":
        return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="14" fill="#fbbf24" stroke="#f59e0b" stroke-width="2.5"/>
          <g stroke="#f59e0b" stroke-width="3" stroke-linecap="round">
            <line x1="32" y1="6" x2="32" y2="12"/>
            <line x1="32" y1="52" x2="32" y2="58"/>
            <line x1="6" y1="32" x2="12" y2="32"/>
            <line x1="52" y1="32" x2="58" y2="32"/>
            <line x1="13.6" y1="13.6" x2="17.8" y2="17.8"/>
            <line x1="46.2" y1="46.2" x2="50.4" y2="50.4"/>
            <line x1="13.6" y1="50.4" x2="17.8" y2="46.2"/>
            <line x1="46.2" y1="17.8" x2="50.4" y2="13.6"/>
          </g>
        </svg>`;
      case "clear-night":
        return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M46 36C46 47.0457 37.0457 56 26 56C19.8247 56 14.3414 53.2038 10.7202 48.8142C12.3897 49.2618 14.1504 49.5 15.9669 49.5C28.1189 49.5 37.9669 39.652 37.9669 27.5C37.9669 20.3013 34.5097 13.9103 29.1763 9.87329C40.0617 11.2372 46 20.7302 46 36Z" fill="#93c5fd" stroke="#60a5fa" stroke-width="2.5"/>
          <circle cx="48" cy="18" r="2" fill="#ffffff"/>
          <circle cx="54" cy="28" r="1.5" fill="#ffffff"/>
        </svg>`;
      case "cloudy":
        return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M46 44H20C14.4772 44 10 39.5228 10 34C10 28.7564 14.0436 24.4578 19.1866 24.0384C20.655 17.1585 26.7196 12 34 12C42.4173 12 49.3361 18.5293 49.9572 26.8028C54.4925 27.6745 58 31.6375 58 36.4C58 41.7019 53.7019 46 48.4 46H46V44Z" fill="#94a3b8" stroke="#cbd5e1" stroke-width="2.5"/>
        </svg>`;
      case "rainy":
        return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M44 36H20C15.5817 36 12 32.4183 12 28C12 23.8051 15.2349 20.3662 19.3493 20.0291C20.524 14.5268 25.3757 10.4 31.2 10.4C37.9379 10.4 43.4729 15.6234 43.9658 22.2422C47.594 22.9396 50.4 26.11 50.4 29.92C50.4 34.1615 46.9615 37.6 42.72 37.6H44V36Z" fill="#64748b" stroke="#94a3b8" stroke-width="2"/>
          <g stroke="#38bdf8" stroke-width="3" stroke-linecap="round">
            <line x1="22" y1="42" x2="18" y2="52"/>
            <line x1="32" y1="42" x2="28" y2="52"/>
            <line x1="42" y1="42" x2="38" y2="52"/>
          </g>
        </svg>`;
      case "thunderstorm":
        return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M44 34H20C15.5817 34 12 30.4183 12 26C12 21.8051 15.2349 18.3662 19.3493 18.0291C20.524 12.5268 25.3757 8.4 31.2 8.4C37.9379 8.4 43.4729 13.6234 43.9658 20.2422C47.594 20.9396 50.4 24.11 50.4 27.92C50.4 32.1615 46.9615 35.6 42.72 35.6H44V34Z" fill="#475569" stroke="#64748b" stroke-width="2"/>
          <polygon points="32,32 23,46 31,46 27,58 41,42 33,42" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>`;
      case "snowy":
        return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M44 36H20C15.5817 36 12 32.4183 12 28C12 23.8051 15.2349 20.3662 19.3493 20.0291C20.524 14.5268 25.3757 10.4 31.2 10.4C37.9379 10.4 43.4729 15.6234 43.9658 22.2422C47.594 22.9396 50.4 26.11 50.4 29.92C50.4 34.1615 46.9615 37.6 42.72 37.6H44V36Z" fill="#94a3b8" stroke="#cbd5e1" stroke-width="2"/>
          <circle cx="22" cy="46" r="2.5" fill="#bae6fd"/>
          <circle cx="32" cy="50" r="2.5" fill="#bae6fd"/>
          <circle cx="42" cy="46" r="2.5" fill="#bae6fd"/>
          <circle cx="27" cy="56" r="2" fill="#bae6fd"/>
          <circle cx="37" cy="56" r="2" fill="#bae6fd"/>
        </svg>`;
      default:
        return `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="16" fill="#38bdf8"/></svg>`;
    }
  }
}

// Export singleton to window
window.WeatherEngine = new WeatherEngine();
