import { permanentRedirect } from "next/navigation";

export default function LegacyFileProcessingPage() {
  permanentRedirect("/tools/file-processing-studio");
}
