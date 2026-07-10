import { Download, Save, Trash2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import type { WorkspaceSnapshot } from "../store";
import { downloadText } from "../lib/format";

interface Props { workspaces: readonly WorkspaceSnapshot[]; onSave: () => void; onLoad: (workspace: WorkspaceSnapshot) => void; onDelete: (id: string) => void; onImport: (workspace: WorkspaceSnapshot) => void }
export default function WorkspacePanel({ workspaces, onSave, onLoad, onDelete, onImport }: Props) {
  const importFile = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file === undefined) return; void file.text().then((text) => onImport(JSON.parse(text) as WorkspaceSnapshot)); };
  return <div className="workspace-panel"><div className="workspace-actions"><button type="button" onClick={onSave}><Save size={15}/>SAVE WORKSPACE</button><label><Upload size={15}/>IMPORT<input type="file" accept="application/json" onChange={importFile}/></label></div>{workspaces.length === 0 ? <div className="empty-state"><strong>No saved workspaces</strong><span>Persist a control configuration for later recovery.</span></div> : workspaces.map((workspace) => <article key={workspace.id}><div><strong>{workspace.name}</strong><span>{new Date(workspace.savedAt).toLocaleString()}</span></div><button type="button" onClick={() => onLoad(workspace)}>LOAD</button><button type="button" onClick={() => downloadText(`${workspace.name}.json`, JSON.stringify(workspace, null, 2))}><Download size={14}/></button><button type="button" onClick={() => onDelete(workspace.id)}><Trash2 size={14}/></button></article>)}</div>;
}
