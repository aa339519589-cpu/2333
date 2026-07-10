export type WeatherCondition = "clear" | "rain" | "storm" | "fog" | "heatwave" | "snow";
export type SimulationSpeed = 0.5 | 1 | 2 | 5 | 10;
export type EventSeverity = 1 | 2 | 3 | 4 | 5;
export type EventStatus = "active" | "resolved";
export type EventCategory =
  | "weather"
  | "fire"
  | "transport"
  | "power"
  | "communications"
  | "environment"
  | "public"
  | "medical"
  | "security"
  | "water";

export type CityEventType =
  | "storm-front"
  | "flash-flood"
  | "building-fire"
  | "industrial-fire"
  | "traffic-collision"
  | "transit-delay"
  | "road-closure"
  | "grid-overload"
  | "power-outage"
  | "communications-failure"
  | "cyber-intrusion"
  | "air-pollution"
  | "water-contamination"
  | "water-main-break"
  | "large-gathering"
  | "hospital-overload"
  | "ambulance-surge"
  | "drone-malfunction"
  | "security-breach"
  | "heat-emergency"
  | "snow-disruption"
  | "bridge-inspection"
  | "energy-shortfall"
  | "sensor-anomaly";

export type ResolutionStrategy = "dispatch" | "repair" | "reroute" | "isolate" | "evacuate";

export interface CityMetrics {
  power: { loadPercent: number; demandMw: number; reservePercent: number };
  traffic: { congestionPercent: number; averageSpeedKph: number; transitReliability: number };
  air: { aqi: number; particulate: number };
  water: { reservePercent: number; pressurePercent: number; qualityIndex: number };
  communications: { availabilityPercent: number; latencyMs: number };
  safety: { safetyIndex: number; activeIncidents: number };
  medical: { occupancyPercent: number; responseMinutes: number };
  weather: { temperatureC: number; precipitationMm: number; windKph: number };
}

export interface DistrictState {
  id: string;
  name: string;
  population: number;
  healthIndex: number;
  powerLoad: number;
  congestion: number;
  aqi: number;
}

export interface CityEvent {
  id: string;
  type: CityEventType;
  title: string;
  description: string;
  category: EventCategory;
  severity: EventSeverity;
  districtId: string;
  buildingId?: string;
  createdAtMs: number;
  resolvedAtMs?: number;
  status: EventStatus;
  strategy?: ResolutionStrategy;
  impact: number;
}

export interface SimulationFrame {
  tick: number;
  simulationTimeMs: number;
  weather: WeatherCondition;
  metrics: CityMetrics;
  districts: DistrictState[];
  events: CityEvent[];
  eventSequence: number;
}

export interface SimulationConfig {
  seed: number;
  startTimeMs: number;
  districtIds: string[];
  buildingIds: string[];
}

export type WorkerCommand =
  | { type: "init"; config: SimulationConfig }
  | { type: "set-speed"; speed: SimulationSpeed }
  | { type: "set-paused"; paused: boolean }
  | { type: "set-weather"; weather: WeatherCondition }
  | { type: "create-event"; eventType: CityEventType; districtId?: string; buildingId?: string }
  | { type: "resolve-event"; eventId: string; strategy: ResolutionStrategy }
  | { type: "apply-edit"; edit: SimulationEdit }
  | { type: "request-frame" };

export type SimulationEdit =
  | { kind: "add-energy-node"; districtId: string }
  | { kind: "add-hospital"; districtId: string }
  | { kind: "add-communications-tower"; districtId: string }
  | { kind: "road-status"; districtId: string; closed: boolean }
  | { kind: "building-change"; districtId: string; delta: number };

export type WorkerMessage =
  | { type: "frame"; frame: SimulationFrame; workerState: "running" | "paused" }
  | { type: "ready"; frame: SimulationFrame };
