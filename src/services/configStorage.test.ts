import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
let api: typeof import("./configStorage");
let defaults: typeof import("./config");
beforeAll(async () => {
  vi.stubGlobal("window", {
    location: { origin: "https://example.church.tools" },
  });
  api = await import("./configStorage");
  defaults = await import("./config");
});
afterEach(() => vi.unstubAllGlobals());
function reply(data: unknown) {
  return { ok: true, json: async () => ({ data }) };
}
function storageFetch(values: unknown[]) {
  return vi
    .fn()
    .mockResolvedValueOnce(reply([{ id: 3, shorty: "group-pages-studio" }]))
    .mockResolvedValueOnce(reply([{ id: 7, shorty: "public-config" }]))
    .mockResolvedValueOnce(reply(values));
}
describe("CCM configuration storage", () => {
  it("reads public configuration without an authenticated session", async () => {
    const fetch = storageFetch([
      {
        id: 9,
        value: JSON.stringify({
          key: "config",
          config: { brand: { name: "Test" } },
        }),
      },
    ]);
    vi.stubGlobal("fetch", fetch);
    expect(await api.loadConfigLocation()).toMatchObject({
      moduleId: 3,
      categoryId: 7,
      valueId: 9,
      config: { brand: { name: "Test" } },
    });
    expect(
      fetch.mock.calls.every((call) => call[1].credentials === "omit"),
    ).toBe(true);
  });
  it("creates one JSON value and updates that same value with the logged-in session", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(async (url: string) =>
        reply(url.endsWith("/csrftoken") ? "csrf-test" : { id: 9 }),
      );
    vi.stubGlobal("fetch", fetch);
    const created = await api.saveConfig(
      { moduleId: 3, categoryId: 7 },
      defaults.defaultConfig,
    );
    await api.saveConfig(created, defaults.defaultConfig);
    expect(fetch.mock.calls.map((call) => call[1].method)).toEqual([
      "GET",
      "POST",
      "GET",
      "PUT",
    ]);
    expect(fetch.mock.calls[3]![0]).toBe(
      "/api/custommodules/3/customdatacategories/7/customdatavalues/9",
    );
    expect(
      fetch.mock.calls.every((call) => call[1].credentials === "same-origin"),
    ).toBe(true);
    expect(fetch.mock.calls[1]![1].headers["CSRF-Token"]).toBe("csrf-test");
    expect(fetch.mock.calls[3]![1].headers["CSRF-Token"]).toBe("csrf-test");
    const body = JSON.parse(fetch.mock.calls[1]![1].body);
    expect(body.dataCategoryId).toBe(7);
    expect(JSON.parse(body.value)).toEqual({
      key: "config",
      config: defaults.defaultConfig,
    });
  });
  it("does not write when configuration is invalid or the category is missing", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(
      api.saveConfig({ moduleId: 3 }, defaults.defaultConfig),
    ).rejects.toThrow("einrichten");
    await expect(
      api.saveConfig(
        { moduleId: 3, categoryId: 7 },
        {
          ...defaults.defaultConfig,
          design: { ...defaults.defaultConfig.design, radius: -4 },
        },
      ),
    ).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects ambiguous or corrupted saved configuration", async () => {
    const value = JSON.stringify({
      key: "config",
      config: defaults.defaultConfig,
    });
    vi.stubGlobal(
      "fetch",
      storageFetch([
        { id: 1, value },
        { id: 2, value },
      ]),
    );
    await expect(api.loadConfigLocation()).rejects.toMatchObject({
      status: 409,
    });
    vi.stubGlobal("fetch", storageFetch([{ id: 1, value: "not json" }]));
    await expect(api.loadConfigLocation()).rejects.toMatchObject({
      status: 422,
    });
  });
  it("enforces category-scoped permission matching", () => {
    expect(api.permissionAllows([7], 7)).toBe(true);
    expect(api.permissionAllows([8], 7)).toBe(false);
    expect(api.permissionAllows([-1], 7)).toBe(true);
    expect(api.permissionAllows({ first: "7" }, 7)).toBe(true);
    expect(api.permissionAllows([7])).toBe(false);
    expect(api.permissionAllows(false, 7)).toBe(false);
  });
  it("does not continue to configuration requests when authentication fails", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    vi.stubGlobal("fetch", fetch);
    await expect(api.adminAccess()).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
