import { Radio, RotateCcw } from "lucide-react";
import type { SimulationFrame } from "../simulation";
import { formatSimulationTime } from "../lib/format";

interface Props { history: readonly SimulationFrame[]; replayIndex: number | null; onReplay: (index: number | null) => void }
export default function Timeline({ history, replayIndex, onReplay }: Props) {
  const max = Math.max(0, history.length - 1); const value = replayIndex ?? max; const frame = history[value];
  return <div className={replayIndex === null ? "timeline" : "timeline timeline--history"}><div className="timeline__meta"><span>{replayIndex === null ? <><Radio size={12}/> LIVE</> : "HISTORY MODE"}</span><strong>{frame === undefined ? "INITIALIZING" : formatSimulationTime(frame.simulationTimeMs)}</strong></div><input aria-label="Replay timeline" type="range" min={0} max={max} value={value} disabled={history.length < 2} onChange={(event) => onReplay(Number(event.target.value))}/>{replayIndex !== null && <button type="button" onClick={() => onReplay(null)}><RotateCcw size={13}/>RETURN LIVE</button>}</div>;
}
