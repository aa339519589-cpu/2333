import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CityModel } from "../city";
import type { SimulationFrame, SimulationSpeed, WeatherCondition } from "../simulation";
import type { CameraBookmark, DayMode, LayerId, PanelId } from "./types";

interface StoreState {
  city: CityModel | null;
  frame: SimulationFrame | null;
  history: SimulationFrame[];
  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  selectedDistrictId: string | null;
  paused: boolean;
  speed: SimulationSpeed;
  weather: WeatherCondition;
  dayMode: DayMode;
  replayIndex: number | null;
  autoCruise: boolean;
  firstPerson: boolean;
  commandOpen: boolean;
  searchOpen: boolean;
  activePanel: PanelId;
  layers: Record<LayerId, boolean>;
  bookmarks: CameraBookmark[];
  setCity: (city: CityModel) => void;
  ingestFrame: (frame: SimulationFrame) => void;
  setSelectedBuilding: (id: string | null) => void;
  setHoveredBuilding: (id: string | null) => void;
  setSelectedDistrict: (id: string | null) => void;
  setPaused: (paused: boolean) => void;
  setSpeed: (speed: SimulationSpeed) => void;
  setWeather: (weather: WeatherCondition) => void;
  setDayMode: (mode: DayMode) => void;
  setReplayIndex: (index: number | null) => void;
  setAutoCruise: (enabled: boolean) => void;
  setFirstPerson: (enabled: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setActivePanel: (panel: PanelId) => void;
  toggleLayer: (layer: LayerId) => void;
  addBookmark: (bookmark: CameraBookmark) => void;
  replaceCity: (city: CityModel) => void;
  resetUi: () => void;
}

const defaultLayers: Record<LayerId, boolean> = { traffic: true, districts: true, events: true, air: false, power: false };

export const useAetherGridStore = create<StoreState>()(persist((set) => ({
  city: null,
  frame: null,
  history: [],
  selectedBuildingId: null,
  hoveredBuildingId: null,
  selectedDistrictId: null,
  paused: false,
  speed: 1,
  weather: "clear",
  dayMode: "auto",
  replayIndex: null,
  autoCruise: false,
  firstPerson: false,
  commandOpen: false,
  searchOpen: false,
  activePanel: "metrics",
  layers: defaultLayers,
  bookmarks: [],
  setCity: (city) => set({ city }),
  ingestFrame: (frame) => set((state) => ({ frame, history: [...state.history, frame].slice(-720) })),
  setSelectedBuilding: (selectedBuildingId) => set({ selectedBuildingId }),
  setHoveredBuilding: (hoveredBuildingId) => set({ hoveredBuildingId }),
  setSelectedDistrict: (selectedDistrictId) => set({ selectedDistrictId }),
  setPaused: (paused) => set({ paused }),
  setSpeed: (speed) => set({ speed }),
  setWeather: (weather) => set({ weather }),
  setDayMode: (dayMode) => set({ dayMode }),
  setReplayIndex: (replayIndex) => set({ replayIndex }),
  setAutoCruise: (autoCruise) => set({ autoCruise }),
  setFirstPerson: (firstPerson) => set({ firstPerson }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setActivePanel: (activePanel) => set({ activePanel }),
  toggleLayer: (layer) => set((state) => ({ layers: { ...state.layers, [layer]: !state.layers[layer] } })),
  addBookmark: (bookmark) => set((state) => ({ bookmarks: [...state.bookmarks, bookmark].slice(-8) })),
  replaceCity: (city) => set({ city }),
  resetUi: () => set({ selectedBuildingId: null, selectedDistrictId: null, paused: false, speed: 1, weather: "clear", dayMode: "auto", replayIndex: null, autoCruise: false, firstPerson: false, layers: defaultLayers }),
}), {
  name: "aethergrid-ui",
  partialize: (state) => ({ speed: state.speed, weather: state.weather, dayMode: state.dayMode, layers: state.layers, bookmarks: state.bookmarks }),
}));
