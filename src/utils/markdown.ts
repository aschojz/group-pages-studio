import MarkdownIt from "markdown-it";
const parser = new MarkdownIt({ html: false, linkify: true, breaks: true });
export function renderMarkdown(source: string): string {
  return parser.render(source);
}
export function markdownSummary(source: string): string {
  return parser
    .parse(source, {})
    .map(
      (token) =>
        token.children
          ?.map((child) =>
            ["text", "code_inline", "image"].includes(child.type)
              ? child.content
              : ["softbreak", "hardbreak"].includes(child.type)
                ? " "
                : "",
          )
          .join("") ?? "",
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
