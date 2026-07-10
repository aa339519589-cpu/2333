import type { CityModel } from "../city";
import type { SimulationFrame, SimulationSpeed, WeatherCondition } from "../simulation";

export type LayerId = "traffic" | "districts" | "events" | "air" | "power";
export type PanelId = "metrics" | "alerts" | "timeline" | "analytics" | "editor" | "performance" | "workspaces";
export type DayMode = "day" | "night" | "auto";

export interface CameraBookmark {
  id: string;
  name: string;
  buildingId: string | null;
}

export interface WorkspaceSnapshot {
  id: string;
  name: string;
  savedAt: number;
  city: CityModel;
  selectedBuildingId: string | null;
  weather: WeatherCondition;
  speed: SimulationSpeed;
  dayMode: DayMode;
  layers: Record<LayerId, boolean>;
  bookmarks: CameraBookmark[];
  latestFrame: SimulationFrame | null;
}
