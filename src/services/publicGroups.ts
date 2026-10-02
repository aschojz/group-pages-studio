export interface PublicGroup {
  id: number;
  name: string;
  children?: number[];
  canSignUp: boolean;
  signUpHeadline?: string;
  autoAccept?: boolean;
  requestedWaitinglistSeatsCount?: number;
  settings?: { emailVerificationMode?: "all" | "existing" | "none" };
  signUpConditions?: {
    canSignUp?: boolean;
    canSignUpAsNewPerson?: boolean;
    groupIsActive?: boolean;
    groupIsOpenForMembers?: boolean;
    groupIsNotFull?: boolean;
    groupHasSpaceForRequests?: boolean;
    groupAllowsWaitinglist?: boolean;
    groupHasSpaceOnWaitinglist?: boolean;
    endDateNotPassed?: boolean;
  };
  information: {
    note?: string;
    imageUrl?: string | null;
    imageAnnotation?: string | null;
    meetingTime?: string | null;
    weekday?: { name: string } | null;
    groupCategory?: { name: string } | null;
    campus?: { name: string } | null;
    targetGroup?: { name: string } | null;
    ageGroups?: { name: string }[];
    leader?: {
      domainIdentifier: string;
      title: string;
      imageUrl?: string | null;
      initials?: string;
    }[];
    groupPlaces?: {
      id: number;
      name?: string | null;
      meetingAt?: string | null;
      street?: string | null;
      zip?: string | null;
      city?: string | null;
      addition?: string | null;
    }[];
  };
}

export class GroupError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const settings = (window as Window & { settings?: { base_url?: string } })
  .settings;
export const baseUrl = (
  settings?.base_url ||
  import.meta.env.VITE_BASE_URL ||
  window.location.origin
).replace(/\/$/, "");
export const isDemo = import.meta.env.VITE_DEMO === "true";

export function parseGroupId(value: unknown): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function childIds(group: PublicGroup): number[] {
  return [...new Set(group.children ?? [])].filter(
    (id) => Number.isSafeInteger(id) && id > 0 && id !== group.id,
  );
}

export function safeImageUrl(value?: string | null): string | undefined {
  if (!value) return;
  try {
    const url = new URL(value, baseUrl + "/");
    if (["https:", "http:"].includes(url.protocol)) return url.href;
  } catch {
    /* Invalid image is represented by the visual fallback. */
  }
}

export function inheritedGroupImage(
  group: PublicGroup | undefined,
  groups: Map<number, PublicGroup>,
  ancestors: PublicGroup[] = [],
  failedUrls: string[] = [],
): string | undefined {
  const visited = new Set<number>();
  let current = group;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const image = safeImageUrl(current.information.imageUrl);
    if (image && !failedUrls.includes(image)) return image;
    const childId = current.id;
    // Prefer the selected URL branch when a group has multiple parents.
    current =
      [...ancestors]
        .reverse()
        .find((parent) => childIds(parent).includes(childId)) ??
      [...groups.values()].find((parent) => childIds(parent).includes(childId));
  }
}

export interface GroupHomepage {
  id: number;
  parentGroup: number;
  name: string;
  groups: PublicGroup[];
}

export function buildHierarchy(
  homepage: GroupHomepage,
): Map<number, PublicGroup> {
  return new Map(homepage.groups.map((group) => [group.id, group]));
}

export function resolveGroupPath(
  value: unknown,
  groups: Map<number, PublicGroup>,
): PublicGroup[] {
  const segments = Array.isArray(value) ? value : [value];
  const ids = segments.map(parseGroupId);
  if (
    !ids.length ||
    ids.some((id) => id === null) ||
    new Set(ids).size !== ids.length
  ) {
    throw new Error("Dieser Gruppenpfad ist ungültig.");
  }
  const path: PublicGroup[] = [];
  for (const id of ids) {
    const group = groups.get(id!);
    if (!group)
      throw new GroupError(
        404,
        "Diese Gruppe ist auf dieser Homepage nicht verfügbar.",
      );
    const parent = path[path.length - 1];
    if (parent && !childIds(parent).includes(id!))
      throw new Error("Diese Gruppe gehört nicht zum angegebenen Gruppenpfad.");
    path.push(group);
  }
  return path;
}

export function visibleChildren(
  group: PublicGroup,
  groups: Map<number, PublicGroup>,
): PublicGroup[] {
  return childIds(group).flatMap((id) => {
    const child = groups.get(id);
    return child ? [child] : [];
  });
}

const cache = new Map<string, { time: number; homepage: GroupHomepage }>();
export async function getGroupHomepage(
  hash: unknown,
  signal?: AbortSignal,
  force = false,
): Promise<GroupHomepage> {
  if (typeof hash !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(hash))
    throw new Error("Dieser Homepage-Link ist ungültig.");
  if (isDemo && hash === "demo") {
    const { demoGroups } = await import("../demo/groups");
    return {
      id: 0,
      parentGroup: 0,
      name: "Designvorschau",
      groups: demoGroups,
    };
  }
  const stored = cache.get(hash);
  if (!force && stored && Date.now() - stored.time < 60000)
    return stored.homepage;
  let response: Response;
  try {
    // A local Vite proxy avoids CORS; production reads from the ChurchTools origin.
    const apiOrigin =
      import.meta.env.DEV && import.meta.env.VITE_BASE_URL ? "" : baseUrl;
    response = await fetch(
      `${apiOrigin}/api/grouphomepages/${encodeURIComponent(hash)}`,
      {
        credentials: "omit",
        signal,
        headers: { Accept: "application/json" },
      },
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new GroupError(
      0,
      "Die Verbindung zu ChurchTools ist gerade nicht möglich. Bitte versuche es erneut.",
    );
  }
  if (!response.ok)
    throw new GroupError(
      response.status,
      [403, 404].includes(response.status)
        ? "Diese Gruppen-Homepage ist nicht öffentlich verfügbar."
        : "Die Gruppen-Homepage konnte gerade nicht geladen werden.",
    );
  let data: GroupHomepage;
  try {
    data = (await response.json()).data;
  } catch {
    throw new GroupError(
      502,
      "ChurchTools hat keine gültigen Homepage-Daten geliefert.",
    );
  }
  if (
    !data ||
    !Array.isArray(data.groups) ||
    !data.groups.every(
      (group) =>
        Number.isSafeInteger(group.id) &&
        group.id > 0 &&
        typeof group.name === "string" &&
        group.information &&
        (group.children === undefined ||
          (Array.isArray(group.children) &&
            group.children.every((id) => Number.isSafeInteger(id) && id > 0))),
    )
  ) {
    throw new GroupError(
      502,
      "ChurchTools hat keine gültigen Homepage-Daten geliefert.",
    );
  }
  cache.set(hash, { time: Date.now(), homepage: data });
  return data;
}
