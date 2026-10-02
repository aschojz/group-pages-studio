import { baseUrl } from "./publicGroups";
import { validateConfig, type ExtensionConfig } from "./config";
export const extensionKey = import.meta.env.VITE_KEY || "group-pages-studio";
export const configCategory = "public-config";
const apiOrigin =
  import.meta.env.DEV && import.meta.env.VITE_BASE_URL ? "" : baseUrl;
export class ConfigApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export async function configRequest<T>(
  path: string,
  authenticated = false,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const csrfToken =
    authenticated && !["GET", "HEAD"].includes(method.toUpperCase())
      ? await configRequest<string>("/csrftoken", true)
      : undefined;
  if (csrfToken !== undefined && (typeof csrfToken !== "string" || !csrfToken))
    throw new ConfigApiError(
      502,
      "ChurchTools hat kein gültiges CSRF-Token geliefert.",
    );
  let response: Response;
  try {
    response = await fetch(`${apiOrigin}/api${path}`, {
      method,
      credentials: authenticated ? "same-origin" : "omit",
      headers: {
        Accept: "application/json",
        ...(csrfToken ? { "CSRF-Token": csrfToken } : {}),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ConfigApiError(0, "ChurchTools ist gerade nicht erreichbar.");
  }
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new ConfigApiError(
      response.status,
      result?.translatedMessage ||
        (response.status === 401
          ? "Bitte zuerst in ChurchTools anmelden."
          : response.status === 403
            ? "Für diesen Zugriff fehlen ChurchTools-Rechte."
            : response.status === 404
              ? "Die Extension ist auf dieser ChurchTools-Instanz noch nicht eingerichtet."
              : "Die Konfiguration konnte nicht verarbeitet werden."),
    );
  if (result === null)
    throw new ConfigApiError(
      502,
      "ChurchTools hat keine gültige Antwort geliefert.",
    );
  return result.data ?? result;
}
export interface ConfigLocation {
  moduleId: number;
  categoryId?: number;
  valueId?: number;
  config?: ExtensionConfig;
}
export async function loadConfigLocation(
  authenticated = false,
): Promise<ConfigLocation> {
  const modules = await configRequest<{ id: number; shorty: string }[]>(
    "/custommodules",
    authenticated,
  );
  const module = modules.find((m) => m.shorty === extensionKey);
  if (!module)
    throw new ConfigApiError(
      404,
      `Die Extension „${extensionKey}“ ist nicht installiert oder für dich nicht sichtbar.`,
    );
  const root = `/custommodules/${module.id}/customdatacategories`;
  const categories = await configRequest<{ id: number; shorty: string }[]>(
    root,
    authenticated,
  );
  const category = categories.find((c) => c.shorty === configCategory);
  if (!category) return { moduleId: module.id };
  const values = await configRequest<{ id: number; value: string }[]>(
    `${root}/${category.id}/customdatavalues`,
    authenticated,
  );
  const configs = values.flatMap((item) => {
    let raw: unknown;
    try {
      raw = JSON.parse(item.value);
    } catch {
      throw new ConfigApiError(
        422,
        "Die gespeicherte Konfiguration enthält ungültiges JSON.",
      );
    }
    if (
      raw &&
      typeof raw === "object" &&
      (raw as { key?: string }).key === "config"
    )
      return [
        {
          id: item.id,
          config: validateConfig((raw as { config: unknown }).config),
        },
      ];
    return [];
  });
  if (configs.length > 1)
    throw new ConfigApiError(
      409,
      "Es gibt mehrere Konfigurationen. Bitte die CCM-Einträge prüfen.",
    );
  return {
    moduleId: module.id,
    categoryId: category.id,
    valueId: configs[0]?.id,
    config: configs[0]?.config,
  };
}
export function permissionAllows(value: unknown, categoryId?: number): boolean {
  if (value === true) return true;
  const ids = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.values(value)
      : [];
  return ids.some(
    (id) =>
      Number(id) === -1 ||
      (categoryId !== undefined && Number(id) === categoryId),
  );
}
export async function adminAccess() {
  const user = await configRequest<{ id: number }>(
    "/whoami?only_allow_authenticated=true",
    true,
  );
  if (!user.id || user.id < 0)
    throw new ConfigApiError(401, "Bitte zuerst in ChurchTools anmelden.");
  const permissions = await configRequest<
    Record<string, Record<string, unknown>>
  >("/permissions/global", true);
  return { user, permissions: permissions[extensionKey] ?? {} };
}
export async function createConfigCategory(location: ConfigLocation) {
  const result = await configRequest<{ id: number }>(
    `/custommodules/${location.moduleId}/customdatacategories`,
    true,
    "POST",
    {
      customModuleId: location.moduleId,
      name: "Öffentliche Darstellung",
      shorty: configCategory,
      description: "Öffentliche Marken- und Designkonfiguration der Extension.",
    },
  );
  return { ...location, categoryId: result.id };
}
export async function saveConfig(
  location: ConfigLocation,
  value: ExtensionConfig,
) {
  if (!location.categoryId)
    throw new Error("Bitte zuerst die Konfigurationskategorie einrichten.");
  const config = validateConfig(value);
  const body = { value: JSON.stringify({ key: "config", config }) };
  const root = `/custommodules/${location.moduleId}/customdatacategories/${location.categoryId}/customdatavalues`;
  const result = await configRequest<{ id: number }>(
    location.valueId ? `${root}/${location.valueId}` : root,
    true,
    location.valueId ? "PUT" : "POST",
    location.valueId ? body : { ...body, dataCategoryId: location.categoryId },
  );
  return { ...location, valueId: result.id, config };
}
