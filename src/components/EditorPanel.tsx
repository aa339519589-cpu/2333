import { Building2, Hospital, RadioTower, Route, Trash2, Zap } from "lucide-react";
import type { CityBuilding, CityModel } from "../city";
import type { SimulationEdit } from "../simulation";

interface Props { city: CityModel; selectedBuilding: CityBuilding | null; onCity: (city: CityModel) => void; onEdit: (edit: SimulationEdit) => void }
export default function EditorPanel({ city, selectedBuilding, onCity, onEdit }: Props) {
  const districtId = selectedBuilding?.districtId ?? city.districts[0]?.id ?? "D-1";
  const add = (kind: CityBuilding["kind"]) => {
    const district = city.districts.find((item) => item.id === districtId); if (district === undefined) return;
    const id = `B-${Date.now().toString(36)}`;
    const height = kind === "hospital" ? 8 : kind === "energy" ? 5 : kind === "communications" ? 13 : 9;
    const building: CityBuilding = { id, name: `User ${kind}`, kind, districtId, position: [district.center[0] + Math.random() * 8 - 4, height / 2, district.center[1] + Math.random() * 8 - 4], size: [3, height, 3], rotation: 0, operational: true };
    onCity({ ...city, buildings: [...city.buildings, building] });
    onEdit({ kind: kind === "hospital" ? "add-hospital" : kind === "energy" ? "add-energy-node" : kind === "communications" ? "add-communications-tower" : "building-change", districtId, ...(kind === "hospital" || kind === "energy" || kind === "communications" ? {} : { delta: 1 }) } as SimulationEdit);
  };
  const remove = () => { if (selectedBuilding === null) return; onCity({ ...city, buildings: city.buildings.filter((item) => item.id !== selectedBuilding.id) }); onEdit({ kind: "building-change", districtId: selectedBuilding.districtId, delta: -1 }); };
  return <div className="editor-grid"><button type="button" onClick={() => add("commercial")}><Building2 size={17}/><span>Add building</span></button><button type="button" onClick={() => add("energy")}><Zap size={17}/><span>Add energy node</span></button><button type="button" onClick={() => add("hospital")}><Hospital size={17}/><span>Add hospital</span></button><button type="button" onClick={() => add("communications")}><RadioTower size={17}/><span>Add comms tower</span></button><button type="button" onClick={() => onEdit({ kind: "road-status", districtId, closed: true })}><Route size={17}/><span>Close district roads</span></button><button type="button" disabled={selectedBuilding === null} onClick={remove}><Trash2 size={17}/><span>Delete selected</span></button></div>;
}
