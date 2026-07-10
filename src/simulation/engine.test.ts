import { describe, expect, it } from "vitest";
import { SimulationEngine } from "./engine";

const config = { seed: 1919, startTimeMs: Date.UTC(2044,0,1,8), districtIds: ["D-1","D-2"], buildingIds: ["B-1","B-2"] };
describe("SimulationEngine", () => {
  it("is deterministic for the same seed", () => { const a = new SimulationEngine(config); const b = new SimulationEngine(config); expect(a.tick()).toEqual(b.tick()); });
  it("storm causally increases congestion", () => { const base = new SimulationEngine(config); const storm = new SimulationEngine(config); storm.setWeather("storm"); expect(storm.tick(0).metrics.traffic.congestionPercent).toBeGreaterThan(base.tick(0).metrics.traffic.congestionPercent); });
  it("power outages propagate into communications", () => { const engine = new SimulationEngine(config); const before = engine.snapshot().metrics.communications.availabilityPercent; engine.createEvent("power-outage","D-1"); const after = engine.tick(0).metrics.communications.availabilityPercent; expect(after).toBeLessThan(before); });
  it("resolving an event reduces its impact", () => { const engine = new SimulationEngine(config); const event = engine.createEvent("traffic-collision","D-1"); const active = engine.tick(0).metrics.traffic.congestionPercent; engine.resolveEvent(event.id,"reroute"); const resolved = engine.tick(0).metrics.traffic.congestionPercent; expect(resolved).toBeLessThan(active); });
});
