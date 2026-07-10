import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CloudRain, Command, Layers3, Moon, Pause, Play, RotateCcw, Save, Sun, X } from "lucide-react";
import type { CityBuilding, CityDistrict } from "../city";
import type { CityEventType, WeatherCondition } from "../simulation";
import type { LayerId } from "../store";
import { titleCase } from "../lib/format";

interface Props {
  open: boolean; paused: boolean; buildings: readonly CityBuilding[]; districts: readonly CityDistrict[]; layers: readonly LayerId[];
  onClose: () => void; onSelectBuilding: (id: string) => void; onWeather: (weather: WeatherCondition) => void; onDayMode: (mode: "day" | "night" | "auto") => void;
  onPause: (paused: boolean) => void; onCreateEvent: (type: CityEventType) => void; onToggleLayer: (layer: LayerId) => void; onSave: () => void; onReset: () => void;
}
interface CommandItem { id: string; label: string; group: string; run: () => void; icon: React.ReactNode }

export default function CommandPalette(props: Props) {
  const [query, setQuery] = useState("");
  useEffect(() => { if (props.open) setQuery(""); }, [props.open]);
  const items = useMemo<CommandItem[]>(() => {
    const base: CommandItem[] = [
      { id: "pause", label: props.paused ? "Resume live simulation" : "Pause simulation", group: "Operations", run: () => props.onPause(!props.paused), icon: props.paused ? <Play size={15}/> : <Pause size={15}/> },
      { id: "save", label: "Save current workspace", group: "Operations", run: props.onSave, icon: <Save size={15}/> },
      { id: "reset", label: "Restore default city state", group: "Operations", run: props.onReset, icon: <RotateCcw size={15}/> },
      ...(["clear","rain","storm","fog","heatwave","snow"] as WeatherCondition[]).map((weather) => ({ id: `weather-${weather}`, label: `Set weather: ${titleCase(weather)}`, group: "Environment", run: () => props.onWeather(weather), icon: <CloudRain size={15}/> })),
      { id: "day", label: "Set scene time: Day", group: "Environment", run: () => props.onDayMode("day"), icon: <Sun size={15}/> },
      { id: "night", label: "Set scene time: Night", group: "Environment", run: () => props.onDayMode("night"), icon: <Moon size={15}/> },
      ...(["building-fire","traffic-collision","power-outage","communications-failure","hospital-overload","drone-malfunction"] as CityEventType[]).map((type) => ({ id: `event-${type}`, label: `Create ${titleCase(type)}`, group: "Create event", run: () => props.onCreateEvent(type), icon: <AlertTriangle size={15}/> })),
      ...props.layers.map((layer) => ({ id: `layer-${layer}`, label: `Toggle ${titleCase(layer)} layer`, group: "Layers", run: () => props.onToggleLayer(layer), icon: <Layers3 size={15}/> })),
      ...props.buildings.slice(0, 80).map((building) => ({ id: building.id, label: `Jump to ${building.name} · ${titleCase(building.kind)}`, group: "Buildings", run: () => props.onSelectBuilding(building.id), icon: <Command size={15}/> })),
      ...props.districts.map((district) => ({ id: district.id, label: `District ${district.name}`, group: "Districts", run: () => undefined, icon: <Command size={15}/> })),
    ];
    return base;
  }, [props]);
  if (!props.open) return null;
  const normalized = query.trim().toLowerCase();
  const filtered = normalized.length === 0 ? items.slice(0, 24) : items.filter((item) => item.label.toLowerCase().includes(normalized)).slice(0, 30);
  const run = (item: CommandItem) => { item.run(); props.onClose(); };
  return <div className="command-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) props.onClose(); }}><section className="command-dialog" role="dialog" aria-modal="true" aria-label="AetherGrid command palette"><div className="command-input-wrap"><Command size={16}/><input autoFocus placeholder="Search commands, assets, districts..." value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") props.onClose(); if (event.key === "Enter" && filtered[0] !== undefined) run(filtered[0]); }}/><button type="button" onClick={props.onClose} aria-label="Close"><X size={15}/></button></div><div className="command-list">{filtered.length === 0 ? <div className="empty-state"><strong>No matching command</strong></div> : filtered.map((item) => <button type="button" key={item.id} onClick={() => run(item)}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.group}</small></button>)}</div><footer><span>ENTER Run first match</span><span>ESC Close</span></footer></section></div>;
}
