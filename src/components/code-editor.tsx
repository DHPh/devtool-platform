"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Trash2, WrapText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CODE_LANGUAGE_LABELS,
  type CodeLanguage,
  type MountedCodeMirror,
} from "@/components/editor/codemirror-runtime";
import { copyToClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";

export type { CodeLanguage };

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: CodeLanguage;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
  maxHeight?: number;
  rows?: number;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  label?: string;
  wordWrap?: boolean;
  showToolbar?: boolean;
  showCopyButton?: boolean;
  showClearButton?: boolean;
  showStatusBar?: boolean;
  className?: string;
  editorClassName?: string;
  /** Internal test flag to force mounting CodeMirror inside jsdom. */
  _forceCodeMirror?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  placeholder,
  readOnly = false,
  minHeight,
  maxHeight = 560,
  rows,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  label,
  wordWrap = true,
  showToolbar = true,
  showCopyButton = false,
  showClearButton = false,
  showStatusBar = true,
  className,
  editorClassName,
  _forceCodeMirror = false,
}: CodeEditorProps) {
  const isJsdom =
    typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);
  const enableCodeMirror = !isJsdom || _forceCodeMirror;

  const [wrapEnabled, setWrapEnabled] = useState(wordWrap);
  const [cmReady, setCmReady] = useState(false);
  const [copied, setCopied] = useState(false);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<MountedCodeMirror | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const effectiveMinHeight =
    minHeight ?? (rows ? Math.max(88, rows * 21) : 220);
  const resolvedAriaLabel = ariaLabel ?? label;

  useEffect(() => {
    if (!enableCodeMirror || !hostRef.current) {
      return;
    }

    let cancelled = false;
    let instance: MountedCodeMirror | null = null;
    const mountParent = hostRef.current;

    void (async () => {
      const runtime = await import("@/components/editor/codemirror-runtime");
      if (cancelled || !mountParent) return;

      const languageExtension = await runtime.loadLanguageExtension(language);
      if (cancelled || !mountParent) return;

      instance = runtime.mountCodeMirror({
        parent: mountParent,
        initialValue: valueRef.current,
        languageExtension,
        readOnly,
        wordWrap: wrapEnabled,
        placeholderText: placeholder,
        minHeight: effectiveMinHeight,
        maxHeight,
        contentAttributes: runtime.buildContentAttributes({
          id,
          ariaLabel: resolvedAriaLabel,
          ariaLabelledBy,
        }),
        onDocChange: (next) => {
          onChangeRef.current?.(next);
        },
      });

      editorRef.current = instance;
      setCmReady(true);
    })();

    return () => {
      cancelled = true;
      setCmReady(false);
      if (instance) {
        instance.destroy();
      }
      editorRef.current = null;
    };
    // Mount once per enableCodeMirror toggle and reconfigure properties via compartments below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableCodeMirror]);

  useEffect(() => {
    if (!cmReady || !editorRef.current) return;
    editorRef.current.setValue(value);
  }, [value, cmReady]);

  useEffect(() => {
    if (!cmReady || !editorRef.current) return;
    let cancelled = false;
    void import("@/components/editor/codemirror-runtime").then(
      async (runtime) => {
        const ext = await runtime.loadLanguageExtension(language);
        if (!cancelled) {
          editorRef.current?.setLanguage(ext);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [language, cmReady]);

  useEffect(() => {
    if (!cmReady || !editorRef.current) return;
    editorRef.current.setReadOnly(readOnly);
  }, [readOnly, cmReady]);

  useEffect(() => {
    if (!cmReady || !editorRef.current) return;
    editorRef.current.setWordWrap(wrapEnabled);
  }, [wrapEnabled, cmReady]);

  useEffect(() => {
    if (!cmReady || !editorRef.current) return;
    void import("@/components/editor/codemirror-runtime").then((runtime) => {
      editorRef.current?.setContentAttributes(
        runtime.buildContentAttributes({
          id,
          ariaLabel: resolvedAriaLabel,
          ariaLabelledBy,
        }),
      );
    });
  }, [id, resolvedAriaLabel, ariaLabelledBy, cmReady]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1800);
    }
  };

  const lineCount = value ? value.split("\n").length : 1;
  const charCount = value.length;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card shadow-sm",
        className,
      )}
    >
      {showToolbar && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {label ? (
              <span className="font-medium text-foreground truncate">
                {label}
              </span>
            ) : null}
            <span className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              {CODE_LANGUAGE_LABELS[language]}
            </span>
            {readOnly && (
              <span className="text-[11px] text-muted-foreground">
                Read-only
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={wrapEnabled ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setWrapEnabled((prev) => !prev)}
              aria-label="Toggle line wrap"
              aria-pressed={wrapEnabled}
              className="h-7 px-2 text-xs"
            >
              <WrapText className="h-3.5 w-3.5 mr-1" />
              Wrap
            </Button>

            {showCopyButton && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleCopy()}
                disabled={!value}
                aria-label={`Copy ${resolvedAriaLabel ?? CODE_LANGUAGE_LABELS[language]}`}
                className="h-7 px-2 text-xs"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 mr-1 text-green-700 dark:text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}

            {showClearButton && !readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange?.("")}
                disabled={!value}
                aria-label={`Clear ${resolvedAriaLabel ?? CODE_LANGUAGE_LABELS[language]}`}
                className="h-7 px-2 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {enableCodeMirror && <div ref={hostRef} className={editorClassName} />}

      {!cmReady && (
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          rows={rows}
          spellCheck={false}
          aria-label={resolvedAriaLabel}
          aria-labelledby={ariaLabelledBy}
          style={{
            minHeight: `${effectiveMinHeight}px`,
            maxHeight: maxHeight ? `${maxHeight}px` : undefined,
          }}
          className={cn(
            "rounded-none border-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0",
            wrapEnabled ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto",
            readOnly && "bg-muted/20",
            editorClassName,
          )}
        />
      )}

      {showStatusBar && (
        <div className="flex items-center justify-between border-t border-border bg-muted/25 px-3 py-1 text-[11px] text-muted-foreground">
          <span>
            {lineCount} {lineCount === 1 ? "line" : "lines"} · {charCount} chars
          </span>
          {!readOnly && <span className="hidden sm:inline">Tab indents</span>}
        </div>
      )}
    </div>
  );
}
