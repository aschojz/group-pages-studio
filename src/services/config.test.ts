import { describe, expect, it } from "vitest";
import { readonly } from "vue";
import {
  cloneConfig,
  defaultConfig,
  themeVariables,
  validateConfig,
} from "./config";
describe("extension configuration", () => {
  it("fills missing values from WNE defaults without sharing mutable objects", () => {
    const parsed = validateConfig({ brand: { name: "Andere Gemeinde" } });
    expect(parsed.brand.name).toBe("Andere Gemeinde");
    expect(parsed.design).toEqual(defaultConfig.design);
    parsed.design.background = "#eeeeee";
    expect(defaultConfig.design.background).toBe("#000000");
    expect(
      cloneConfig(readonly(defaultConfig) as typeof defaultConfig),
    ).toEqual(defaultConfig);
  });
  it("rejects executable links, arbitrary CSS, invalid sizes, and empty names", () => {
    for (const value of [
      { brand: { logoUrl: "javascript:alert(1)" } },
      { brand: { privacyUrl: "data:text/html,unsafe" } },
      { brand: { name: " " } },
      { design: { accent: "red;display:none" } },
      { design: { headerHeight: -10 } },
      { design: { radius: Number.NaN } },
      { design: { font: "external-font" } },
      { design: { logoInvert: "true" } },
    ])
      expect(() => validateConfig(value)).toThrow();
  });
  it("maps colors and sizes to shared variables and updates light/dark field appearance", () => {
    const config = validateConfig({
      design: {
        background: "#ffffff",
        text: "#000000",
        accent: "#123456",
        buttonBorder: 3,
        font: "system",
        logoInvert: true,
      },
    });
    expect(themeVariables(config)).toMatchObject({
      "--logo-filter": "invert(1)",
      "--color-page": "#ffffff",
      "--color-text": "#000000",
      "--color-breadcrumb": "#123456",
      "--button-border-width": "3px",
      "--font-family": "system-ui, sans-serif",
      "--hero-fade-bottom": "#ffffffa6",
      "--form-color-scheme": "light",
    });
  });
});
