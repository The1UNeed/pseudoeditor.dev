import { openDB } from "idb";
import type { WorkspaceState } from "@pseudoeditor/workspace";
import {
  createDocument,
  createEmptyWorkspace,
  createFolder,
  migratePersistedWorkspace,
  updateVirtualFiles,
} from "@pseudoeditor/workspace";
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
  /** Name of the folder that receives the files written before signing in. */
  guestFolderName?: string;
}

interface CloudWorkspaceResponse {
  workspace: unknown | null;
  /** The account's server revision (`null`: no workspace yet). Missing from older servers. */
  revision?: number | null;
}

/** The account changed (another tab or device saved) since this tab last read or wrote it. */
export class WorkspaceConflictError extends Error {
  constructor() {
    super("The workspace changed in another tab or on another device.");
    this.name = "WorkspaceConflictError";
  }
}

export function isWorkspaceConflictError(error: unknown): boolean {
  return error instanceof Error && error.name === "WorkspaceConflictError";
}

/** The account refused the workspace for being over a size limit; `message` says which limit. */
export class WorkspaceTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceTooLargeError";
  }
}

/** The limit a save went over (the server's own wording), or null when the error is something else. */
export function getWorkspaceTooLargeDetail(error: unknown): string | null {
  return error instanceof Error && error.name === "WorkspaceTooLargeError" ? error.message : null;
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
const GUEST_DRAFT_SESSION_KEY = "pseudoeditor-guest-draft";
export const GUEST_FOLDER_NAME = "Guest";
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

/** Each tab keeps its own checkpoint, so two tabs with unsynced edits never overwrite each other's. */
function ownCheckpointKey(owner: string): string {
  return `${CHECKPOINT_KEY_PREFIX}${owner}:${TAB_ID}`;
}

/** The server revision this tab last read or wrote, per device cache key. Absent: unknown (older server). */
const accountRevisions = new Map<string, number | null>();

/** The account snapshot (its fingerprint) this tab last read or wrote, and when by this device's clock. */
const accountBaseVersions = new Map<string, { version: number; readAt: number }>();

function sameLines(a: string[] | undefined, b: string[]): boolean {
  return !!a && a.length === b.length && a.every((line, index) => line === b[index]);
}

/**
 * True when every document in the checkpoint already has the same text in the account, and every data file the same
 * contents (nothing left to sync).
 */
function checkpointMatchesAccount(device: WorkspaceState, account: WorkspaceState): boolean {
  const documentsMatch = Object.values(device.nodes).every((node) => {
    if (node.type !== "document") return true;
    const accountNode = account.nodes[node.id];
    return accountNode?.type === "document" && accountNode.source === node.source;
  });
  return (
    documentsMatch &&
    Object.entries(device.virtualFiles ?? {}).every(([name, lines]) => sameLines(account.virtualFiles?.[name], lines))
  );
}

/**
 * Adds the device's data files (files programs read and write, which students can also edit) that `merged` lacks or
 * holds with other contents. A differing one is added under a distinct name, so neither version is overwritten.
 */
function mergeVirtualFilesAsCopies(merged: WorkspaceState, device: WorkspaceState, label: string): WorkspaceState {
  const files = { ...merged.virtualFiles };
  let changed = false;
  for (const [name, lines] of Object.entries(device.virtualFiles ?? {})) {
    if (sameLines(files[name], lines)) continue;
    let target = name;
    if (files[name]) {
      const dot = name.lastIndexOf(".");
      const stem = dot > 0 ? name.slice(0, dot) : name;
      const extension = dot > 0 ? name.slice(dot) : "";
      for (let attempt = 1; ; attempt += 1) {
        target = `${stem} (${attempt === 1 ? label : `${label} ${attempt}`})${extension}`;
        if (!files[target] || sameLines(files[target], lines)) break;
      }
      if (files[target]) continue; // already copied on an earlier recovery
    }
    // Never dropped, even past the save limit: the work then stays on this device and the student is told why the
    // account sync is paused.
    files[target] = [...lines];
    changed = true;
  }
  return changed ? updateVirtualFiles(merged, files) : merged;
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
    if (editedAfter !== null && !(Date.parse(node.updatedAt) >= editedAfter)) continue;
    if (!folderId) {
      merged = createFolder(merged, { name: folderName });
      folderId = Object.values(merged.nodes).find(
        (candidate) => candidate.type === "folder" && !account.nodes[candidate.id],
      )?.id ?? null;
      if (!folderId) break;
    }
    merged = createDocument(merged, { parentId: folderId, name: node.name, source: node.source });
  }
  return mergeVirtualFilesAsCopies(merged, device, folderName);
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
  const known = accountBaseVersions.get(owner);
  let baseVersion = known?.version ?? null;
  let baseReadAt = known?.readAt ?? null;
  if (unreadableCloudOwners.has(owner)) {
    // Edits made while the account can't be read build on whatever the existing checkpoint was based on.
    const existing = (await database.get(STORE_NAME, ownCheckpointKey(owner))) as DeviceCheckpoint | undefined;
    baseVersion = typeof existing?.baseVersion === "number" ? existing.baseVersion : null;
    baseReadAt = typeof existing?.baseReadAt === "number" ? existing.baseReadAt : null;
  }
  const checkpoint: DeviceCheckpoint = { owner, state, editedAt, baseVersion, baseReadAt, tabId: TAB_ID };
  await database.put(STORE_NAME, checkpoint, ownCheckpointKey(owner));
}

type StoredCheckpoint = DeviceCheckpoint & { key: string };

/** Every tab's checkpoint for this account (and the single pre-per-tab one), newest edit first. */
async function readDeviceCheckpoints(owner: string): Promise<StoredCheckpoint[]> {
  const database = await getDatabase();
  const legacyKey = `${CHECKPOINT_KEY_PREFIX}${owner}`;
  const keys = (await database.getAllKeys(STORE_NAME)).filter(
    (key): key is string => typeof key === "string" && (key === legacyKey || key.startsWith(`${legacyKey}:`)),
  );
  const checkpoints: StoredCheckpoint[] = [];
  for (const key of keys) {
    const checkpoint = (await database.get(STORE_NAME, key)) as DeviceCheckpoint | undefined;
    if (checkpoint?.owner === owner && typeof checkpoint.editedAt === "number") {
      checkpoints.push({
        ...checkpoint,
        baseVersion: typeof checkpoint.baseVersion === "number" ? checkpoint.baseVersion : null,
        key,
      });
    }
  }
  return checkpoints.sort((a, b) => b.editedAt - a.editedAt);
}

/** Clears the checkpoint only if nothing newer than `upToEditedAt` was recorded since (a newer edit stays safe). */
async function clearDeviceCheckpoint(
  owner: string,
  upToEditedAt = Number.POSITIVE_INFINITY,
  acknowledged?: { version: number; readAt: number },
  options: { anyTab?: boolean; key?: string } = {},
): Promise<void> {
  const database = await getDatabase();
  const key = options.key ?? ownCheckpointKey(owner);
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

/** The account load running for each device cache key, shared by overlapping callers. */
const inFlightCloudLoads = new Map<string, Promise<WorkspaceState>>();

/** Accounts that just received the files a guest wrote before signing in. */
const guestImportOwners = new Set<string>();

/** True once after a load that added the files written before signing in. */
export function takeGuestImported(owner: string | null | undefined): boolean {
  if (!owner) return false;
  return guestImportOwners.delete(owner);
}

/**
 * Keeps a signed-out student's work for this tab (it survives a sign-in redirect), so signing in to save it adds it
 * to the account instead of dropping it. Each stash adds to the earlier one (a guest who moves between practice
 * questions keeps every answer); a document in both keeps its latest version. An empty workspace changes nothing.
 */
export function stashGuestDraft(state: WorkspaceState, copyLabel = GUEST_FOLDER_NAME): void {
  if (typeof window === "undefined") return;
  const hasWork =
    Object.values(state.nodes).some((node) => node.type === "document" && node.source.trim() !== "") ||
    Object.values(state.virtualFiles ?? {}).some((lines) => lines.some((line) => line.trim() !== ""));
  if (!hasWork) return;
  try {
    const earlierText = window.sessionStorage.getItem(GUEST_DRAFT_SESSION_KEY);
    const earlier = earlierText ? parseGuestDraft(earlierText, "") : null;
    let combined = state;
    if (earlier) {
      for (const node of Object.values(earlier.nodes)) {
        if (node.type !== "document" || combined.nodes[node.id] || node.source.trim() === "") continue;
        combined = createDocument(combined, { id: node.id, name: node.name, source: node.source, now: node.updatedAt });
      }
      // Each guest visit starts a fresh workspace, so a same-named data file with other contents is earlier work
      // (e.g. another question's results.txt): keep it as a copy rather than lose it.
      combined = mergeVirtualFilesAsCopies(combined, earlier, copyLabel);
    }
    window.sessionStorage.setItem(GUEST_DRAFT_SESSION_KEY, JSON.stringify(combined));
  } catch {
    /* storage blocked or full: nothing more can be kept */
  }
}

function readGuestDraftText(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(GUEST_DRAFT_SESSION_KEY);
  } catch {
    return null;
  }
}

function parseGuestDraft(text: string, sampleSource: string): WorkspaceState | null {
  try {
    return migratePersistedWorkspace(JSON.parse(text), { sampleSource });
  } catch {
    return null;
  }
}

/** Clears the stashed draft only if it is still the one that was imported (newer guest work stays for later). */
function clearGuestDraft(imported: string): void {
  try {
    if (window.sessionStorage.getItem(GUEST_DRAFT_SESSION_KEY) === imported) {
      window.sessionStorage.removeItem(GUEST_DRAFT_SESSION_KEY);
    }
  } catch {
    /* nothing to clear */
  }
}

/** The account most recently asked to load; only its load may take the guest's draft. */
let latestCloudLoadOwner: string | null = null;

/** Adds the files written before signing in to the account's workspace, safe on this device until they sync. */
async function importGuestDraft(
  loaded: WorkspaceState,
  owner: string,
  draftText: string | null,
  sampleSource: string,
  cacheKey: string,
  folderName: string,
): Promise<WorkspaceState> {
  // A load abandoned for another account or for signing out leaves the draft to whoever is current.
  if (!draftText || owner !== latestCloudLoadOwner) return loaded;
  const draft = parseGuestDraft(draftText, sampleSource);
  if (!draft) return loaded;
  const merged = mergeCheckpointAsCopies(loaded, draft, null, folderName);
  if (merged !== loaded) {
    const database = await getDatabase();
    await database.put(STORE_NAME, merged, cacheKey);
    // The checkpoint keeps the imported files if the tab closes before the account sync lands.
    await saveDeviceCheckpoint(merged, owner, Date.now());
    accountSyncPendingOwners.add(owner);
    guestImportOwners.add(owner);
  }
  // Superseded while writing: the files are safe in this account's checkpoint, and stay stashed for the current one.
  if (owner === latestCloudLoadOwner) clearGuestDraft(draftText);
  return merged;
}

export async function loadWorkspace(
  sampleSource: string,
  options: WorkspaceStorageOptions = {},
): Promise<WorkspaceState> {
  const mode = options.mode ?? (options.syncToCloud ? "cloud" : "local");
  // Signing out (or any non-account load) supersedes an account load still running.
  if (mode !== "cloud") latestCloudLoadOwner = null;

  if (mode === "memory") {
    return createEmptyWorkspace();
  }

  if (mode === "cloud") {
    const owner = options.checkpointOwner ?? null;
    const cacheKey = deviceCacheKey(owner);
    latestCloudLoadOwner = owner;
    // Recovery and guest import move work between stores, so two loads of one account must never interleave (e.g.
    // leaving the editor and coming back before the first load finished): later callers share the running load.
    const running = inFlightCloudLoads.get(cacheKey);
    if (running) return running;
    // The draft as it was when this load began: guest work written later is never taken by this load.
    const draftText = readGuestDraftText();
    const load = (async () => {
      const loaded = await loadCloudWorkspace(sampleSource, options);
      return owner
        ? importGuestDraft(loaded, owner, draftText, sampleSource, cacheKey, options.guestFolderName ?? GUEST_FOLDER_NAME)
        : loaded;
    })().finally(() => inFlightCloudLoads.delete(cacheKey));
    inFlightCloudLoads.set(cacheKey, load);
    return load;
  }

  return migrateWorkspace(sampleSource);
}

async function loadCloudWorkspace(sampleSource: string, options: WorkspaceStorageOptions): Promise<WorkspaceState> {
  const owner = options.checkpointOwner ?? null;
  const cacheKey = deviceCacheKey(owner);
  const folderName = options.recoveredFolderName ?? RECOVERED_FOLDER_NAME;
  // Read the checkpoints before the cloud load overwrites the device cache.
  const checkpoints = owner ? await readDeviceCheckpoints(owner).catch(() => []) : [];
  const checkpoint = checkpoints[0] ?? null;
  const otherCheckpoints = checkpoints.slice(1);
  const cloud = await loadWorkspaceFromCloud(sampleSource, options.getAuthToken, cacheKey, owner);
  /** Adds the files other (closed) tabs changed but never synced, as copies, so none of their work is dropped. */
  const foldOtherCheckpoints = (state: WorkspaceState) => {
    let merged = state;
    for (const other of otherCheckpoints) {
      const otherState = migratePersistedWorkspace(other.state, { sampleSource });
      if (checkpointMatchesAccount(otherState, merged)) continue;
      merged = mergeCheckpointAsCopies(
        merged,
        otherState,
        other.baseVersion === null ? null : (other.baseReadAt ?? null),
        folderName,
      );
    }
    if (merged !== state) recoveredCopyOwners.add(otherCheckpoints[0]!.owner);
    return merged;
  };
  const restoreCheckpoint = async (current: DeviceCheckpoint, alreadyFolded = false) => {
    // Edits made after the last account sync (the tab closed or crashed first): keep them; the session syncs them
    // straight away through its normal save path, so success or failure shows in the save status.
    const migrated = migratePersistedWorkspace(current.state, { sampleSource });
    const restored = alreadyFolded ? migrated : foldOtherCheckpoints(migrated);
    const database = await getDatabase();
    await database.put(STORE_NAME, restored, cacheKey);
    // This tab now carries these edits (its own and any it adopted from other tabs' checkpoints), so its
    // acknowledged sync may clear them.
    const { owner: checkpointOwner, editedAt, baseVersion, baseReadAt } = current;
    const ownKey = ownCheckpointKey(checkpointOwner);
    await database.put(
      STORE_NAME,
      {
        owner: checkpointOwner,
        state: restored,
        editedAt: Math.max(editedAt, ...otherCheckpoints.map((other) => other.editedAt)),
        baseVersion,
        baseReadAt,
        tabId: TAB_ID,
      } satisfies DeviceCheckpoint,
      ownKey,
    );
    for (const adopted of checkpoints) {
      if (adopted.key === ownKey) continue;
      // Delete only the version that was read: a tab still open may have checkpointed newer work since, which then
      // stays for the next load.
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const stillStored = (await transaction.store.get(adopted.key)) as DeviceCheckpoint | undefined;
      if (stillStored && stillStored.editedAt === adopted.editedAt) await transaction.store.delete(adopted.key);
      await transaction.done;
    }
    accountSyncPendingOwners.add(checkpointOwner);
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
    // Other tabs' unsynced files the account doesn't have yet are added as copies (their checkpoints are adopted).
    const folded = otherCheckpoints.length > 0 ? foldOtherCheckpoints(cloudWorkspace) : cloudWorkspace;
    if (owner && folded !== cloudWorkspace) {
      // Measure from the oldest edits folded in (not from now), so a failed sync followed by a change elsewhere
      // still recovers every copy made here.
      const foldedBaseReadAt = Math.min(
        ...otherCheckpoints.map((other) => (other.baseVersion === null ? 0 : (other.baseReadAt ?? 0))),
      );
      accountBaseVersions.set(owner, { version: accountVersion, readAt: foldedBaseReadAt });
      return restoreCheckpoint(
        { owner, state: folded, editedAt: 0, baseVersion: accountVersion, baseReadAt: foldedBaseReadAt },
        true,
      );
    }
    // A checkpoint the account already contains in full (its save landed but the reply never arrived) is done,
    // whichever tab wrote it. One that still differs is kept, so its work is never deleted.
    if (owner) {
      for (const done of checkpoints) {
        if (checkpointMatchesAccount(done.state, cloudWorkspace)) {
          void clearDeviceCheckpoint(owner, done.editedAt, undefined, { anyTab: true, key: done.key }).catch(() => {});
        }
      }
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
  void enqueueCloudWrite(() => saveWorkspaceToCloud(seed, async () => seedToken, cacheKey, owner)).catch(() => {
    /* Keep local cache usable even when an initial cloud backfill fails. */
  });
  return seed;
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
    await saveWorkspaceToCloud(state, async () => token, deviceCacheKey(owner), owner);
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
  getAuthToken: (() => Promise<string | null>) | undefined,
  owner: string | null,
): Promise<HeadersInit> {
  const token = getAuthToken ? await getAuthToken() : null;
  return {
    ...baseHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // The account this request was made for: after an account switch the sign-in belongs to someone else, and the
    // server refuses rather than read or write the other account's workspace.
    ...(owner ? { "X-Workspace-Account": owner } : {}),
  };
}

/** `ok: false` means the account could not be read; `workspace: null` means the account has none yet. */
type CloudLoadResult = { ok: false } | { ok: true; workspace: WorkspaceState | null };

async function loadWorkspaceFromCloud(
  sampleSource: string,
  getAuthToken: (() => Promise<string | null>) | undefined,
  cacheKey: string,
  owner: string | null,
): Promise<CloudLoadResult> {
  if (typeof window === "undefined") {
    return { ok: false };
  }

  // Reads wait behind this tab's queued account writes: a fresh revision must never be handed to a save that was
  // requested (and built) before the read, or that save could overwrite the newer version it never saw.
  return enqueueCloudWrite(() => readWorkspaceFromCloud(sampleSource, getAuthToken, cacheKey, owner));
}

async function readWorkspaceFromCloud(
  sampleSource: string,
  getAuthToken: (() => Promise<string | null>) | undefined,
  cacheKey: string,
  owner: string | null,
): Promise<CloudLoadResult> {
  try {
    const response = await fetch("/api/workspace", {
      method: "GET",
      credentials: "same-origin",
      headers: await getCloudRequestHeaders({
        Accept: "application/json",
      }, getAuthToken, owner),
    });

    if (!response.ok) {
      return { ok: false };
    }

    const data = (await response.json()) as CloudWorkspaceResponse;
    if (data.revision === null || typeof data.revision === "number") {
      accountRevisions.set(cacheKey, data.revision);
    } else {
      accountRevisions.delete(cacheKey);
    }
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
  getAuthToken: (() => Promise<string | null>) | undefined,
  cacheKey: string,
  owner: string | null,
): Promise<void> {
  // Writes only over the revision this tab last saw; account writes are queued, so this is the latest one.
  const expectedRevision = accountRevisions.get(cacheKey);
  const response = await fetch("/api/workspace", {
    method: "PUT",
    credentials: "same-origin",
    headers: await getCloudRequestHeaders({
      "Content-Type": "application/json",
    }, getAuthToken, owner),
    body: JSON.stringify(
      accountRevisions.has(cacheKey) ? { workspace: state, expectedRevision } : { workspace: state },
    ),
  });

  if (response.status === 409) {
    throw new WorkspaceConflictError();
  }

  if (response.ok) {
    try {
      const body = (await response.json()) as { revision?: unknown };
      if (typeof body.revision === "number") accountRevisions.set(cacheKey, body.revision);
    } catch {
      /* an older server sends no revision */
    }
    return;
  }

  let errorDetail = "";
  try {
    const body = (await response.json()) as { error?: unknown };
    errorDetail = typeof body.error === "string" ? ` ${body.error}` : "";
  } catch {
    errorDetail = "";
  }

  if (response.status === 413) {
    throw new WorkspaceTooLargeError(errorDetail.trim());
  }

  throw new Error(`Unable to save workspace to Convex.${errorDetail}`);
}
