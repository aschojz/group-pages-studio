import { describe, expect, it } from "vitest";
import { renderMarkdown, markdownSummary } from "./markdown";
describe("public descriptions", () => {
  it("renders formatting and normal links", () => {
    const html = renderMarkdown(
      "**Mindestalter**: 16 Jahre\n\n[Website](https://example.com)",
    );
    expect(html).toContain("<strong>Mindestalter</strong>");
    expect(html).toContain('href="https://example.com"');
  });
  it("escapes embedded HTML and rejects executable links", () => {
    const html = renderMarkdown(
      "<script>alert(1)</script>\n\n[test](javascript:alert(1))",
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript:');
  });
  it("provides plain summaries without nested links in clickable cards", () => {
    expect(markdownSummary("**Hallo**\n\n[Website](https://example.com)")).toBe(
      "Hallo Website",
    );
  });
});
