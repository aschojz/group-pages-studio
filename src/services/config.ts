import { reactive, readonly } from "vue";

export interface ExtensionConfig {
  brand: {
    name: string;
    logoUrl: string;
    websiteLabel: string;
    websiteUrl: string;
    headerText: string;
    footerText: string;
    imprintUrl: string;
    privacyUrl: string;
  };
  design: {
    background: string;
    text: string;
    surface: string;
    accent: string;
    highlight: string;
    font: "Montserrat" | "system";
    logoInvert: boolean;
    contentWidth: number;
    headerHeight: number;
    logoWidth: number;
    sectionSpacing: number;
    buttonPaddingY: number;
    buttonBorder: number;
    radius: number;
  };
}
export const defaultConfig: ExtensionConfig = {
  brand: {
    name: "Weihnachten neu erleben",
    logoUrl: "/logo",
    websiteLabel: "Zur WNE-Website",
    websiteUrl: "https://weihnachten-neu-erleben.de/",
    headerText: "GEMEINSAM MÖGLICH MACHEN",
    footerText: "Viele Menschen. Eine gemeinsame Geschichte.",
    imprintUrl: "https://weihnachten-neu-erleben.de/impressum/",
    privacyUrl: "https://weihnachten-neu-erleben.de/datenschutz/",
  },
  design: {
    background: "#000000",
    text: "#ffffff",
    surface: "#141c31",
    accent: "#6cc0e4",
    highlight: "#e3bc65",
    font: "Montserrat",
    logoInvert: true,
    contentWidth: 1440,
    headerHeight: 80,
    logoWidth: 180,
    sectionSpacing: 65,
    buttonPaddingY: 10,
    buttonBorder: 2,
    radius: 0,
  },
};
export function cloneConfig(
  config: ExtensionConfig = defaultConfig,
): ExtensionConfig {
  return JSON.parse(JSON.stringify(config));
}
const state = reactive(cloneConfig());
export const config = readonly(state);
export function safeConfigUrl(value: string): boolean {
  if (value === "") return true;
  try {
    return ["https:", "http:"].includes(
      new URL(value, "https://example.org/").protocol,
    );
  } catch {
    return false;
  }
}
export function validateConfig(value: unknown): ExtensionConfig {
  if (!value || typeof value !== "object")
    throw new Error("Die Konfiguration ist kein gültiges Objekt.");
  const input = value as ExtensionConfig;
  const result = cloneConfig();
  for (const key of Object.keys(
    result.brand,
  ) as (keyof ExtensionConfig["brand"])[]) {
    const v = input.brand?.[key];
    if (v === undefined) continue;
    if (typeof v !== "string" || v.length > 500)
      throw new Error(`Ungültiger Markenwert: ${key}.`);
    if (key.endsWith("Url") && !safeConfigUrl(v))
      throw new Error(
        "Links und Logos müssen eine gültige HTTP- oder HTTPS-Adresse verwenden.",
      );
    result.brand[key] = v.trim();
  }
  if (!result.brand.name) throw new Error("Bitte einen Namen angeben.");
  for (const key of [
    "background",
    "text",
    "surface",
    "accent",
    "highlight",
  ] as const) {
    const v = input.design?.[key];
    if (v === undefined) continue;
    if (typeof v !== "string" || !/^#[a-f\d]{6}$/i.test(v))
      throw new Error("Farben müssen im Format #RRGGBB angegeben werden.");
    result.design[key] = v;
  }
  const logoInvert = input.design?.logoInvert;
  if (logoInvert !== undefined) {
    if (typeof logoInvert !== "boolean")
      throw new Error("Logo invertieren muss ein Ja/Nein-Wert sein.");
    result.design.logoInvert = logoInvert;
  }
  const font = input.design?.font;
  if (font !== undefined) {
    if (!["Montserrat", "system"].includes(font))
      throw new Error("Diese Schrift wird nicht unterstützt.");
    result.design.font = font;
  }
  const ranges = {
    contentWidth: [800, 1920],
    headerHeight: [60, 160],
    logoWidth: [80, 300],
    sectionSpacing: [24, 120],
    buttonPaddingY: [6, 24],
    buttonBorder: [1, 4],
    radius: [0, 24],
  };
  for (const key of Object.keys(ranges) as (keyof typeof ranges)[]) {
    const v = input.design?.[key];
    if (v === undefined) continue;
    const [min, max] = ranges[key];
    if (typeof v !== "number" || !Number.isFinite(v) || v < min! || v > max!)
      throw new Error(`Ungültiger Designwert: ${key}.`);
    result.design[key] = v;
  }
  return result;
}
export function themeVariables(value: ExtensionConfig): Record<string, string> {
  const d = value.design;
  return {
    "--color-page": d.background,
    "--color-text": d.text,
    "--color-text-on-dark": d.text,
    "--color-on-accent": d.background,
    "--color-surface": d.surface,
    "--color-navy": d.surface,
    "--color-footer-bg": d.surface,
    "--color-art-indigo-bg": d.surface,
    "--color-art-navy-bg": d.surface,
    "--color-art-gold-bg": d.surface,
    "--color-accent": d.highlight,
    "--color-accent-ink": d.accent,
    "--color-focus": d.accent,
    "--color-breadcrumb": d.accent,
    "--color-loader-active": d.accent,
    "--color-loader-track": `${d.text}33`,
    "--color-accent-soft": d.surface,
    "--color-on-accent-soft": d.text,
    "--form-color-scheme":
      parseInt(d.background.slice(1, 3), 16) +
        parseInt(d.background.slice(3, 5), 16) +
        parseInt(d.background.slice(5, 7), 16) >
      382
        ? "light"
        : "dark",
    "--color-art-indigo-fg": d.accent,
    "--color-art-navy-fg": d.accent,
    "--color-art-gold-fg": d.accent,
    "--color-text-muted": `${d.text}b3`,
    "--color-text-on-dark-muted": `${d.text}b3`,
    "--color-footer-ink": `${d.text}b3`,
    "--color-hero-description": `${d.text}e6`,
    "--color-border": `${d.text}33`,
    "--color-border-on-dark": `${d.text}18`,
    "--color-panel-border": `${d.text}33`,
    "--color-border-subtle": `${d.text}26`,
    "--color-divider": `${d.text}33`,
    "--color-input-border": `${d.text}dd`,
    "--color-input-ink": d.text,
    "--hero-fade-top": `${d.background}26`,
    "--hero-fade-middle": `${d.background}33`,
    "--hero-fade-bottom": `${d.background}a6`,
    "--font-family":
      d.font === "Montserrat"
        ? '"Montserrat", sans-serif'
        : "system-ui, sans-serif",
    "--content-width": `${d.contentWidth}px`,
    "--header-height": `${d.headerHeight}px`,
    "--logo-width": `${d.logoWidth}px`,
    "--logo-filter": d.logoInvert ? "invert(1)" : "none",
    "--section-spacing": `${d.sectionSpacing}px`,
    "--button-padding-y": `${d.buttonPaddingY}px`,
    "--button-border-width": `${d.buttonBorder}px`,
    "--component-radius": `${d.radius}px`,
  };
}
export function applyConfig(value: ExtensionConfig) {
  const validated = validateConfig(value);
  Object.assign(state.brand, validated.brand);
  Object.assign(state.design, validated.design);
  for (const [key, val] of Object.entries(themeVariables(validated)))
    document
      .getElementById("group-pages-studio-root")
      ?.style.setProperty(key, val);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", validated.design.background);
}
