import { AlertTriangle, CheckCircle2, Flame, Radio, ShieldAlert, Siren } from "lucide-react";
import type { CityEvent, ResolutionStrategy } from "../simulation";
import { formatSimulationTime } from "../lib/format";

interface Props { events: readonly CityEvent[]; onResolve: (id: string, strategy: ResolutionStrategy) => void }
const strategyFor = (event: CityEvent): ResolutionStrategy => event.category === "transport" ? "reroute" : event.category === "fire" || event.category === "medical" ? "dispatch" : event.category === "environment" || event.category === "water" ? "isolate" : event.category === "public" ? "evacuate" : "repair";
const iconFor = (event: CityEvent) => event.category === "fire" ? Flame : event.category === "communications" ? Radio : event.category === "security" ? ShieldAlert : event.category === "transport" ? Siren : AlertTriangle;

export default function AlertsPanel({ events, onResolve }: Props) {
  const visible = [...events].sort((a,b) => Number(a.status === "resolved") - Number(b.status === "resolved") || b.createdAtMs - a.createdAtMs);
  if (visible.length === 0) return <div className="empty-state"><CheckCircle2 size={20}/><strong>No active alerts</strong><span>City systems are within operating thresholds.</span></div>;
  return <div className="alert-list">{visible.map((event) => { const Icon = iconFor(event); return <article className={`alert-row alert-row--${event.status} alert-row--s${event.severity}`} key={event.id}><div className="alert-row__icon"><Icon size={14}/></div><div className="alert-row__body"><div><strong>{event.title}</strong><b>S{event.severity}</b></div><p>{event.description}</p><span>{event.districtId} / {formatSimulationTime(event.createdAtMs)}</span></div>{event.status === "active" && <button type="button" onClick={() => onResolve(event.id, strategyFor(event))}>DISPATCH</button>}</article>; })}</div>;
}
