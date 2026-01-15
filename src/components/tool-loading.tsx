export function ToolLoading() {
  return (
    <div
      className="space-y-4 py-6"
      role="status"
      aria-label="Loading tool"
    >
      <div className="h-10 w-2/3 animate-pulse rounded-md bg-muted" />
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <span className="sr-only">Loading tool…</span>
    </div>
  );
}
