import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
let api: typeof import("./publicGroups");
beforeAll(async () => {
  vi.stubGlobal("window", {
    location: { origin: "https://example.church.tools" },
  });
  api = await import("./publicGroups");
});
afterEach(() => {
  vi.restoreAllMocks();
});
const group = (id: number, children: number[] = []) => ({
  id,
  name: `Group ${id}`,
  children,
  canSignUp: false,
  information: { note: "" },
});
const homepage = () => ({
  id: 80,
  parentGroup: 6266,
  name: "Hidden root",
  groups: [
    group(6257, [6251, 2911]),
    group(6251, [6260, 6263, 9999]),
    group(2911, [6275]),
    group(6260),
    group(6263),
    group(6275),
    group(6269, [6272]),
    group(6272),
  ],
});

describe("homepage hierarchy", () => {
  it("builds only direct descendants of the selected entry, excluding other branches", () => {
    const groups = api.buildHierarchy(homepage());
    const root = groups.get(6257)!;
    expect(api.visibleChildren(root, groups).map((g) => g.id)).toEqual([
      6251, 2911,
    ]);
    expect(
      api.visibleChildren(groups.get(6251)!, groups).map((g) => g.id),
    ).toEqual([6260, 6263]);
    expect(api.childIds(groups.get(6260)!)).toEqual([]);
  });
  it("resolves hash-scoped ID paths with multiple hierarchy levels", () => {
    const groups = api.buildHierarchy(homepage());
    expect(
      api.resolveGroupPath(["6257", "6251", "6260"], groups).map((g) => g.id),
    ).toEqual([6257, 6251, 6260]);
    expect(api.resolveGroupPath("6257", groups).map((g) => g.id)).toEqual([
      6257,
    ]);
  });
  it("rejects unrelated branches and missing groups", () => {
    const groups = api.buildHierarchy(homepage());
    expect(() => api.resolveGroupPath(["6257", "6269"], groups)).toThrow(
      "gehört nicht",
    );
    expect(() => api.resolveGroupPath(["9999"], groups)).toThrow(
      "nicht verfügbar",
    );
  });
  it("rejects cyclic or invalid URL paths", () => {
    for (const value of [
      [],
      ["1", "1"],
      ["1", "abc"],
      ["0"],
      ["9007199254740992"],
    ])
      expect(() =>
        api.resolveGroupPath(value, api.buildHierarchy(homepage())),
      ).toThrow("ungültig");
  });
  it("filters self references and duplicate children", () => {
    expect(api.childIds(group(1, [1, 2, 2, -4, 3]))).toEqual([2, 3]);
  });
  it("rejects executable image URLs", () => {
    expect(api.safeImageUrl("javascript:alert(1)")).toBeUndefined();
    expect(api.safeImageUrl("data:text/html,test")).toBeUndefined();
    expect(api.safeImageUrl("/image.jpg")).toMatch(/^https:\/\//);
  });
});
describe("public homepage API", () => {
  it("fetches the whole homepage anonymously instead of individual groups", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ data: homepage() })));
    const result = await api.getGroupHomepage(
      "test-public-hash",
      undefined,
      true,
    );
    expect(result.groups).toHaveLength(8);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0]?.[0])).toContain(
      "/api/grouphomepages/test-public-hash",
    );
    expect(fetcher.mock.calls[0]?.[1]?.credentials).toBe("omit");
  });
  it("reports unavailable homepages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 404 }),
    );
    await expect(
      api.getGroupHomepage("missing-hash", undefined, true),
    ).rejects.toThrow("nicht öffentlich");
  });
  it("rejects malformed API data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { groups: [{ id: "1" }] } })),
    );
    await expect(
      api.getGroupHomepage("malformed-hash", undefined, true),
    ).rejects.toThrow("gültigen Homepage-Daten");
  });
  it("rejects malformed hashes before making an API call", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch");
    await expect(api.getGroupHomepage("../private")).rejects.toThrow(
      "ungültig",
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("inherited header image", () => {
  it("prefers the own image, then walks up to the nearest available parent image", () => {
    const root = {
      ...group(1, [2]),
      information: { imageUrl: "https://example.church.tools/root.jpg" },
    };
    const parent = group(2, [3]);
    const leaf = {
      ...group(3),
      information: { imageUrl: "https://example.church.tools/team.jpg" },
    };
    const groups = new Map([root, parent, leaf].map((g) => [g.id, g]));
    expect(api.inheritedGroupImage(leaf, groups)).toBe(
      "https://example.church.tools/team.jpg",
    );
    expect(
      api.inheritedGroupImage(
        leaf,
        groups,
        [root, parent],
        ["https://example.church.tools/team.jpg"],
      ),
    ).toBe("https://example.church.tools/root.jpg");
    leaf.information.imageUrl = "";
    expect(api.inheritedGroupImage(leaf, groups)).toBe(
      "https://example.church.tools/root.jpg",
    );
  });
  it("stops safely for cycles and missing images", () => {
    const groups = new Map(
      [group(1, [2]), group(2, [1])].map((g) => [g.id, g]),
    );
    expect(api.inheritedGroupImage(groups.get(2), groups)).toBeUndefined();
  });
});
