import { NextResponse } from "next/server";

export const API_JSON_MAX_BYTES = 16 * 1024;

type BoundedJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

function errorResponse(
  status: 400 | 413 | 415,
  error: string,
  errorCode: string,
): BoundedJsonResult<never> {
  return {
    ok: false,
    response: NextResponse.json({ error, errorCode }, { status }),
  };
}

export async function readBoundedJson<T>(
  request: Request,
  maxBytes = API_JSON_MAX_BYTES,
): Promise<BoundedJsonResult<T>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return errorResponse(
      415,
      "Content-Type must be application/json",
      "UNSUPPORTED_MEDIA_TYPE",
    );
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return errorResponse(413, "Request body is too large", "PAYLOAD_TOO_LARGE");
  }
  if (!request.body) {
    return errorResponse(400, "Request body is required", "INVALID_REQUEST");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return errorResponse(
          413,
          "Request body is too large",
          "PAYLOAD_TOO_LARGE",
        );
      }
      chunks.push(value);
    }
  } catch {
    return errorResponse(400, "Request body could not be read", "INVALID_REQUEST");
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return errorResponse(400, "Invalid request body", "INVALID_REQUEST");
  }
}
