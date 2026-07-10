import type { BuildingKind, CityBuilding, CityDistrict, CityModel, CityRoad, DistrictKind } from "./types";

class Rng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number { this.state = (this.state * 1103515245 + 12345) >>> 0; return this.state / 4294967296; }
  range(min: number, max: number): number { return min + (max - min) * this.next(); }
  pick<T>(items: readonly T[]): T { const item = items[Math.floor(this.next() * items.length)]; if (item === undefined) throw new Error("empty"); return item; }
}

const DISTRICTS: Array<{ name: string; kind: DistrictKind; center: [number, number]; color: string }> = [
  { name: "Atlas Core", kind: "core", center: [-28, -22], color: "#62e5ca" },
  { name: "Meridian", kind: "residential", center: [0, -24], color: "#6ec8ff" },
  { name: "Harbor Arc", kind: "harbor", center: [28, -22], color: "#7fa7ff" },
  { name: "Helix Works", kind: "industrial", center: [-28, 8], color: "#e5b15e" },
  { name: "Civic Spine", kind: "civic", center: [0, 7], color: "#b8d7c9" },
  { name: "Nova Quarter", kind: "research", center: [28, 7], color: "#c89cff" },
  { name: "Foundry Belt", kind: "industrial", center: [-15, 35], color: "#db8069" },
  { name: "Astra Heights", kind: "residential", center: [20, 35], color: "#7ed8ae" },
];

const kindsFor = (kind: DistrictKind): readonly BuildingKind[] => {
  if (kind === "industrial") return ["industrial", "energy", "commercial"];
  if (kind === "civic") return ["civic", "hospital", "commercial"];
  if (kind === "research") return ["communications", "commercial", "energy"];
  if (kind === "residential") return ["residential", "residential", "commercial", "hospital"];
  if (kind === "harbor") return ["commercial", "industrial", "communications"];
  return ["commercial", "commercial", "civic", "communications"];
};

export const generateCity = (seed = 1919): CityModel => {
  const rng = new Rng(seed);
  const districts: CityDistrict[] = DISTRICTS.map((district, index) => ({ ...district, id: `D-${index + 1}` }));
  const buildings: CityBuilding[] = [];

  for (const district of districts) {
    const count = district.kind === "core" ? 34 : 24;
    for (let index = 0; index < count; index += 1) {
      const angle = rng.range(0, Math.PI * 2);
      const radius = rng.range(3, district.kind === "core" ? 16 : 18);
      const x = district.center[0] + Math.cos(angle) * radius + rng.range(-2.5, 2.5);
      const z = district.center[1] + Math.sin(angle) * radius + rng.range(-2.5, 2.5);
      const coreFactor = district.kind === "core" ? 1.65 : district.kind === "research" ? 1.25 : 1;
      const width = rng.range(1.4, 3.6);
      const depth = rng.range(1.4, 3.6);
      const height = rng.range(3.5, 17) * coreFactor;
      const kind = rng.pick(kindsFor(district.kind));
      const id = `B-${buildings.length.toString().padStart(3, "0")}`;
      buildings.push({
        id,
        name: `${district.name.split(" ")[0]} ${String(index + 1).padStart(2, "0")}`,
        kind,
        districtId: district.id,
        position: [x, height / 2, z],
        size: [width, height, depth],
        rotation: rng.range(-0.18, 0.18),
        operational: true,
      });
    }
  }

  const roads: CityRoad[] = [];
  for (let x = -48; x <= 48; x += 12) roads.push({ id: `RX-${x}`, points: [[x, -50], [x, 50]], arterial: x % 24 === 0 });
  for (let z = -48; z <= 48; z += 12) roads.push({ id: `RZ-${z}`, points: [[-50, z], [50, z]], arterial: z % 24 === 0 });

  return { seed, districts, buildings, roads };
};
