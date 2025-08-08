import dynamic from "next/dynamic";
import { Metadata } from "next";
import { ToolFrame } from "@/components/layout/tool-frame";
import { getToolById } from "@/lib/tool-registry";

const IconPackGenerator = dynamic(
  () => import("@/lib/tools/icon-pack-generator"),
  {
    loading: () => <div>Loading...</div>,
  }
);

export const metadata: Metadata = {
  title: "Icon Pack Generator - Create Professional App Icons",
  description:
    "Generate professional icon packs for Android and iOS from high-quality images. Complies with platform guidelines and policies.",
  keywords: [
    "icon",
    "android",
    "ios",
    "mobile",
    "app",
    "pack",
    "generator",
    "adaptive",
    "app store",
  ],
};

export default function IconPackGeneratorPage() {
  const tool = getToolById("icon-pack-generator");

  if (!tool) {
    return <div>Tool not found</div>;
  }

  return (
    <ToolFrame title={tool.name} description={tool.description}>
      <IconPackGenerator />
    </ToolFrame>
  );
}
