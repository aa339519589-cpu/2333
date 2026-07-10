import { useEffect, useState } from "react";

interface Props { drawCalls: number; triangles: number; workerState: string }
export default function PerformancePanel({ drawCalls, triangles, workerState }: Props) {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.7);
  useEffect(() => {
    let frames = 0; let last = performance.now(); let raf = 0;
    const loop = (now: number) => { frames += 1; if (now - last >= 1000) { const measured = frames * 1000 / (now - last); setFps(measured); setFrameTime(1000 / measured); frames = 0; last = now; } raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);
  const heap = "memory" in performance ? Math.round((performance as Performance & { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / 1048576) : null;
  return <div className="diagnostics-grid"><Metric label="FPS" value={fps.toFixed(0)}/><Metric label="FRAME TIME" value={`${frameTime.toFixed(1)} ms`}/><Metric label="DRAW CALLS" value={String(drawCalls)}/><Metric label="TRIANGLES" value={triangles.toLocaleString()}/><Metric label="JS HEAP" value={heap === null ? "N/A" : `${heap} MB`}/><Metric label="WORKER" value={workerState.toUpperCase()}/></div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="diagnostic"><span>{label}</span><strong>{value}</strong></div>; }
