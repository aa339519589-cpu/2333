export type BuildingKind = "residential" | "commercial" | "industrial" | "hospital" | "energy" | "communications" | "civic";
export type DistrictKind = "core" | "residential" | "industrial" | "harbor" | "civic" | "research";
export type Vec3 = [number, number, number];

export interface CityDistrict {
  id: string;
  name: string;
  kind: DistrictKind;
  center: [number, number];
  color: string;
}

export interface CityBuilding {
  id: string;
  name: string;
  kind: BuildingKind;
  districtId: string;
  position: Vec3;
  size: Vec3;
  rotation: number;
  operational: boolean;
}

export interface CityRoad {
  id: string;
  points: [number, number][];
  arterial: boolean;
}

export interface CityModel {
  seed: number;
  districts: CityDistrict[];
  buildings: CityBuilding[];
  roads: CityRoad[];
}
