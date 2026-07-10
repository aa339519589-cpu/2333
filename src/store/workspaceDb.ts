import { openDB, type DBSchema } from "idb";
import type { WorkspaceSnapshot } from "./types";

interface AetherGridDb extends DBSchema {
  workspaces: { key: string; value: WorkspaceSnapshot; indexes: { "by-savedAt": number } };
}

const dbPromise = openDB<AetherGridDb>("aethergrid-db", 1, {
  upgrade(db) {
    const store = db.createObjectStore("workspaces", { keyPath: "id" });
    store.createIndex("by-savedAt", "savedAt");
  },
});

export const saveWorkspace = async (workspace: WorkspaceSnapshot): Promise<void> => {
  const db = await dbPromise;
  await db.put("workspaces", workspace);
};

export const listWorkspaces = async (): Promise<WorkspaceSnapshot[]> => {
  const db = await dbPromise;
  return (await db.getAllFromIndex("workspaces", "by-savedAt")).reverse();
};

export const deleteWorkspace = async (id: string): Promise<void> => {
  const db = await dbPromise;
  await db.delete("workspaces", id);
};
