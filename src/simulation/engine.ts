import type {
  CityEvent,
  CityEventType,
  CityMetrics,
  DistrictState,
  EventCategory,
  EventSeverity,
  ResolutionStrategy,
  SimulationConfig,
  SimulationEdit,
  SimulationFrame,
  WeatherCondition,
} from "./types";

const EVENT_INFO: Record<CityEventType, { title: string; category: EventCategory; severity: EventSeverity; impact: number }> = {
  "storm-front": { title: "Severe storm front", category: "weather", severity: 4, impact: 0.72 },
  "flash-flood": { title: "Flash flood detected", category: "weather", severity: 5, impact: 0.9 },
  "building-fire": { title: "High-rise fire", category: "fire", severity: 4, impact: 0.78 },
  "industrial-fire": { title: "Industrial fire", category: "fire", severity: 5, impact: 0.92 },
  "traffic-collision": { title: "Multi-vehicle collision", category: "transport", severity: 3, impact: 0.52 },
  "transit-delay": { title: "Transit service delay", category: "transport", severity: 2, impact: 0.34 },
  "road-closure": { title: "Critical road closure", category: "transport", severity: 3, impact: 0.48 },
  "grid-overload": { title: "Grid load critical", category: "power", severity: 4, impact: 0.7 },
  "power-outage": { title: "Localized power outage", category: "power", severity: 4, impact: 0.76 },
  "communications-failure": { title: "Communications node failure", category: "communications", severity: 4, impact: 0.7 },
  "cyber-intrusion": { title: "Network intrusion detected", category: "security", severity: 4, impact: 0.66 },
  "air-pollution": { title: "Air quality alert", category: "environment", severity: 3, impact: 0.5 },
  "water-contamination": { title: "Water quality anomaly", category: "water", severity: 5, impact: 0.86 },
  "water-main-break": { title: "Water main rupture", category: "water", severity: 4, impact: 0.68 },
  "large-gathering": { title: "Large public gathering", category: "public", severity: 2, impact: 0.36 },
  "hospital-overload": { title: "Hospital capacity overload", category: "medical", severity: 4, impact: 0.72 },
  "ambulance-surge": { title: "Emergency response surge", category: "medical", severity: 3, impact: 0.5 },
  "drone-malfunction": { title: "Autonomous drone anomaly", category: "security", severity: 3, impact: 0.46 },
  "security-breach": { title: "Infrastructure security breach", category: "security", severity: 4, impact: 0.7 },
  "heat-emergency": { title: "Extreme heat emergency", category: "weather", severity: 4, impact: 0.74 },
  "snow-disruption": { title: "Snow mobility disruption", category: "weather", severity: 3, impact: 0.56 },
  "bridge-inspection": { title: "Emergency bridge inspection", category: "transport", severity: 2, impact: 0.32 },
  "energy-shortfall": { title: "Energy reserve shortfall", category: "power", severity: 4, impact: 0.69 },
  "sensor-anomaly": { title: "Sensor network anomaly", category: "communications", severity: 2, impact: 0.3 },
};

const EVENT_TYPES = Object.keys(EVENT_INFO) as CityEventType[];
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

class SeededRandom {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 4294967296;
  }
  pick<T>(items: readonly T[]): T {
    const item = items[Math.floor(this.next() * items.length)];
    if (item === undefined) throw new Error("Cannot pick from empty collection");
    return item;
  }
}

export class SimulationEngine {
  private readonly rng: SeededRandom;
  private readonly config: SimulationConfig;
  private tickCount = 0;
  private timeMs: number;
  private weather: WeatherCondition = "clear";
  private events: CityEvent[] = [];
  private eventSequence = 0;
  private energyBoost = 0;
  private hospitalBoost = 0;
  private communicationsBoost = 0;
  private roadPenalty = 0;
  private buildingLoad = 0;
  private districts: DistrictState[];
  private metrics: CityMetrics;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.timeMs = config.startTimeMs;
    this.rng = new SeededRandom(config.seed);
    this.districts = config.districtIds.map((id, index) => ({
      id,
      name: ["Atlas", "Meridian", "Harbor", "Helix", "Civic", "Nova", "Foundry", "Astra"][index] ?? `Sector ${index + 1}`,
      population: 42000 + Math.floor(this.rng.next() * 118000),
      healthIndex: 82 + this.rng.next() * 12,
      powerLoad: 48 + this.rng.next() * 20,
      congestion: 22 + this.rng.next() * 28,
      aqi: 36 + this.rng.next() * 28,
    }));
    this.metrics = this.computeMetrics();
  }

  setWeather(weather: WeatherCondition): void { this.weather = weather; }

  tick(stepMs = 1000): SimulationFrame {
    this.tickCount += 1;
    this.timeMs += stepMs;
    this.decayResolvedEvents();
    this.maybeCreateEvent();
    this.metrics = this.computeMetrics();
    this.districts = this.computeDistricts();
    return this.snapshot();
  }

  createEvent(type: CityEventType, districtId?: string, buildingId?: string): CityEvent {
    const info = EVENT_INFO[type];
    const district = districtId ?? this.rng.pick(this.config.districtIds);
    this.eventSequence += 1;
    const event: CityEvent = {
      id: `evt-${this.eventSequence.toString().padStart(4, "0")}`,
      type,
      title: info.title,
      description: `${info.title} in ${district}. Cross-system consequences are being propagated by the simulation engine.`,
      category: info.category,
      severity: info.severity,
      districtId: district,
      buildingId,
      createdAtMs: this.timeMs,
      status: "active",
      impact: info.impact,
    };
    this.events = [event, ...this.events].slice(0, 120);
    return event;
  }

  resolveEvent(eventId: string, strategy: ResolutionStrategy): void {
    this.events = this.events.map((event) => event.id === eventId && event.status === "active"
      ? { ...event, status: "resolved", resolvedAtMs: this.timeMs, strategy, impact: event.impact * 0.28 }
      : event);
  }

  applyEdit(edit: SimulationEdit): void {
    if (edit.kind === "add-energy-node") this.energyBoost += 4;
    if (edit.kind === "add-hospital") this.hospitalBoost += 5;
    if (edit.kind === "add-communications-tower") this.communicationsBoost += 4;
    if (edit.kind === "road-status") this.roadPenalty += edit.closed ? 10 : -10;
    if (edit.kind === "building-change") this.buildingLoad += edit.delta * 0.8;
    this.roadPenalty = clamp(this.roadPenalty, 0, 35);
    this.buildingLoad = clamp(this.buildingLoad, -8, 25);
  }

  snapshot(): SimulationFrame {
    return {
      tick: this.tickCount,
      simulationTimeMs: this.timeMs,
      weather: this.weather,
      metrics: structuredClone(this.metrics),
      districts: structuredClone(this.districts),
      events: structuredClone(this.events),
      eventSequence: this.eventSequence,
    };
  }

  private maybeCreateEvent(): void {
    const chance = this.weather === "storm" ? 0.035 : this.weather === "heatwave" ? 0.025 : 0.012;
    if (this.rng.next() > chance || this.events.filter((event) => event.status === "active").length >= 9) return;
    let pool = EVENT_TYPES;
    if (this.weather === "storm") pool = ["storm-front", "flash-flood", "road-closure", "power-outage", "communications-failure"];
    if (this.weather === "heatwave") pool = ["heat-emergency", "grid-overload", "hospital-overload", "energy-shortfall"];
    if (this.weather === "snow") pool = ["snow-disruption", "road-closure", "transit-delay", "power-outage"];
    this.createEvent(this.rng.pick(pool));
  }

  private decayResolvedEvents(): void {
    this.events = this.events.filter((event) => event.status === "active" || (event.resolvedAtMs ?? this.timeMs) > this.timeMs - 45 * 60 * 1000);
  }

  private activeImpact(category: EventCategory): number {
    return this.events
      .filter((event) => event.status === "active" && event.category === category)
      .reduce((sum, event) => sum + event.impact * event.severity, 0);
  }

  private computeMetrics(): CityMetrics {
    const hour = new Date(this.timeMs).getUTCHours() + new Date(this.timeMs).getUTCMinutes() / 60;
    const rush = Math.exp(-Math.pow(hour - 8.2, 2) / 5) + Math.exp(-Math.pow(hour - 17.5, 2) / 6);
    const dailyHeat = Math.sin(((hour - 6) / 24) * Math.PI * 2) * 6;
    const weatherTraffic = this.weather === "storm" ? 25 : this.weather === "rain" ? 13 : this.weather === "snow" ? 22 : this.weather === "fog" ? 8 : 0;
    const weatherTemp = this.weather === "heatwave" ? 13 : this.weather === "snow" ? -18 : 0;
    const temperature = 21 + dailyHeat + weatherTemp;
    const powerEvents = this.activeImpact("power");
    const trafficEvents = this.activeImpact("transport") + this.activeImpact("public") * 0.6;
    const fireEvents = this.activeImpact("fire");
    const medicalEvents = this.activeImpact("medical") + fireEvents * 0.7;
    const commsEvents = this.activeImpact("communications") + powerEvents * 0.42 + this.activeImpact("security") * 0.35;
    const waterEvents = this.activeImpact("water") + (this.weather === "storm" ? 1.2 : 0);

    const congestion = clamp(24 + rush * 26 + weatherTraffic + trafficEvents * 5.5 + this.roadPenalty, 4, 99);
    const speed = clamp(64 - congestion * 0.48, 8, 68);
    const powerLoad = clamp(49 + rush * 9 + Math.max(0, temperature - 25) * 2.2 + powerEvents * 4.8 + this.buildingLoad - this.energyBoost, 25, 99.5);
    const pollution = clamp(38 + congestion * 0.65 + fireEvents * 11 + (this.weather === "fog" ? 12 : 0) - (this.weather === "rain" ? 8 : 0), 12, 290);
    const commsAvailability = clamp(99.95 - commsEvents * 2.2 - Math.max(0, powerLoad - 90) * 0.14 + this.communicationsBoost, 58, 100);
    const medicalOccupancy = clamp(57 + medicalEvents * 5.8 + Math.max(0, temperature - 31) * 1.4 + this.activeImpact("public") * 2 - this.hospitalBoost, 28, 100);
    const safetyIndex = clamp(96 - this.activeImpact("security") * 5 - fireEvents * 4 - trafficEvents * 1.6, 35, 99);
    const waterReserve = clamp(82 - waterEvents * 3.8 - Math.max(0, temperature - 29) * 0.6, 25, 98);

    return {
      power: { loadPercent: powerLoad, demandMw: 3280 * (powerLoad / 100), reservePercent: clamp(22 - powerLoad * 0.12 + this.energyBoost, 2, 35) },
      traffic: { congestionPercent: congestion, averageSpeedKph: speed, transitReliability: clamp(98 - congestion * 0.27 - trafficEvents * 2, 55, 99) },
      air: { aqi: pollution, particulate: pollution * 0.42 },
      water: { reservePercent: waterReserve, pressurePercent: clamp(96 - waterEvents * 5, 45, 100), qualityIndex: clamp(98 - this.activeImpact("water") * 10, 35, 100) },
      communications: { availabilityPercent: commsAvailability, latencyMs: clamp(8 + (100 - commsAvailability) * 3.2, 6, 180) },
      safety: { safetyIndex, activeIncidents: this.events.filter((event) => event.status === "active").length },
      medical: { occupancyPercent: medicalOccupancy, responseMinutes: clamp(5.4 + congestion * 0.05 + medicalEvents * 0.55, 3, 28) },
      weather: { temperatureC: temperature, precipitationMm: this.weather === "storm" ? 38 : this.weather === "rain" ? 12 : this.weather === "snow" ? 5 : 0, windKph: this.weather === "storm" ? 74 : 14 + this.rng.next() * 8 },
    };
  }

  private computeDistricts(): DistrictState[] {
    return this.districts.map((district, index) => {
      const localEvents = this.events.filter((event) => event.status === "active" && event.districtId === district.id);
      const localImpact = localEvents.reduce((sum, event) => sum + event.impact * event.severity, 0);
      const wave = Math.sin((this.tickCount + index * 17) / 28) * 3;
      return {
        ...district,
        healthIndex: clamp(95 - localImpact * 7 - this.metrics.medical.occupancyPercent * 0.08 + wave, 20, 99),
        powerLoad: clamp(this.metrics.power.loadPercent + localImpact * 4 + wave, 10, 100),
        congestion: clamp(this.metrics.traffic.congestionPercent + localImpact * 6 - wave, 4, 100),
        aqi: clamp(this.metrics.air.aqi + localImpact * 12 + wave * 2, 10, 320),
      };
    });
  }
}
