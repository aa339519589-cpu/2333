import { describe, expect, it } from "vitest";
import { generateCity } from "./generator";

describe("generateCity", () => { it("generates a deterministic dense city", () => { const a = generateCity(1919); const b = generateCity(1919); expect(a).toEqual(b); expect(a.buildings.length).toBeGreaterThan(180); expect(a.districts).toHaveLength(8); expect(a.roads.length).toBeGreaterThan(10); }); });
