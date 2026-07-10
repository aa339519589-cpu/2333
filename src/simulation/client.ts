import type { SimulationConfig, WorkerCommand, WorkerMessage } from "./types";

export class SimulationWorkerClient {
  private readonly worker: Worker;
  constructor(config: SimulationConfig, onMessage: (message: WorkerMessage) => void) {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => onMessage(event.data);
    this.send({ type: "init", config });
  }
  send(command: WorkerCommand): void { this.worker.postMessage(command); }
  destroy(): void { this.worker.terminate(); }
}
