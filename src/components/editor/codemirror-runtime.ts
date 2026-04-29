import {
  Compartment,
  EditorState,
  type Extension,
} from "@codemirror/state";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder as placeholderExtension,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  HighlightStyle,
  bracketMatching,
  foldGutter,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { tags } from "@lezer/highlight";

export type CodeLanguage =
  | "json"
  | "html"
  | "css"
  | "javascript"
  | "typescript"
  | "yaml"
  | "xml"
  | "svg"
  | "sql"
  | "markdown"
  | "plaintext";

export const CODE_LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  json: "JSON",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  typescript: "TypeScript",
  yaml: "YAML",
  xml: "XML",
  svg: "SVG",
  sql: "SQL",
  markdown: "Markdown",
  plaintext: "Plain text",
};

export async function loadLanguageExtension(
  language: CodeLanguage,
): Promise<Extension> {
  switch (language) {
    case "json":
      return (await import("@codemirror/lang-json")).json();
    case "html":
      return (await import("@codemirror/lang-html")).html();
    case "css":
      return (await import("@codemirror/lang-css")).css();
    case "javascript":
      return (await import("@codemirror/lang-javascript")).javascript();
    case "typescript":
      return (await import("@codemirror/lang-javascript")).javascript({
        typescript: true,
      });
    case "yaml":
      return (await import("@codemirror/lang-yaml")).yaml();
    case "xml":
    case "svg":
      return (await import("@codemirror/lang-xml")).xml();
    case "sql":
      return (await import("@codemirror/lang-sql")).sql();
    case "markdown":
      return (await import("@codemirror/lang-markdown")).markdown();
    case "plaintext":
    default:
      return [];
  }
}

const semanticTheme = EditorView.theme({
  "&": {
    backgroundColor: "hsl(var(--card))",
    color: "hsl(var(--foreground))",
    fontSize: "0.875rem",
    lineHeight: "1.55",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  ".cm-content": {
    padding: "0.75rem 0",
    caretColor: "hsl(var(--primary))",
  },
  ".cm-line": {
    padding: "0 0.75rem",
  },
  ".cm-gutters": {
    backgroundColor: "hsl(var(--muted) / 0.45)",
    color: "hsl(var(--muted-foreground))",
    borderRight: "1px solid hsl(var(--border))",
    userSelect: "none",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 0.625rem 0 0.75rem",
    minWidth: "2.5rem",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "hsl(var(--muted))",
    color: "hsl(var(--foreground))",
  },
  ".cm-activeLine": {
    backgroundColor: "hsl(var(--muted) / 0.35)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection":
    {
      backgroundColor: "hsl(var(--primary) / 0.18)",
    },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "hsl(var(--primary))",
    borderLeftWidth: "2px",
  },
  ".cm-matchingBracket": {
    backgroundColor: "hsl(var(--primary) / 0.14)",
    outline: "1px solid hsl(var(--primary) / 0.35)",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "hsl(var(--muted))",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--muted-foreground))",
    borderRadius: "0.25rem",
    padding: "0 0.25rem",
  },
  ".cm-placeholder": {
    color: "hsl(var(--muted-foreground))",
  },
});

const semanticHighlightStyle = HighlightStyle.define([
  {
    tag: [
      tags.keyword,
      tags.operatorKeyword,
      tags.controlKeyword,
      tags.definitionKeyword,
      tags.moduleKeyword,
    ],
    class: "syntax-keyword",
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.character],
    class: "syntax-string",
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment],
    class: "syntax-comment",
  },
  {
    tag: [tags.tagName, tags.angleBracket, tags.heading],
    class: "syntax-tag",
  },
  {
    tag: [tags.attributeName, tags.propertyName],
    class: "syntax-attribute",
  },
  {
    tag: [tags.number, tags.integer, tags.float, tags.bool, tags.null, tags.atom],
    class: "syntax-value",
  },
]);

export interface MountedCodeMirror {
  view: EditorView;
  setValue: (nextValue: string) => void;
  setLanguage: (extension: Extension) => void;
  setReadOnly: (readOnly: boolean) => void;
  setWordWrap: (wrap: boolean) => void;
  setContentAttributes: (attrs: Record<string, string>) => void;
  destroy: () => void;
}

export function buildContentAttributes(options: {
  id?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}): Record<string, string> {
  const attrs: Record<string, string> = {
    spellcheck: "false",
    autocorrect: "off",
    autocapitalize: "off",
  };
  if (options.id) attrs.id = options.id;
  if (options.ariaLabel) attrs["aria-label"] = options.ariaLabel;
  if (options.ariaLabelledBy) {
    attrs["aria-labelledby"] = options.ariaLabelledBy;
  }
  return attrs;
}

export function mountCodeMirror(options: {
  parent: HTMLElement;
  initialValue: string;
  languageExtension: Extension;
  readOnly: boolean;
  wordWrap: boolean;
  placeholderText?: string;
  minHeight: number;
  maxHeight?: number;
  contentAttributes: Record<string, string>;
  onDocChange: (nextValue: string) => void;
}): MountedCodeMirror {
  const languageCompartment = new Compartment();
  const readOnlyCompartment = new Compartment();
  const wrapCompartment = new Compartment();
  const attributesCompartment = new Compartment();

  let syncingExternalValue = false;

  const sizingTheme = EditorView.theme({
    ".cm-scroller": {
      minHeight: `${options.minHeight}px`,
      maxHeight: options.maxHeight ? `${options.maxHeight}px` : "none",
    },
  });

  const extensions: Extension[] = [
    lineNumbers(),
    highlightActiveLineGutter(),
    foldGutter(),
    history(),
    bracketMatching(),
    closeBrackets(),
    highlightActiveLine(),
    syntaxHighlighting(semanticHighlightStyle),
    semanticTheme,
    sizingTheme,
    languageCompartment.of(options.languageExtension),
    readOnlyCompartment.of([
      EditorState.readOnly.of(options.readOnly),
      EditorView.editable.of(!options.readOnly),
    ]),
    wrapCompartment.of(options.wordWrap ? EditorView.lineWrapping : []),
    attributesCompartment.of(
      EditorView.contentAttributes.of(options.contentAttributes),
    ),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      indentWithTab,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !syncingExternalValue) {
        options.onDocChange(update.state.doc.toString());
      }
    }),
  ];

  if (options.placeholderText) {
    extensions.push(placeholderExtension(options.placeholderText));
  }

  const state = EditorState.create({
    doc: options.initialValue,
    extensions,
  });

  const view = new EditorView({
    state,
    parent: options.parent,
  });

  return {
    view,
    setValue(nextValue: string) {
      const current = view.state.doc.toString();
      if (current === nextValue) return;
      syncingExternalValue = true;
      try {
        view.dispatch({
          changes: { from: 0, to: current.length, insert: nextValue },
        });
      } finally {
        syncingExternalValue = false;
      }
    },
    setLanguage(extension: Extension) {
      view.dispatch({
        effects: languageCompartment.reconfigure(extension),
      });
    },
    setReadOnly(readOnly: boolean) {
      view.dispatch({
        effects: readOnlyCompartment.reconfigure([
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
        ]),
      });
    },
    setWordWrap(wrap: boolean) {
      view.dispatch({
        effects: wrapCompartment.reconfigure(
          wrap ? EditorView.lineWrapping : [],
        ),
      });
    },
    setContentAttributes(attrs: Record<string, string>) {
      view.dispatch({
        effects: attributesCompartment.reconfigure(
          EditorView.contentAttributes.of(attrs),
        ),
      });
    },
    destroy() {
      view.destroy();
    },
  };
}
