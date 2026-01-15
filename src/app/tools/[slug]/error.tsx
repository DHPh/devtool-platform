"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ToolPageError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-semibold">Unable to load this tool</h2>
      <p className="text-muted-foreground">
        The tool component could not be loaded. Retry the request, or return to
        the catalog and choose another tool.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/tools">Tool catalog</Link>
        </Button>
      </div>
    </div>
  );
}
