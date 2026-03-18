import type { ProcessorResult } from "./devops-config-core";

export interface CompressionResult {
  output: string;
  originalBytes: number;
  outputBytes: number;
  savedBytes: number;
  reductionPercent: number;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function compressionResult(input: string, output: string): CompressionResult {
  const originalBytes = byteLength(input);
  const outputBytes = byteLength(output);
  const savedBytes = originalBytes - outputBytes;
  return {
    output,
    originalBytes,
    outputBytes,
    savedBytes,
    reductionPercent: originalBytes ? Number((savedBytes / originalBytes * 100).toFixed(2)) : 0,
  };
}

export interface JavaScriptMinifyOptions {
  module?: boolean;
  mangle?: boolean;
  compress?: boolean;
  preserveComments?: boolean;
}

export async function minifyJavaScript(
  input: string,
  options: JavaScriptMinifyOptions = {},
): Promise<ProcessorResult<CompressionResult>> {
  if (!input.trim()) return { ok: false, error: "Enter JavaScript source." };
  if (byteLength(input) > 2_000_000) return { ok: false, error: "JavaScript input exceeds the 2 MB browser limit." };
  try {
    const { minify } = await import("terser");
    const result = await minify(input, {
      module: options.module ?? false,
      mangle: options.mangle ?? true,
      compress: options.compress ?? true,
      format: { comments: options.preserveComments ? "some" : false },
    });
    if (!result.code) return { ok: false, error: "Terser did not produce output." };
    return { ok: true, value: compressionResult(input, result.code) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "JavaScript could not be minified." };
  }
}

export interface SvgOptimizeOptions {
  multipass?: boolean;
  preserveViewBox?: boolean;
}

export async function optimizeSvg(
  input: string,
  options: SvgOptimizeOptions = {},
): Promise<ProcessorResult<CompressionResult>> {
  const normalized = input.trim();
  if (!/^<svg(?:\s|>)/i.test(normalized) || !/<\/svg>\s*$/i.test(normalized)) return { ok: false, error: "Input must be a complete SVG document." };
  if (byteLength(input) > 2_000_000) return { ok: false, error: "SVG input exceeds the 2 MB browser limit." };
  if (/<script(?:\s|\/?>)/i.test(normalized) || /\son\w+\s*=/i.test(normalized)) return { ok: false, error: "Scripts and inline event handlers are not allowed." };
  try {
    const { optimize } = await import("svgo/browser");
    const result = optimize(normalized, {
      multipass: options.multipass ?? true,
      plugins: options.preserveViewBox === false
        ? ["preset-default", "removeViewBox"]
        : ["preset-default"],
    });
    return { ok: true, value: compressionResult(input, result.data) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "SVG could not be optimized." };
  }
}
