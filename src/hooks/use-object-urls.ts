"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Triggers a client-side file download from a Blob and safely schedules
 * revocation of the temporary object URL after the click is dispatched.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

/**
 * Tracks browser `blob:` ObjectURLs created by a component, allows explicit
 * single-URL revocation on item removal, and revokes any remaining URLs on unmount.
 */
export function useObjectUrls() {
  const urlsRef = useRef<Set<string>>(new Set());

  const createObjectUrl = useCallback((source: Blob | MediaSource): string => {
    const url = URL.createObjectURL(source);
    urlsRef.current.add(url);
    return url;
  }, []);

  const revokeObjectUrl = useCallback((url: string | null | undefined): void => {
    if (!url || !url.startsWith("blob:")) return;
    if (urlsRef.current.delete(url)) {
      URL.revokeObjectURL(url);
      return;
    }
    URL.revokeObjectURL(url);
  }, []);

  const revokeAllObjectUrls = useCallback((): void => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current.clear();
  }, []);

  useEffect(() => () => revokeAllObjectUrls(), [revokeAllObjectUrls]);

  return {
    createObjectUrl,
    revokeObjectUrl,
    revokeAllObjectUrls,
  };
}
