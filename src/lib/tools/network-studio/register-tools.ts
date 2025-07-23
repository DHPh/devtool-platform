import { ToolRegistryManager, createTool } from "@/lib/tool-builder";
import { TOOL_TYPES, TOOL_CATEGORIES } from "@/lib/tool-classification";

// Network Studio main tool and sub-tools
const networkTools = [
  // Main Network Studio
  {
    id: "network-studio",
    name: "Network Studio",
    description:
      "Comprehensive network testing and analysis toolkit with 10 professional tools",
    category: TOOL_CATEGORIES.API_TESTING.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.ANALYZER, TOOL_TYPES.VALIDATOR],
    tags: ["network", "testing", "analysis", "suite", "professional"],
    icon: "🌐",
    featured: true,
    complexity: "advanced" as const,
  },

  // Network Studio Sub-tools (accessible via URL parameters)
  {
    id: "api-tester",
    name: "API Tester",
    description:
      "REST API testing tool with request builder and cURL import/export",
    category: TOOL_CATEGORIES.API_TESTING.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.VALIDATOR],
    tags: ["api", "rest", "testing", "curl", "requests"],
    icon: "🌍",
    complexity: "intermediate" as const,
  },

  {
    id: "http-client",
    name: "HTTP Client",
    description: "HTTP request builder with headers and response analysis",
    category: TOOL_CATEGORIES.API_TESTING.id,
    type: TOOL_TYPES.UTILITY,
    tags: ["http", "client", "requests", "headers"],
    icon: "📡",
    complexity: "intermediate" as const,
  },

  {
    id: "websocket-tester",
    name: "WebSocket Tester",
    description: "Test WebSocket connections with real-time messaging",
    category: TOOL_CATEGORIES.API_TESTING.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.VALIDATOR],
    tags: ["websocket", "realtime", "testing", "connections"],
    icon: "📻",
    complexity: "intermediate" as const,
  },

  {
    id: "dns-lookup",
    name: "DNS Lookup",
    description: "DNS record lookup with WHOIS information and validation",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.ANALYZER,
    types: [TOOL_TYPES.VALIDATOR],
    tags: ["dns", "lookup", "whois", "domain", "records"],
    icon: "🔍",
    complexity: "intermediate" as const,
  },

  {
    id: "ip-info",
    name: "IP Information",
    description:
      "Get detailed IP address information including geolocation and ISP",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["ip", "geolocation", "isp", "information"],
    icon: "📍",
    complexity: "simple" as const,
  },

  {
    id: "port-scanner",
    name: "Port Scanner",
    description:
      "Network port scanner with predefined profiles and custom ranges",
    category: TOOL_CATEGORIES.SECURITY_TOOLS.id,
    type: TOOL_TYPES.ANALYZER,
    types: [TOOL_TYPES.SECURITY],
    tags: ["port", "scanner", "security", "network", "profiles"],
    icon: "🛡️",
    complexity: "advanced" as const,
  },

  {
    id: "network-monitor",
    name: "Network Monitor",
    description:
      "Monitor network performance with ping tests and speed analysis",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["network", "monitor", "ping", "speed", "performance"],
    icon: "📊",
    complexity: "intermediate" as const,
  },

  {
    id: "url-tester",
    name: "URL Tester",
    description: "Test URL accessibility and analyze response headers",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.VALIDATOR,
    types: [TOOL_TYPES.ANALYZER],
    tags: ["url", "testing", "headers", "accessibility", "response"],
    icon: "🔗",
    complexity: "simple" as const,
  },

  {
    id: "on-air-checker",
    name: "On Air Checker",
    description: "Check if websites and services are online and accessible",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.VALIDATOR,
    tags: ["online", "checker", "availability", "status", "services"],
    icon: "✅",
    complexity: "simple" as const,
  },

  {
    id: "file-link-checker",
    name: "File Link Checker",
    description:
      "Check file links and get file information without downloading",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.VALIDATOR,
    types: [TOOL_TYPES.ANALYZER],
    tags: ["file", "link", "checker", "download", "headers"],
    icon: "📎",
    complexity: "simple" as const,
  },
];

// Convert to proper ToolMetadata format and add to registry
const toolsToAdd = networkTools.map((tool) => createTool(tool));

console.log("Adding Network Studio tools to registry...");
ToolRegistryManager.addTools(toolsToAdd);

console.log(`Successfully added ${toolsToAdd.length} network tools:`);
toolsToAdd.forEach((tool) => {
  console.log(`  - ${tool.name} (${tool.id})`);
});

export { toolsToAdd as NETWORK_TOOLS };
