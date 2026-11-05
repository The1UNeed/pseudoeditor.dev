import { openDB } from "idb";
import type { WorkspaceState } from "@pseudoeditor/workspace";
import { createDocument, createEmptyWorkspace, createFolder, migratePersistedWorkspace } from "@pseudoeditor/workspace";
import type { WorkspacePersistenceMode } from "@/lib/platform";

const DB_NAME = "igcse-pseudocode-workspace";
const STORE_NAME = "workspace";
const PRIMARY_KEY = "current";
const LEGACY_WORKSPACE_KEY = "igcse-pseudocode-workspace-v1";
const LEGACY_SOURCE_KEY = "igcse-editor-source-v2";
const RESET_WORKSPACE_ON_LOAD = process.env.NEXT_PUBLIC_RESET_WORKSPACE_ON_DEV === "1";
const DEV_RESET_SESSION_KEY = "igcse-reset-workspace-on-dev-applied";

interface WorkspaceStorageOptions {
  mode?: WorkspacePersistenceMode;
  syncToCloud?: boolean;
  getAuthToken?: () => Promise<string | null>;
  /**
   * The signed-in account's id. Cloud mode keeps this account's not-yet-synced edits in a device checkpoint so a
   * crash or closed tab between account syncs loses nothing; the checkpoint is never restored for another account.
   */
  checkpointOwner?: string | null;
  /** When saving: the edit time of the snapshot being written; only a checkpoint no newer than it is cleared. */
  editedAt?: number;
  /** Name of the folder that receives this device's versions when they can't replace the account's. */
  recoveredFolderName?: string;
}

interface CloudWorkspaceResponse {
  workspace: unknown | null;
}

function shouldResetWorkspaceForDevSession(): boolean {
  if (!RESET_WORKSPACE_ON_LOAD || typeof window === "undefined") {
    return false;
  }

  try {
    if (window.sessionStorage.getItem(DEV_RESET_SESSION_KEY) === "1") {
      return false;
    }

    window.sessionStorage.setItem(DEV_RESET_SESSION_KEY, "1");
    return true;
  } catch {
    return true;
  }
}

async function getDatabase() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    },
  });
}

const CHECKPOINT_KEY_PREFIX = "unsynced:";
const ACCOUNT_CACHE_KEY_PREFIX = "current:";
/** Accounts whose cloud copy could not be read this session; their account writes wait for a successful read. */
const unreadableCloudOwners = new Set<string>();

/** Signed-in accounts get their own device cache, so one student's files never appear in another's account. */
function deviceCacheKey(owner: string | null): string {
  return owner ? `${ACCOUNT_CACHE_KEY_PREFIX}${owner}` : PRIMARY_KEY;
}

async function readOwnCache(cacheKey: string, sampleSource: string): Promise<WorkspaceState | null> {
  const database = await getDatabase();
  const cached = await database.get(STORE_NAME, cacheKey);
  return cached ? migratePersistedWorkspace(cached, { sampleSource }) : null;
}

interface DeviceCheckpoint {
  owner: string;
  state: WorkspaceState;
  /** Wall-clock time of the last edit in `state` (covers deletions and settings, not just surviving nodes). */
  editedAt: number;
  /**
   * Fingerprint of the account snapshot these edits were made on top of (`null` when the account could not be read).
   * The checkpoint only replaces the account while the account is still that snapshot; otherwise its files are added
   * as copies.
   */
  baseVersion: number | null;
  /**
   * When (by this device's clock) the account was at `baseVersion`. Edits are compared against this rather than the
   * account's timestamps, so another device's clock skew can't hide this device's edits.
   */
  baseReadAt?: number | null;
  /** The tab that wrote it; other tabs never clear or rebase it (they can't know what it builds on). */
  tabId?: string;
}

/** Identifies this tab's checkpoints, so one tab's save never deletes or rebases another tab's unsynced work. */
const TAB_ID =
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** The account snapshot (its fingerprint) this tab last read or wrote, and when by this device's clock. */
const accountBaseVersions = new Map<string, { version: number; readAt: number }>();

/** True when every document in the checkpoint already has the same text in the account (nothing left to sync). */
function checkpointMatchesAccount(device: WorkspaceState, account: WorkspaceState): boolean {
  return Object.values(device.nodes).every((node) => {
    if (node.type !== "document") return true;
    const accountNode = account.nodes[node.id];
    return accountNode?.type === "document" && accountNode.source === node.source;
  });
}
/** Accounts whose recovered device edits were added as copies because the account changed meanwhile. */
const recoveredCopyOwners = new Set<string>();
export const RECOVERED_FOLDER_NAME = "From this device";

/** True once after a load that added this device's unsynced files as copies next to the account's own. */
export function takeRecoveredCopies(owner: string | null | undefined): boolean {
  if (!owner) return false;
  return recoveredCopyOwners.delete(owner);
}

/**
 * Keeps the account's workspace and adds, as copies in one folder, the documents this device changed: those edited
 * after `baseVersion` when it is known, else every document whose text differs from the account's.
 */
function mergeCheckpointAsCopies(
  account: WorkspaceState,
  device: WorkspaceState,
  editedAfter: number | null,
  folderName: string,
): WorkspaceState {
  let merged = account;
  let folderId: string | null = null;
  for (const node of Object.values(device.nodes)) {
    if (node.type !== "document") continue;
    const accountNode = account.nodes[node.id];
    if (accountNode?.type === "document" && accountNode.source === node.source) continue;
    if (editedAfter !== null && !(Date.parse(node.updatedAt) > editedAfter)) continue;
    if (!folderId) {
      merged = createFolder(merged, { name: folderName });
      folderId = Object.values(merged.nodes).find(
        (candidate) => candidate.type === "folder" && !account.nodes[candidate.id],
      )?.id ?? null;
      if (!folderId) break;
    }
    merged = createDocument(merged, { parentId: folderId, name: node.name, source: node.source });
  }
  return merged;
}

/**
 * Identifies an account snapshot by everything a student can change in it (files, folders, names, text, runtime data
 * files, syntax), so a deletion or settings change made elsewhere counts as a new version even when no file got newer.
 */
function accountFingerprint(state: WorkspaceState): number {
  const parts = Object.values(state.nodes)
    .map((node) =>
      [node.id, node.type, node.parentId ?? "", node.name, node.type === "document" ? node.source : "", node.updatedAt]
        .join("\u0000"),
    )
    .sort();
  for (const [fileName, lines] of Object.entries(state.virtualFiles ?? {}).sort(([a], [b]) => (a < b ? -1 : 1))) {
    parts.push(`file:${JSON.stringify([fileName, lines])}`);
  }
  parts.push(`syntax:${state.syntaxId}`);
  // FNV-1a over the sorted parts.
  let hash = 0x811c9dc5;
  for (const part of parts) {
    for (let index = 0; index < part.length; index += 1) {
      hash ^= part.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    hash ^= 0x1e;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Records edits that have not reached the account yet, on this device only. */
export async function saveDeviceCheckpoint(state: WorkspaceState, owner: string, editedAt: number): Promise<void> {
  const database = await getDatabase();
  const key = `${CHECKPOINT_KEY_PREFIX}${owner}`;
  const known = accountBaseVersions.get(owner);
  let baseVersion = known?.version ?? null;
  let baseReadAt = known?.readAt ?? null;
  if (unreadableCloudOwners.has(owner)) {
    // Edits made while the account can't be read build on whatever the existing checkpoint was based on.
    const existing = (await database.get(STORE_NAME, key)) as DeviceCheckpoint | undefined;
    baseVersion = typeof existing?.baseVersion === "number" ? existing.baseVersion : null;
    baseReadAt = typeof existing?.baseReadAt === "number" ? existing.baseReadAt : null;
  }
  const checkpoint: DeviceCheckpoint = { owner, state, editedAt, baseVersion, baseReadAt, tabId: TAB_ID };
  await database.put(STORE_NAME, checkpoint, key);
}

async function readDeviceCheckpoint(owner: string): Promise<DeviceCheckpoint | null> {
  const database = await getDatabase();
  const checkpoint = (await database.get(STORE_NAME, `${CHECKPOINT_KEY_PREFIX}${owner}`)) as DeviceCheckpoint | undefined;
  return checkpoint?.owner === owner && typeof checkpoint.editedAt === "number"
    ? { ...checkpoint, baseVersion: typeof checkpoint.baseVersion === "number" ? checkpoint.baseVersion : null }
    : null;
}

/** Clears the checkpoint only if nothing newer than `upToEditedAt` was recorded since (a newer edit stays safe). */
async function clearDeviceCheckpoint(
  owner: string,
  upToEditedAt = Number.POSITIVE_INFINITY,
  acknowledged?: { version: number; readAt: number },
  options: { anyTab?: boolean } = {},
): Promise<void> {
  const database = await getDatabase();
  const key = `${CHECKPOINT_KEY_PREFIX}${owner}`;
  // Compare and delete in one transaction so a checkpoint written in between is never lost.
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const found = (await transaction.store.get(key)) as DeviceCheckpoint | undefined;
  // Only this tab's own checkpoint (or one recovered on load, which this tab now owns) may be cleared or rebased.
  const checkpoint = found && (options.anyTab || !found.tabId || found.tabId === TAB_ID) ? found : undefined;
  if (checkpoint && checkpoint.editedAt <= upToEditedAt) {
    await transaction.store.delete(key);
  } else if (checkpoint && acknowledged && checkpoint.baseVersion !== null) {
    // Newer edits from this tab build on the snapshot the account just acknowledged: move their base forward so
    // they replay normally instead of looking like a change made elsewhere.
    await transaction.store.put(
      { ...checkpoint, baseVersion: acknowledged.version, baseReadAt: acknowledged.readAt },
      key,
    );
  }
  await transaction.done;
}

/** Account writes from this tab run one at a time, in order, so an older snapshot never lands after a newer one. */
let cloudWriteQueue: Promise<unknown> = Promise.resolve();
function enqueueCloudWrite<T>(write: () => Promise<T>): Promise<T> {
  const result = cloudWriteQueue.then(write, write);
  cloudWriteQueue = result.catch(() => undefined);
  return result;
}

/** Accounts whose loaded workspace still has to be written to the account (recovered edits, or an unread account). */
const accountSyncPendingOwners = new Set<string>();

/** True while this account's cloud copy couldn't be read this session (account writes are held). */
export function isAccountUnreachable(owner: string | null | undefined): boolean {
  return !!owner && unreadableCloudOwners.has(owner);
}

/** True once per load when the session must sync (and show the status of syncing) what was loaded. */
export function takeAccountSyncPending(owner: string | null | undefined): boolean {
  if (!owner) return false;
  return accountSyncPendingOwners.delete(owner);
}

export async function loadWorkspace(
  sampleSource: string,
  options: WorkspaceStorageOptions = {},
): Promise<WorkspaceState> {
  const mode = options.mode ?? (options.syncToCloud ? "cloud" : "local");

  if (mode === "memory") {
    return createEmptyWorkspace();
  }

  if (mode === "cloud") {
    const owner = options.checkpointOwner ?? null;
    const cacheKey = deviceCacheKey(owner);
    // Read the checkpoint before the cloud load overwrites the device cache.
    const checkpoint = owner ? await readDeviceCheckpoint(owner).catch(() => null) : null;
    const cloud = await loadWorkspaceFromCloud(sampleSource, options.getAuthToken, cacheKey);
    const restoreCheckpoint = async (current: DeviceCheckpoint) => {
      // Edits made after the last account sync (the tab closed or crashed first): keep them; the session syncs them
      // straight away through its normal save path, so success or failure shows in the save status.
      const restored = migratePersistedWorkspace(current.state, { sampleSource });
      const database = await getDatabase();
      await database.put(STORE_NAME, restored, cacheKey);
      // This tab now carries these edits, so its acknowledged sync may clear the checkpoint.
      await database.put(
        STORE_NAME,
        { ...current, state: restored, tabId: TAB_ID } satisfies DeviceCheckpoint,
        `${CHECKPOINT_KEY_PREFIX}${current.owner}`,
      );
      accountSyncPendingOwners.add(current.owner);
      return restored;
    };

    if (!cloud.ok) {
      if (!owner) {
        return migrateWorkspace(sampleSource);
      }
      // The account could not be read (offline, server error). Open only this account's own device copy, and hold
      // account writes until a read succeeds so a stale copy can never overwrite the real one.
      unreadableCloudOwners.add(owner);
      accountSyncPendingOwners.add(owner);
      if (checkpoint) return restoreCheckpoint(checkpoint);
      const ownCache = await readOwnCache(cacheKey, sampleSource);
      return ownCache ?? createEmptyWorkspace();
    }
    if (owner) unreadableCloudOwners.delete(owner);

    const cloudWorkspace = cloud.workspace;
    if (cloudWorkspace) {
      const accountVersion = accountFingerprint(cloudWorkspace);
      if (owner) accountBaseVersions.set(owner, { version: accountVersion, readAt: Date.now() });
      // Restored edits are not in the account until their sync lands, so later checkpoints must keep measuring from
      // when those edits began, not from this load (else a failed sync could let them be filtered out of recovery).
      const keepRestoredBase = (restoring: DeviceCheckpoint) => {
        if (owner) {
          accountBaseVersions.set(owner, {
            version: accountVersion,
            readAt: restoring.baseVersion === null ? 0 : (restoring.baseReadAt ?? 0),
          });
        }
      };
      if (checkpoint && checkpoint.baseVersion === accountVersion) {
        // The account hasn't changed since these edits began: they are simply its next version.
        keepRestoredBase(checkpoint);
        return restoreCheckpoint(checkpoint);
      }
      if (checkpoint) {
        // The account moved on elsewhere (or these edits were made while it couldn't be read): never overwrite it,
        // and never drop the device's work silently. Keep the account's version, add this device's changed files
        // beside it, and tell the student.
        const merged = mergeCheckpointAsCopies(
          cloudWorkspace,
          migratePersistedWorkspace(checkpoint.state, { sampleSource }),
          checkpoint.baseVersion === null ? null : (checkpoint.baseReadAt ?? null),
          options.recoveredFolderName ?? RECOVERED_FOLDER_NAME,
        );
        if (merged !== cloudWorkspace) {
          recoveredCopyOwners.add(checkpoint.owner);
          keepRestoredBase(checkpoint);
          return restoreCheckpoint({ ...checkpoint, state: merged });
        }
      }
      // A checkpoint the account already contains in full (its save landed but the reply never arrived) is done,
      // whichever tab wrote it. One that still differs is kept, so its work is never deleted.
      if (owner && checkpoint && checkpointMatchesAccount(checkpoint.state, cloudWorkspace)) {
        void clearDeviceCheckpoint(owner, checkpoint.editedAt, undefined, { anyTab: true }).catch(() => {});
      }
      return cloudWorkspace;
    }
    if (checkpoint) return restoreCheckpoint(checkpoint);

    // The account has no workspace yet. Only this account's own device copy may seed it: on a shared computer the
    // unscoped cache belongs to whoever used it before, so a new account starts empty instead.
    const seed = owner ? await readOwnCache(cacheKey, sampleSource) : await migrateWorkspace(sampleSource);
    if (!seed) {
      return createEmptyWorkspace();
    }
    const seedToken = options.getAuthToken ? await options.getAuthToken().catch(() => null) : null;
    void enqueueCloudWrite(() => saveWorkspaceToCloud(seed, async () => seedToken)).catch(() => {
      /* Keep local cache usable even when an initial cloud backfill fails. */
    });
    return seed;
  }

  return migrateWorkspace(sampleSource);
}

export async function saveWorkspace(
  state: WorkspaceState,
  options: WorkspaceStorageOptions = {},
): Promise<void> {
  const mode = options.mode ?? (options.syncToCloud ? "cloud" : "local");

  if (mode === "memory") {
    return;
  }

  const owner = mode === "cloud" ? (options.checkpointOwner ?? null) : null;
  if (mode !== "cloud") {
    const database = await getDatabase();
    await database.put(STORE_NAME, state, deviceCacheKey(owner));
    return;
  }

  // Before anything is awaited: ask for this account's sign-in token and take the next account-write slot. An
  // account switch or a slow token request after this point can neither redirect this save nor reorder it.
  const tokenRequest = options.getAuthToken ? options.getAuthToken() : Promise.resolve(null);
  tokenRequest.catch(() => {
    /* reported when the queued write awaits it */
  });
  let deviceWrite: Promise<void> = Promise.resolve();
  const accountWrite = enqueueCloudWrite(async () => {
    await deviceWrite;
    if (owner && unreadableCloudOwners.has(owner)) {
      throw new Error("Your account couldn't be reached, so changes are kept on this device. Reload to sync them.");
    }
    const token = await tokenRequest;
    await saveWorkspaceToCloud(state, async () => token);
    if (options.checkpointOwner) {
      // The account now holds edits up to this snapshot's own edit time (not the reply's arrival time), so edits
      // made while the request was in flight still count as newer than the acknowledged base.
      const acknowledged = { version: accountFingerprint(state), readAt: options.editedAt ?? Date.now() };
      accountBaseVersions.set(options.checkpointOwner, acknowledged);
      await clearDeviceCheckpoint(options.checkpointOwner, options.editedAt, acknowledged).catch(() => {});
    }
  });
  deviceWrite = (async () => {
    const database = await getDatabase();
    await database.put(STORE_NAME, state, deviceCacheKey(owner));
  })();
  await Promise.all([deviceWrite, accountWrite]);
}

export async function migrateWorkspace(sampleSource: string): Promise<WorkspaceState> {
  const database = await getDatabase();

  if (shouldResetWorkspaceForDevSession()) {
    const emptyWorkspace = createEmptyWorkspace();
    await database.put(STORE_NAME, emptyWorkspace, PRIMARY_KEY);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LEGACY_WORKSPACE_KEY);
      window.localStorage.removeItem(LEGACY_SOURCE_KEY);
    }
    return emptyWorkspace;
  }

  const persisted = await database.get(STORE_NAME, PRIMARY_KEY);
  const legacyWorkspaceRaw =
    typeof window !== "undefined" ? window.localStorage.getItem(LEGACY_WORKSPACE_KEY) : null;
  const legacySource =
    typeof window !== "undefined" ? window.localStorage.getItem(LEGACY_SOURCE_KEY) : null;

  let legacyWorkspace: unknown = null;
  if (legacyWorkspaceRaw) {
    try {
      legacyWorkspace = JSON.parse(legacyWorkspaceRaw);
    } catch {
      legacyWorkspace = null;
    }
  }

  const state =
    persisted || legacyWorkspace || legacySource
      ? migratePersistedWorkspace(persisted ?? legacyWorkspace, {
          sampleSource,
          legacySource,
        })
      : createEmptyWorkspace();

  if (!persisted) {
    await database.put(STORE_NAME, state, PRIMARY_KEY);
  }

  return state;
}

async function getCloudRequestHeaders(
  baseHeaders: HeadersInit,
  getAuthToken?: () => Promise<string | null>,
): Promise<HeadersInit> {
  const token = getAuthToken ? await getAuthToken() : null;
  if (!token) {
    return baseHeaders;
  }

  return {
    ...baseHeaders,
    Authorization: `Bearer ${token}`,
  };
}

/** `ok: false` means the account could not be read; `workspace: null` means the account has none yet. */
type CloudLoadResult = { ok: false } | { ok: true; workspace: WorkspaceState | null };

async function loadWorkspaceFromCloud(
  sampleSource: string,
  getAuthToken: (() => Promise<string | null>) | undefined,
  cacheKey: string,
): Promise<CloudLoadResult> {
  if (typeof window === "undefined") {
    return { ok: false };
  }

  try {
    const response = await fetch("/api/workspace", {
      method: "GET",
      credentials: "same-origin",
      headers: await getCloudRequestHeaders({
        Accept: "application/json",
      }, getAuthToken),
    });

    if (!response.ok) {
      return { ok: false };
    }

    const data = (await response.json()) as CloudWorkspaceResponse;
    if (!data.workspace) {
      return { ok: true, workspace: null };
    }

    const state = migratePersistedWorkspace(data.workspace, { sampleSource });
    const database = await getDatabase();
    await database.put(STORE_NAME, state, cacheKey);
    return { ok: true, workspace: state };
  } catch {
    return { ok: false };
  }
}

async function saveWorkspaceToCloud(
  state: WorkspaceState,
  getAuthToken?: () => Promise<string | null>,
): Promise<void> {
  const response = await fetch("/api/workspace", {
    method: "PUT",
    credentials: "same-origin",
    headers: await getCloudRequestHeaders({
      "Content-Type": "application/json",
    }, getAuthToken),
    body: JSON.stringify({ workspace: state }),
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const body = (await response.json()) as { error?: unknown };
      errorDetail = typeof body.error === "string" ? ` ${body.error}` : "";
    } catch {
      errorDetail = "";
    }

    throw new Error(`Unable to save workspace to Convex.${errorDetail}`);
  }
}
