import { describe, expect, it } from "vitest";
import {
  FormatterSyntaxError,
  formatCssSource,
  formatHtmlSource,
  minifyCssSource,
} from "@/lib/processors/source-formatters";

describe("HTML source formatter", () => {
  it("preserves comments and safely formats embedded style, script, and template content", async () => {
    const input = '<main><!-- keep --><style>.card{--label:"a;b}";color:red}</style><script>const state={text:"};{"};console.log(state)</script><template><section>{{ user.name }}</section></template></main>';
    const output = await formatHtmlSource(input);

    expect(output).toContain("<!-- keep -->");
    expect(output).toContain('--label: "a;b}";');
    expect(output).toContain('text: "};{"');
    expect(output).toContain("{{ user.name }}");
  });

  it("honors tab indentation without changing quoted angle brackets", async () => {
    const output = await formatHtmlSource('<div data-label="a > b"><section><p>one</p><p>two</p></section></div>', {
      indentSize: 4,
      useTabs: true,
    });

    expect(output).toContain('data-label="a > b"');
    expect(output).toContain("\t<section>");
  });

  it("reports invalid syntax as a typed HTML formatter error", async () => {
    await expect(formatHtmlSource('<div class="unterminated></div>')).rejects.toMatchObject({
      name: "FormatterSyntaxError",
      language: "html",
    } satisfies Partial<FormatterSyntaxError>);
  });
});

describe("CSS source formatter", () => {
  const advancedCss = `/* keep */
@layer components {
  .card {
    --payload: "a;b}c";
    content: "x;y}";
    &:hover { color: oklch(60% 0.2 30); }
  }
}
@supports (display: grid) { .grid { display: grid; } }`;

  it("formats comments, strings, custom properties, at-rules, and nesting", async () => {
    const output = await formatCssSource(advancedCss, { indentSize: 4 });

    expect(output).toContain("/* keep */");
    expect(output).toContain('--payload: "a;b}c";');
    expect(output).toContain('content: "x;y}";');
    expect(output).toContain("&:hover {");
    expect(output).toContain("@supports (display: grid)");
  });

  it("conservatively minifies parser whitespace without deleting content", () => {
    const output = minifyCssSource(advancedCss);

    expect(output).toContain("/* keep */");
    expect(output).toContain('--payload:"a;b}c";');
    expect(output).toContain('content:"x;y}";');
    expect(output).toContain("&:hover{");
    expect(output).toContain("@supports (display: grid){");
  });

  it("reports invalid syntax as a typed CSS formatter error", async () => {
    await expect(formatCssSource(".card { color: red;")).rejects.toMatchObject({
      name: "FormatterSyntaxError",
      language: "css",
    } satisfies Partial<FormatterSyntaxError>);
    expect(() => minifyCssSource(".card { color: red;")).toThrow(FormatterSyntaxError);
  });

  it("validates indentation options", async () => {
    await expect(formatCssSource("a {}", { indentSize: 0 })).rejects.toThrow(RangeError);
  });
});
