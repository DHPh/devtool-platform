"use client";

import { lazy, Suspense } from "react";

import { ToolLoading } from "@/components/tool-loading";
import {
  TOOL_COMPONENT_IDS,
  type ToolComponentId,
} from "@/lib/tool-component-ids";
import { TOOL_COMPONENT_LOADERS } from "@/lib/tool-components";

const TOOL_COMPONENTS = Object.fromEntries(
  TOOL_COMPONENT_IDS.map((id) => [id, lazy(TOOL_COMPONENT_LOADERS[id])]),
) as Record<ToolComponentId, ReturnType<typeof lazy>>;

export function ToolRenderer({ slug }: { slug: ToolComponentId }) {
  const ToolComponent = TOOL_COMPONENTS[slug];

  return (
    <Suspense fallback={<ToolLoading />}>
      <ToolComponent />
    </Suspense>
  );
}
