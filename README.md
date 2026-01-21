# DevTool Platform

A comprehensive developer tools platform built with Next.js. It provides a centralized hub for standalone tools and studio sub-tools with a modern, responsive interface.

## 🚀 Features

- **Broad Developer Toolkit** - JSON formatter, Base64 encoder, Regex tester, UUID generator, network diagnostics, and more
- **Microfrontend Architecture** - Modular design where each tool is a separate, maintainable module
- **Smart Search** - Find tools quickly with intelligent search across names, descriptions, and tags
- **Bookmarks System** - Save your favorite tools for quick access (stored in localStorage)
- **Dark/Light Theme** - Toggle between themes with system preference detection
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- **Tool Categories** - Organized by functionality for easy browsing
- **Real-time Processing** - Most tools process data instantly as you type
- **Clean UI** - Built with Tailwind CSS and Shadcn UI for a modern look

Catalog totals are derived from the tool registry and include both standalone tools and the sub-tools available within studios.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **UI Library**: Tailwind CSS + Shadcn UI
- **State Management**: Zustand
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Architecture**: Modular, microfrontend-ready

## 📦 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd devtool-platform
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
devtool-platform/
├── src/                      # Source code
│   ├── app/                  # Next.js app directory
│   ├── components/           # Reusable components
│   ├── lib/                  # Utilities and tools
│   └── config/               # Configuration files
├── public/                   # Static assets
├── docs/                     # 📚 Documentation (organized by category)
│   ├── production-guides/    # 🚀 Deployment and production guides
│   ├── ui-fixes/            # 🎨 UI improvements and fixes
│   ├── seo-optimization/    # 🔍 SEO and performance guides
│   ├── json-enhancements/   # 📊 JSON parsing improvements
│   └── implementation-summaries/ # 📋 Project status and summaries
├── tests/                   # 🧪 Maintained unit, component, and browser tests
└── scripts/                 # 🛠️ Utilities and ad hoc diagnostics
```

## Testing

```bash
npm run lint         # ESLint across maintained source and tests
npm test             # Vitest unit and React component tests
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright browser tests
npm run typecheck    # TypeScript validation
npm run validate:registry # Registry contract validation
npm run build        # Production build
```

Install Playwright's Chromium binary once before running browser tests:

```bash
npx playwright install chromium
```

Set `PLAYWRIGHT_BASE_URL` when browser tests should use an app instance that is
already running; otherwise Playwright starts one on port 3100.

Pull requests run linting, type checking, unit/component tests, registry
validation, a production build, and Chromium smoke tests in GitHub Actions.

## 🏗️ Architecture

The platform follows a modular architecture where each tool is a separate module:

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Home page with search & categories
│   └── tools/[slug]/      # Dynamic tool routes
├── components/            # Reusable UI components
│   ├── navigation.tsx     # Main navigation with search
│   ├── theme-toggle.tsx   # Dark/light theme switcher
│   ├── tool-frame.tsx     # Wrapper for all tools
│   └── ui/               # Shadcn UI components
├── lib/
│   ├── tool-registry.ts   # Tool metadata and registry
│   ├── tools/            # Individual tool modules
│   └── utils.ts          # Utility functions
└── store/                # Zustand state management
    ├── bookmarks.ts      # Bookmark management
    └── theme.ts          # Theme management
```

## 🔧 Adding New Tools

1. Create a new tool module in `src/lib/tools/your-tool.tsx`:

```typescript
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  id: "your-tool",
  name: "Your Tool Name",
  description: "Tool description",
  category: "Utilities",
  tags: ["tag1", "tag2"],
  path: "/tools/your-tool",
  icon: "🔧",
};

export default function YourTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleProcess = () => {
    // Your tool logic here
    setOutput(processInput(input));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Tool</CardTitle>
        <CardDescription>Tool description</CardDescription>
      </CardHeader>
      <CardContent>{/* Your tool UI here */}</CardContent>
    </Card>
  );
}
```

2. Register the tool in `src/lib/tool-registry.ts`:

```typescript
import YourTool, { metadata as yourToolMetadata } from "./tools/your-tool";

// Add to TOOL_REGISTRY array
export const TOOL_REGISTRY: ToolMetadata[] = [
  // ... existing tools
  yourToolMetadata,
];

// Add to tool mapping in src/app/tools/[slug]/page.tsx
const toolComponents: Record<string, React.ComponentType> = {
  // ... existing mappings
  "your-tool": YourTool,
};
```

## 📋 Available Tools

### Text & Format

- JSON Formatter - Format and validate JSON with syntax highlighting
- HTML Formatter - Format and beautify HTML code
- CSS Formatter - Format and beautify CSS code
- Markdown Preview - Live markdown editor with preview

### Encoding & Decoding

- Base64 Encoder/Decoder - Encode and decode Base64 strings
- URL Encoder/Decoder - Encode and decode URLs
- HTML Entities - Encode and decode HTML entities

### Generators

- UUID Generator - Generate UUID v1, v4, and other versions
- Password Generator - Generate secure passwords with options
- Lorem Ipsum Generator - Generate placeholder text

### Converters

- Timestamp Converter - Convert Unix timestamps to dates
- Color Converter - Convert between HEX, RGB, HSL formats
- Case Converter - Convert text between different cases

### Validators

- Regex Tester - Test regular expressions with real-time matching
- JSON Validator - Validate JSON syntax and structure
- Email Validator - Validate email addresses

### Utilities

- QR Code Generator - Generate QR codes for text and URLs
- Text Diff Checker - Compare texts and highlight differences
- Word Counter - Count words, characters, lines, and paragraphs

### Data Processing

- **CSV Viewer** - Upload and view CSV files with interactive table features
- **JSON Table Viewer** - Convert JSON data to interactive table with filtering and sorting
- **Data Explorer** - Advanced data analysis with statistics, filtering, and visualization

## 🎨 Customization

### Theme

The platform supports dark and light themes. Theme preference is saved in localStorage and respects system preferences.

### Bookmarks

Users can bookmark their favorite tools for quick access. Bookmarks are stored in localStorage.

### Search

The search functionality looks through tool names, descriptions, and tags for relevant matches.

## 📱 Mobile Support

The platform is fully responsive and works seamlessly on:

- Desktop computers
- Tablets
- Mobile phones

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your tool following the architecture guidelines
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🧪 Testing & Development

### Test Files Organization

All test files and debugging scripts are organized in the `tests/` directory:

```
tests/
├── README.md                    # Testing documentation
├── debug-*.js                  # Debugging scripts
├── test-*.js                   # JavaScript test files
├── test-*.mjs                  # ES Module test files
├── test-*.json                 # JSON test data
└── *.csv                       # CSV test data
```

### Available Test Categories

- **JSON Processing Tests** - Nested data parsing and flattening
- **CSV Processing Tests** - Delimiter detection and parsing
- **Data Conversion Tests** - Format conversion validations
- **Component Tests** - UI component functionality
- **Integration Tests** - Complete workflow testing

### Running Tests

```bash
# Run specific test files
node tests/test-nested-json-parser.js
node tests/debug-csv.js

# ES Module tests
node tests/test-complete-flow.mjs
```

### Development Scripts

```bash
# Check production readiness
node scripts/production-checker.js

# Update domain URLs
node scripts/update-domain.js

# Build for production
npm run build

# Development server
npm run dev
```

## 📚 Documentation

Complete project documentation is organized in the `docs/` directory:

- **[📋 Quick Index](./docs/INDEX.md)** - Fast access to all documentation
- **[🚀 Production Guides](./docs/production-guides/)** - Deployment instructions
- **[🎨 UI Improvements](./docs/ui-fixes/)** - Interface enhancements
- **[🔍 SEO Optimization](./docs/seo-optimization/)** - Search engine optimization
- **[📊 Data Enhancements](./docs/json-enhancements/)** - Data processing improvements
- **[📋 Implementation Status](./docs/implementation-summaries/)** - Project summaries

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn UI](https://ui.shadcn.com)
- [Zustand](https://zustand-demo.pmnd.rs)
