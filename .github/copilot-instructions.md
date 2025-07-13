# DevTool Platform - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is a comprehensive DevTool Platform built with Next.js, featuring 100+ developer tools in a microfrontend architecture.

## Tech Stack

- **Frontend**: Next.js (App Router) with TypeScript
- **UI Library**: Tailwind CSS + Shadcn UI
- **State Management**: Zustand
- **Tools Architecture**: Modular, each tool is a separate module

## Architecture Guidelines

- Use modular architecture where each tool is a separate module in `src/lib/tools/`
- Implement tool registry pattern for dynamic tool loading
- Use consistent component structure with `ToolFrame` wrapper
- Implement theme toggle with dark/light mode support
- Use Zustand for global state (bookmarks, theme, search)

## Code Style

- Use TypeScript for all components and utilities
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling with Shadcn UI components
- Implement responsive design patterns
- Use proper error boundaries and loading states

## Tool Development Pattern

Each tool should:

1. Have its own file in `src/lib/tools/`
2. Export a default component and metadata
3. Be registered in `tool-registry.ts`
4. Follow consistent UI patterns
5. Include proper input validation and error handling

## Features to Implement

- Search functionality across all tools
- Bookmark system with localStorage
- Theme toggle (dark/light)
- Tool categories and filtering
- Share functionality with URL state
- Responsive mobile design
