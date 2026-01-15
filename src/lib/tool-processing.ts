import type { ProcessingMode } from "@/lib/tool-registry";

interface ProcessingInfo {
  label: string;
  description: string;
}

const PROCESSING_INFO: Record<ProcessingMode, ProcessingInfo> = {
  client: {
    label: "Browser processing",
    description:
      "Runs in your browser. Network-enabled tools may still contact the external service you request.",
  },
  server: {
    label: "Server processing",
    description:
      "Uses DevTool Platform servers and may contact external services to return results.",
  },
  hybrid: {
    label: "Browser + server",
    description:
      "Combines browser processing with server or external-service requests.",
  },
};

export function getProcessingInfo(mode: ProcessingMode): ProcessingInfo {
  return PROCESSING_INFO[mode];
}
