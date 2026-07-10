import { beforeEach, describe, expect, it } from "vitest";
import { useAetherGridStore } from "../src/store/useAetherGridStore";

beforeEach(() => { useAetherGridStore.setState({ paused:false, speed:1, replayIndex:null, history:[] }); });
describe("AetherGrid store", () => { it("changes simulation controls", () => { useAetherGridStore.getState().setPaused(true); useAetherGridStore.getState().setSpeed(5); expect(useAetherGridStore.getState().paused).toBe(true); expect(useAetherGridStore.getState().speed).toBe(5); }); it("toggles layers", () => { const before = useAetherGridStore.getState().layers.traffic; useAetherGridStore.getState().toggleLayer("traffic"); expect(useAetherGridStore.getState().layers.traffic).toBe(!before); }); });
