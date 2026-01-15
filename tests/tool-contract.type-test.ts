import type {
  StandaloneToolMetadata,
  StudioSubToolMetadata,
  ToolComponentLoader,
} from "@/lib/tool-registry";

const base = {
  id: "type-test",
  name: "Type Test",
  description: "Compile-time contract test",
  category: "utilities",
  type: "utility" as const,
  tags: ["test"],
  path: "/tools/type-test",
};

const standalone: StandaloneToolMetadata = {
  ...base,
  kind: "standalone",
  processing: "client",
};

const loader: ToolComponentLoader = async () => ({
  default: () => null,
});

// @ts-expect-error Studio sub-tools require both parent and tab metadata.
const invalidSubTool: StudioSubToolMetadata = {
  ...base,
  kind: "studio-subtool",
  processing: "client",
};

void standalone;
void loader;
void invalidSubTool;
