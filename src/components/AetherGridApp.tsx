import { Activity, AlertTriangle, BarChart3, Bookmark, Building2, Command, Gauge, Layers3, Menu, Moon, Pause, Play, Search, Settings2, Sun, TimerReset, X, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateCity, type CityBuilding, type CityModel } from "../city";
import { SimulationWorkerClient, type CityEventType, type ResolutionStrategy, type SimulationEdit, type SimulationFrame, type SimulationSpeed, type WeatherCondition } from "../simulation";
import { deleteWorkspace, listWorkspaces, saveWorkspace, useAetherGridStore, type LayerId, type PanelId, type WorkspaceSnapshot } from "../store";
import { formatNumber, formatSimulationTime, titleCase } from "../lib/format";
import AlertsPanel from "./AlertsPanel";
import CityScene from "./CityScene";
import CommandPalette from "./CommandPalette";
import EditorPanel from "./EditorPanel";
import GlobalSearch from "./GlobalSearch";
import OperationsCharts from "./OperationsCharts";
import PerformancePanel from "./PerformancePanel";
import Timeline from "./Timeline";
import WorkspacePanel from "./WorkspacePanel";

const speeds: SimulationSpeed[] = [0.5, 1, 2, 5, 10];
const layerIds: LayerId[] = ["traffic", "districts", "events", "air", "power"];
const panelIds: Array<{ id: PanelId; label: string; icon: React.ReactNode }> = [
  { id: "metrics", label: "Asset", icon: <Building2 size={14}/> },
  { id: "alerts", label: "Alerts", icon: <AlertTriangle size={14}/> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={14}/> },
  { id: "editor", label: "Editor", icon: <Settings2 size={14}/> },
  { id: "workspaces", label: "Workspaces", icon: <Bookmark size={14}/> },
  { id: "performance", label: "Perf", icon: <Gauge size={14}/> },
];

export default function AetherGridApp() {
  const store = useAetherGridStore();
  const workerRef = useRef<SimulationWorkerClient | null>(null);
  const [workerState, setWorkerState] = useState("booting");
  const [drawCalls, setDrawCalls] = useState(0);
  const [triangles, setTriangles] = useState(0);
  const [workspaces, setWorkspaces] = useState<WorkspaceSnapshot[]>([]);
  const [mobileRail, setMobileRail] = useState(false);
  const initialCity = useMemo(() => generateCity(1919), []);
  const city = store.city ?? initialCity;

  useEffect(() => {
    if (store.city === null) store.setCity(initialCity);
    const client = new SimulationWorkerClient({ seed: 1919, startTimeMs: Date.UTC(2044, 6, 10, 7, 30, 0), districtIds: initialCity.districts.map((district) => district.id), buildingIds: initialCity.buildings.map((building) => building.id) }, (message) => {
      store.ingestFrame(message.frame);
      setWorkerState(message.type === "ready" ? "running" : message.workerState);
    });
    workerRef.current = client;
    void listWorkspaces().then(setWorkspaces);
    return () => client.destroy();
  }, [initialCity]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); store.setCommandOpen(true); }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") { event.preventDefault(); store.setSearchOpen(true); }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void saveCurrentWorkspace(); }
      if (event.code === "Space" && event.target === document.body) { event.preventDefault(); setPaused(!store.paused); }
      if (event.key === "Escape") { store.setCommandOpen(false); store.setSearchOpen(false); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  });

  const liveFrame = store.frame;
  const replayFrame = store.replayIndex === null ? null : store.history[store.replayIndex] ?? null;
  const frame = replayFrame ?? liveFrame;
  const selectedBuilding = city.buildings.find((building) => building.id === store.selectedBuildingId) ?? null;

  const send = useCallback((command: Parameters<SimulationWorkerClient["send"]>[0]) => workerRef.current?.send(command), []);
  const setPaused = (paused: boolean) => { store.setPaused(paused); send({ type: "set-paused", paused }); };
  const setSpeed = (speed: SimulationSpeed) => { store.setSpeed(speed); send({ type: "set-speed", speed }); };
  const setWeather = (weather: WeatherCondition) => { store.setWeather(weather); send({ type: "set-weather", weather }); };
  const createEvent = (eventType: CityEventType) => send({ type: "create-event", eventType, districtId: store.selectedDistrictId ?? selectedBuilding?.districtId, buildingId: selectedBuilding?.id });
  const resolveEvent = (eventId: string, strategy: ResolutionStrategy) => send({ type: "resolve-event", eventId, strategy });
  const applyEdit = (edit: SimulationEdit) => send({ type: "apply-edit", edit });

  const saveCurrentWorkspace = async (): Promise<void> => {
    const snapshot: WorkspaceSnapshot = { id: `ws-${Date.now()}`, name: `AetherGrid ${new Date().toLocaleString()}`, savedAt: Date.now(), city, selectedBuildingId: store.selectedBuildingId, weather: store.weather, speed: store.speed, dayMode: store.dayMode, layers: store.layers, bookmarks: store.bookmarks, latestFrame: liveFrame };
    await saveWorkspace(snapshot); setWorkspaces(await listWorkspaces());
  };
  const loadWorkspace = (workspace: WorkspaceSnapshot) => {
    store.replaceCity(workspace.city); store.setSelectedBuilding(workspace.selectedBuildingId); store.setWeather(workspace.weather); store.setSpeed(workspace.speed); store.setDayMode(workspace.dayMode);
    send({ type: "set-weather", weather: workspace.weather }); send({ type: "set-speed", speed: workspace.speed });
  };
  const removeWorkspace = async (id: string) => { await deleteWorkspace(id); setWorkspaces(await listWorkspaces()); };
  const importWorkspace = async (workspace: WorkspaceSnapshot) => { await saveWorkspace({ ...workspace, id: `ws-${Date.now()}`, savedAt: Date.now() }); setWorkspaces(await listWorkspaces()); };

  const updateCity = (nextCity: CityModel) => store.replaceCity(nextCity);
  const updatePerformance = useCallback((calls: number, nextTriangles: number) => { setDrawCalls(calls); setTriangles(nextTriangles); }, []);
  const addBookmark = () => store.addBookmark({ id: `bookmark-${Date.now()}`, name: selectedBuilding?.name ?? `City view ${store.bookmarks.length + 1}`, buildingId: selectedBuilding?.id ?? null });
  const reset = () => { store.replaceCity(generateCity(1919)); store.resetUi(); setWeather("clear"); setPaused(false); setSpeed(1); };

  if (frame === null) return <main className="boot-curtain" role="status"><div className="brand-mark large"><i/><i/><i/></div><span>LOADING AETHERGRID CONTROL PLANE</span><strong>Synchronizing causal city systems</strong></main>;

  return <main className={store.replayIndex === null ? "app-shell" : "app-shell history-mode"}>
    <header className="topbar">
      <button className="mobile-menu" type="button" onClick={() => setMobileRail(!mobileRail)}><Menu size={18}/></button>
      <div className="brand"><div className="brand-mark"><i/><i/><i/></div><div><strong>AETHERGRID</strong><span>FUTURE CITY COMMAND / NODE 07</span></div></div>
      <div className="system-status"><i/><span>{workerState.toUpperCase()}</span><b>{formatSimulationTime(frame.simulationTimeMs)}</b></div>
      <button className="search-trigger" type="button" onClick={() => store.setSearchOpen(true)}><Search size={14}/><span>Search city assets</span><kbd>⌘F</kbd></button>
      <button className="icon-button" type="button" onClick={() => store.setCommandOpen(true)} title="Command palette"><Command size={16}/><kbd>⌘K</kbd></button>
    </header>

    <aside className={mobileRail ? "left-rail is-open" : "left-rail"}>
      <div className="rail-heading"><span>LIVE CITY SYSTEMS</span><button type="button" className="mobile-close" onClick={() => setMobileRail(false)}><X size={15}/></button></div>
      <MetricTile label="Grid load" value={`${frame.metrics.power.loadPercent.toFixed(1)}%`} sub={`${formatNumber(frame.metrics.power.demandMw)} MW`} tone={frame.metrics.power.loadPercent > 85 ? "danger" : "cyan"}/>
      <MetricTile label="Mobility" value={`${frame.metrics.traffic.congestionPercent.toFixed(0)}%`} sub={`${frame.metrics.traffic.averageSpeedKph.toFixed(0)} km/h`} tone={frame.metrics.traffic.congestionPercent > 70 ? "warning" : "cyan"}/>
      <MetricTile label="Air quality" value={`AQI ${frame.metrics.air.aqi.toFixed(0)}`} sub={`${frame.metrics.air.particulate.toFixed(1)} µg/m³`} tone={frame.metrics.air.aqi > 120 ? "danger" : "green"}/>
      <MetricTile label="Water reserve" value={`${frame.metrics.water.reservePercent.toFixed(1)}%`} sub={`Quality ${frame.metrics.water.qualityIndex.toFixed(0)}`} tone="green"/>
      <MetricTile label="Communications" value={`${frame.metrics.communications.availabilityPercent.toFixed(2)}%`} sub={`${frame.metrics.communications.latencyMs.toFixed(0)} ms`} tone="cyan"/>
      <MetricTile label="Medical capacity" value={`${frame.metrics.medical.occupancyPercent.toFixed(0)}%`} sub={`${frame.metrics.medical.responseMinutes.toFixed(1)} min response`} tone={frame.metrics.medical.occupancyPercent > 88 ? "danger" : "warning"}/>
      <section className="layer-control"><div className="section-heading"><span>MAP LAYERS</span><strong>Spatial telemetry</strong></div>{layerIds.map((layer) => <button type="button" key={layer} className={store.layers[layer] ? "is-active" : ""} onClick={() => store.toggleLayer(layer)}><span><Layers3 size={13}/>{titleCase(layer)}</span><i/></button>)}</section>
    </aside>

    <section className="command-stage">
      <CityScene city={city} selectedBuildingId={store.selectedBuildingId} hoveredBuildingId={store.hoveredBuildingId} events={frame.events} weather={frame.weather} dayMode={store.dayMode} autoCruise={store.autoCruise} firstPerson={store.firstPerson} showTraffic={store.layers.traffic} showDistricts={store.layers.districts} showEvents={store.layers.events} onSelectBuilding={store.setSelectedBuilding} onHoverBuilding={store.setHoveredBuilding} onPerformance={updatePerformance}/>
      <div className="scene-toolbar">
        <button type="button" className={store.autoCruise ? "is-active" : ""} onClick={() => store.setAutoCruise(!store.autoCruise)}>AUTO CRUISE</button>
        <button type="button" className={store.firstPerson ? "is-active" : ""} onClick={() => store.setFirstPerson(!store.firstPerson)}>{store.firstPerson ? "FIRST PERSON" : "ORBIT"}</button>
        <button type="button" onClick={addBookmark}><Bookmark size={13}/>BOOKMARK</button>
        <button type="button" onClick={() => store.setDayMode(store.dayMode === "night" ? "day" : "night")}>{store.dayMode === "night" ? <Sun size={13}/> : <Moon size={13}/>}LIGHT</button>
      </div>
      <div className="sim-controls"><button type="button" onClick={() => setPaused(!store.paused)}>{store.paused ? <Play size={16}/> : <Pause size={16}/>}</button>{speeds.map((speed) => <button type="button" key={speed} className={store.speed === speed ? "is-active" : ""} onClick={() => setSpeed(speed)}>{speed}×</button>)}<select aria-label="Weather" value={store.weather} onChange={(event) => setWeather(event.target.value as WeatherCondition)}>{(["clear","rain","storm","fog","heatwave","snow"] as WeatherCondition[]).map((weather) => <option key={weather} value={weather}>{titleCase(weather)}</option>)}</select></div>
      {store.replayIndex !== null && <div className="history-banner"><TimerReset size={15}/><strong>HISTORY REPLAY</strong><span>Live simulation continues in the Worker while you inspect the past.</span></div>}
    </section>

    <aside className="right-rail">
      <nav className="panel-tabs">{panelIds.map((panel) => <button type="button" key={panel.id} className={store.activePanel === panel.id ? "is-active" : ""} onClick={() => store.setActivePanel(panel.id)}>{panel.icon}<span>{panel.label}</span></button>)}</nav>
      <div className="panel-body">{renderPanel(store.activePanel, frame, store.history, selectedBuilding, city, workspaces, { resolveEvent, updateCity, applyEdit, saveCurrentWorkspace, loadWorkspace, removeWorkspace, importWorkspace, drawCalls, triangles, workerState })}</div>
    </aside>

    <footer className="bottom-dock"><Timeline history={store.history} replayIndex={store.replayIndex} onReplay={(index) => { store.setReplayIndex(index); if (index !== null) setPaused(true); }}/><div className="dock-summary"><Activity size={13}/><span>{frame.events.filter((event) => event.status === "active").length} ACTIVE EVENTS</span><b>{city.buildings.length} ASSETS</b><b>{frame.weather.toUpperCase()}</b></div></footer>

    <CommandPalette open={store.commandOpen} paused={store.paused} buildings={city.buildings} districts={city.districts} layers={layerIds} onClose={() => store.setCommandOpen(false)} onSelectBuilding={store.setSelectedBuilding} onWeather={setWeather} onDayMode={store.setDayMode} onPause={setPaused} onCreateEvent={createEvent} onToggleLayer={store.toggleLayer} onSave={() => { void saveCurrentWorkspace(); }} onReset={reset}/>
    <GlobalSearch open={store.searchOpen} buildings={city.buildings} districts={city.districts} onClose={() => store.setSearchOpen(false)} onBuilding={store.setSelectedBuilding}/>
  </main>;
}

function MetricTile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "cyan" | "green" | "warning" | "danger" }) { return <article className={`metric-tile metric-tile--${tone}`}><div><span>{label}</span><i/></div><strong>{value}</strong><small>{sub}</small></article>; }

interface PanelActions {
  resolveEvent: (id: string, strategy: ResolutionStrategy) => void;
  updateCity: (city: CityModel) => void;
  applyEdit: (edit: SimulationEdit) => void;
  saveCurrentWorkspace: () => Promise<void>;
  loadWorkspace: (workspace: WorkspaceSnapshot) => void;
  removeWorkspace: (id: string) => Promise<void>;
  importWorkspace: (workspace: WorkspaceSnapshot) => Promise<void>;
  drawCalls: number;
  triangles: number;
  workerState: string;
}

function renderPanel(panel: PanelId, frame: SimulationFrame, history: readonly SimulationFrame[], selectedBuilding: CityBuilding | null, city: CityModel, workspaces: readonly WorkspaceSnapshot[], actions: PanelActions): React.ReactNode {
  if (panel === "alerts") return <AlertsPanel events={frame.events} onResolve={actions.resolveEvent}/>;
  if (panel === "analytics") return <OperationsCharts frame={frame} history={history}/>;
  if (panel === "editor") return <EditorPanel city={city} selectedBuilding={selectedBuilding} onCity={actions.updateCity} onEdit={actions.applyEdit}/>;
  if (panel === "performance") return <PerformancePanel drawCalls={actions.drawCalls} triangles={actions.triangles} workerState={actions.workerState}/>;
  if (panel === "workspaces") return <WorkspacePanel workspaces={workspaces} onSave={() => { void actions.saveCurrentWorkspace(); }} onLoad={actions.loadWorkspace} onDelete={(id) => { void actions.removeWorkspace(id); }} onImport={(workspace) => { void actions.importWorkspace(workspace); }}/>;
  return <AssetPanel building={selectedBuilding} frame={frame}/>;
}

function AssetPanel({ building, frame }: { building: CityBuilding | null; frame: SimulationFrame }) {
  if (building === null) return <div className="empty-state asset-empty"><Building2 size={25}/><strong>Select a city asset</strong><span>Click any building in the 3D twin to inspect live operational data.</span></div>;
  const district = frame.districts.find((item) => item.id === building.districtId);
  return <div className="asset-panel"><div className="asset-panel__header"><span>SELECTED INFRASTRUCTURE</span><h2>{building.name}</h2><p>{titleCase(building.kind)} · {building.id} · {building.districtId}</p></div><div className="asset-status"><i/><span>OPERATIONAL</span><b>99.97%</b></div><div className="asset-data"><DataRow label="District health" value={`${district?.healthIndex.toFixed(1) ?? "—"}%`}/><DataRow label="Local grid load" value={`${district?.powerLoad.toFixed(1) ?? "—"}%`}/><DataRow label="Local congestion" value={`${district?.congestion.toFixed(0) ?? "—"}%`}/><DataRow label="Air quality" value={`AQI ${district?.aqi.toFixed(0) ?? "—"}`}/><DataRow label="Height" value={`${building.size[1].toFixed(1)} m`}/></div><section className="causal-note"><Zap size={15}/><div><strong>CAUSAL LINK ACTIVE</strong><span>Changes to this asset propagate into district and city metrics through the simulation Worker.</span></div></section></div>;
}
function DataRow({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
