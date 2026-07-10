/// <reference lib="webworker" />
import { SimulationEngine } from "./engine";
import type { SimulationSpeed, WorkerCommand, WorkerMessage } from "./types";

let engine: SimulationEngine | null = null;
let speed: SimulationSpeed = 1;
let paused = false;
let timer: number | undefined;

const post = (message: WorkerMessage): void => self.postMessage(message);
const schedule = (): void => {
  if (timer !== undefined) clearInterval(timer);
  timer = self.setInterval(() => {
    if (engine === null || paused) return;
    const frame = engine.tick(1000 * speed);
    post({ type: "frame", frame, workerState: "running" });
  }, 1000);
};

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
  const command = event.data;
  if (command.type === "init") {
    engine = new SimulationEngine(command.config);
    schedule();
    post({ type: "ready", frame: engine.snapshot() });
    return;
  }
  if (engine === null) return;
  if (command.type === "set-speed") { speed = command.speed; schedule(); }
  if (command.type === "set-paused") { paused = command.paused; post({ type: "frame", frame: engine.snapshot(), workerState: paused ? "paused" : "running" }); }
  if (command.type === "set-weather") { engine.setWeather(command.weather); post({ type: "frame", frame: engine.tick(0), workerState: paused ? "paused" : "running" }); }
  if (command.type === "create-event") { engine.createEvent(command.eventType, command.districtId, command.buildingId); post({ type: "frame", frame: engine.tick(0), workerState: paused ? "paused" : "running" }); }
  if (command.type === "resolve-event") { engine.resolveEvent(command.eventId, command.strategy); post({ type: "frame", frame: engine.tick(0), workerState: paused ? "paused" : "running" }); }
  if (command.type === "apply-edit") { engine.applyEdit(command.edit); post({ type: "frame", frame: engine.tick(0), workerState: paused ? "paused" : "running" }); }
  if (command.type === "request-frame") post({ type: "frame", frame: engine.snapshot(), workerState: paused ? "paused" : "running" });
};
