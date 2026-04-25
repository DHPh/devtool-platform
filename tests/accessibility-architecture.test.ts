import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

function location(source: ts.SourceFile, node: ts.Node) {
  const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  return `${relative(process.cwd(), source.fileName)}:${line}`;
}

describe("tool accessibility architecture", () => {
  it("gives every icon-only shared Button an accessible name", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(join(process.cwd(), "src"))) {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const visit = (node: ts.Node) => {
        if (
          ts.isJsxElement(node) &&
          node.openingElement.tagName.getText(source) === "Button"
        ) {
          const attributes = node.openingElement.attributes.getText(source);
          const directText = node.children.some(
            (child) => ts.isJsxText(child) && child.text.trim().length > 0,
          );
          const children = node.children.map((child) => child.getText(source)).join("").trim();
          const iconOnly = /^<\w+[\s\S]*\/>$/.test(children);
          if (
            iconOnly &&
            !directText &&
            !/aria-label\s*=|title\s*=/.test(attributes)
          ) {
            offenders.push(location(source, node));
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }

    expect(offenders).toEqual([]);
  });

  it("keeps clickable non-interactive tool elements keyboard reachable", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(join(process.cwd(), "src", "lib", "tools"))) {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const visit = (node: ts.Node) => {
        if (ts.isJsxElement(node)) {
          const tag = node.openingElement.tagName.getText(source);
          const attributes = node.openingElement.attributes.getText(source);
          if (
            /^(div|span|li|tr|img)$/.test(tag) &&
            /onClick\s*=/.test(attributes) &&
            (!/tabIndex\s*=/.test(attributes) ||
              !/onKey(?:Down|Up)\s*=/.test(attributes))
          ) {
            offenders.push(location(source, node));
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }

    expect(offenders).toEqual([]);
  });

  it("gives every tool form control a programmatic label", () => {
    const offenders: string[] = [];
    const controls = new Set([
      "Input",
      "Textarea",
      "ResponsiveTextArea",
      "SelectTrigger",
      "input",
      "textarea",
      "select",
    ]);

    for (const file of sourceFiles(join(process.cwd(), "src", "lib", "tools"))) {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const visit = (node: ts.Node, insideLabel = false) => {
        let childInsideLabel = insideLabel;
        if (ts.isJsxElement(node)) {
          const tag = node.openingElement.tagName.getText(source);
          childInsideLabel = insideLabel || tag === "label";
          if (controls.has(tag)) {
            const attributes = node.openingElement.attributes.getText(source);
            const implicitlyNamedType =
              /type\s*=\s*"(?:hidden|checkbox|radio|color|file)"/.test(
                attributes,
              );
            if (
              !insideLabel &&
              !implicitlyNamedType &&
              !/(?:aria-label|aria-labelledby|id)\s*=/.test(attributes)
            ) {
              offenders.push(location(source, node));
            }
          }
        }
        ts.forEachChild(node, (child) => visit(child, childInsideLabel));
      };
      visit(source);
    }

    expect(offenders).toEqual([]);
  });

  it("keeps theme foreground and semantic tokens at WCAG AA contrast", () => {
    const themeDir = join(process.cwd(), "src", "app", "themes");
    const themeFiles = readdirSync(themeDir).filter((file) =>
      file.endsWith(".css"),
    );

    expect(themeFiles.length).toBeGreaterThan(0);

    const requiredPairs: [string, string][] = [
      ["--background", "--foreground"],
      ["--card", "--card-foreground"],
      ["--popover", "--popover-foreground"],
      ["--primary", "--primary-foreground"],
      ["--secondary", "--secondary-foreground"],
      ["--muted", "--muted-foreground"],
      ["--background", "--muted-foreground"],
      ["--accent", "--accent-foreground"],
      ["--destructive", "--destructive-foreground"],
      ["--background", "--destructive"],
      ["--card", "--destructive"],
      ["--background", "--primary"],
    ];

    for (const file of themeFiles) {
      const css = readFileSync(join(themeDir, file), "utf8");
      const lightBlock =
        css.match(/:root\[data-theme="[^"]+"\]\s*\{([\s\S]*?)\}/)?.[1] ?? "";
      const darkBlock = css.match(/\.dark\s*\{([\s\S]*?)\}/)?.[1] ?? "";

      expect(lightBlock, `${file} light tokens`).not.toBe("");
      expect(darkBlock, `${file} dark tokens`).not.toBe("");

      for (const [bg, fg] of requiredPairs) {
        expect(
          tokenContrast(lightBlock, bg, fg),
          `${file} light ${bg}/${fg}`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          tokenContrast(darkBlock, bg, fg),
          `${file} dark ${bg}/${fg}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

function tokenContrast(block: string, background: string, foreground: string) {
  const readToken = (name: string) => {
    const match = block.match(new RegExp(`${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`));
    if (!match) throw new Error(`Missing color token ${name}`);
    return hslToRgb(Number(match[1]), Number(match[2]) / 100, Number(match[3]) / 100);
  };
  const [backgroundLuminance, foregroundLuminance] = [
    relativeLuminance(readToken(background)),
    relativeLuminance(readToken(foreground)),
  ].sort((left, right) => right - left);
  return (backgroundLuminance + 0.05) / (foregroundLuminance + 0.05);
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const intermediate = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] =
    segment < 1 ? [chroma, intermediate, 0] :
    segment < 2 ? [intermediate, chroma, 0] :
    segment < 3 ? [0, chroma, intermediate] :
    segment < 4 ? [0, intermediate, chroma] :
    segment < 5 ? [intermediate, 0, chroma] :
    [chroma, 0, intermediate];
  const offset = lightness - chroma / 2;
  return [red + offset, green + offset, blue + offset];
}

function relativeLuminance(rgb: number[]) {
  const [red, green, blue] = rgb.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
