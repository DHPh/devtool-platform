import { UnifiedHttpTester, type HttpTesterMode } from "../components/UnifiedHttpTester";

export function UnifiedHttpTesterTab({ mode }: { mode?: HttpTesterMode } = {}) {
  return <UnifiedHttpTester mode={mode} />;
}

export function ApiTesterTab() {
  return <UnifiedHttpTester mode="api-tester" />;
}

export function HttpClientTab() {
  return <UnifiedHttpTester mode="http-client" />;
}
