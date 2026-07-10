import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { CityBuilding, CityDistrict } from "../city";
import { titleCase } from "../lib/format";

interface Props { open: boolean; buildings: readonly CityBuilding[]; districts: readonly CityDistrict[]; onClose: () => void; onBuilding: (id: string) => void }
export default function GlobalSearch({ open, buildings, districts, onClose, onBuilding }: Props) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (normalized.length === 0) return buildings.slice(0, 12);
    return buildings.filter((building) => `${building.name} ${building.kind} ${building.districtId}`.toLowerCase().includes(normalized)).slice(0, 30);
  }, [buildings, query]);
  if (!open) return null;
  return <div className="command-overlay"><section className="global-search" role="dialog" aria-modal="true"><div className="global-search__input"><Search size={18}/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find building, district or infrastructure node" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}/><button type="button" onClick={onClose}><X size={16}/></button></div><div className="global-search__districts">{districts.map((district) => <span key={district.id}>{district.name}</span>)}</div><div className="global-search__results">{results.map((building) => <button type="button" key={building.id} onClick={() => { onBuilding(building.id); onClose(); }}><strong>{building.name}</strong><span>{titleCase(building.kind)} / {building.districtId}</span></button>)}</div></section></div>;
}
