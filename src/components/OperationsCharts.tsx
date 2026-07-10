import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SimulationFrame } from "../simulation";
import { clamp } from "../lib/format";

interface Props { frame: SimulationFrame; history: readonly SimulationFrame[] }

export default function OperationsCharts({ frame, history }: Props) {
  const trend = [...history.slice(-36), frame].map((item) => ({
    time: new Date(item.simulationTimeMs).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    load: Number(item.metrics.power.loadPercent.toFixed(1)),
    traffic: Number(item.metrics.traffic.congestionPercent.toFixed(1)),
    network: Number(item.metrics.communications.availabilityPercent.toFixed(1)),
  }));
  const districtBars = frame.districts.slice(0, 6).map((district) => ({ name: district.name.split(" ")[0], health: Number(district.healthIndex.toFixed(0)), load: Number(district.powerLoad.toFixed(0)) }));
  const radar = [
    { axis: "POWER", value: 100 - frame.metrics.power.loadPercent * 0.5 },
    { axis: "MOBILITY", value: 100 - frame.metrics.traffic.congestionPercent },
    { axis: "AIR", value: 100 - clamp(frame.metrics.air.aqi / 2.5, 0, 100) },
    { axis: "WATER", value: frame.metrics.water.reservePercent },
    { axis: "COMMS", value: frame.metrics.communications.availabilityPercent },
    { axis: "SAFETY", value: frame.metrics.safety.safetyIndex },
    { axis: "MEDICAL", value: 100 - frame.metrics.medical.occupancyPercent * 0.5 },
  ];
  return <div className="analytics-stack">
    <section className="chart-block chart-block--wide"><div className="section-heading"><span>GRID BALANCE</span><strong>Load / mobility correlation</strong></div><div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid stroke="#202827" strokeDasharray="2 4" vertical={false}/><XAxis dataKey="time" tick={{ fontSize: 9, fill: "#70807b" }} tickLine={false}/><YAxis tick={{ fontSize: 9, fill: "#70807b" }} domain={[0,100]}/><Tooltip/><Line type="monotone" dataKey="load" stroke="#58d8c3" dot={false} isAnimationActive={false}/><Line type="monotone" dataKey="traffic" stroke="#e7a94b" dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div></section>
    <section className="chart-block"><div className="section-heading"><span>NETWORK</span><strong>Availability envelope</strong></div><div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><YAxis hide domain={[80,100]}/><Tooltip/><Area type="monotone" dataKey="network" stroke="#58d8c3" fill="#20453f" isAnimationActive={false}/></AreaChart></ResponsiveContainer></div></section>
    <section className="chart-block"><div className="section-heading"><span>SYSTEM POSTURE</span><strong>Operational resilience</strong></div><div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radar} outerRadius="62%"><PolarGrid stroke="#2a3432"/><PolarAngleAxis dataKey="axis" tick={{ fontSize: 8, fill: "#84938e" }}/><Radar dataKey="value" stroke="#58d8c3" fill="#58d8c3" fillOpacity={0.14} isAnimationActive={false}/></RadarChart></ResponsiveContainer></div></section>
    <section className="chart-block chart-block--wide"><div className="section-heading"><span>DISTRICT CAPACITY</span><strong>Health index vs. grid load</strong></div><div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><BarChart data={districtBars}><CartesianGrid stroke="#202827" strokeDasharray="2 4" vertical={false}/><XAxis dataKey="name" tick={{ fontSize: 8, fill: "#6f7d79" }}/><YAxis domain={[0,100]} tick={{ fontSize: 8, fill: "#6f7d79" }}/><Tooltip/><Bar dataKey="health" fill="#58d8c3" isAnimationActive={false}/><Bar dataKey="load" fill="#e7a94b" isAnimationActive={false}/></BarChart></ResponsiveContainer></div></section>
  </div>;
}
