"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileText, Code, Database, Globe } from "lucide-react";

interface SampleData {
  label: string;
  value: string;
  category?: string;
  description?: string;
}

interface SampleDataLoaderProps {
  samples: SampleData[];
  onLoad: (value: string) => void;
  buttonLabel?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function SampleDataLoader({
  samples,
  onLoad,
  buttonLabel = "Load Sample",
  className = "",
  variant = "outline",
  size = "default",
}: SampleDataLoaderProps) {
  const groupedSamples = samples.reduce((groups, sample) => {
    const category = sample.category || "Examples";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(sample);
    return groups;
  }, {} as Record<string, SampleData[]>);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "json":
        return <Code className="w-4 h-4" />;
      case "api":
      case "web":
        return <Globe className="w-4 h-4" />;
      case "database":
      case "data":
        return <Database className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {buttonLabel}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        {Object.entries(groupedSamples).map(
          ([category, categoryItems], groupIndex) => (
            <div key={category}>
              {groupIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="flex items-center gap-2">
                {getCategoryIcon(category)}
                {category}
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {categoryItems.map((sample, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => onLoad(sample.value)}
                    className="flex flex-col items-start gap-1 p-3"
                  >
                    <span className="font-medium">{sample.label}</span>
                    {sample.description && (
                      <span className="text-xs text-muted-foreground">
                        {sample.description}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </div>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Pre-defined sample data sets for common use cases
export const CommonSamples = {
  json: [
    {
      label: "User Profile",
      value: JSON.stringify(
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          age: 30,
          address: {
            street: "123 Main St",
            city: "New York",
            country: "USA",
          },
        },
        null,
        2
      ),
      category: "JSON",
      description: "Simple user profile object",
    },
    {
      label: "API Response",
      value: JSON.stringify(
        {
          status: "success",
          data: [
            { id: 1, title: "First Item" },
            { id: 2, title: "Second Item" },
          ],
          pagination: {
            page: 1,
            totalPages: 5,
            totalItems: 50,
          },
        },
        null,
        2
      ),
      category: "API",
      description: "Typical API response structure",
    },
  ],

  emails: [
    {
      label: "Valid Emails",
      value:
        "user@example.com\njohn.doe@company.co.uk\ntest.email+tag@domain.org\nuser123@sub.domain.com",
      category: "Examples",
      description: "Collection of valid email formats",
    },
    {
      label: "Mixed Validity",
      value:
        "valid@email.com\ninvalid-email\nuser@domain\ntest@example.com\nbad@.com",
      category: "Examples",
      description: "Mix of valid and invalid emails",
    },
  ],

  html: [
    {
      label: "Basic Page",
      value: `<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World</h1><p>This is a paragraph.</p></body></html>`,
      category: "HTML",
      description: "Simple HTML page structure",
    },
    {
      label: "Form Elements",
      value: `<form><div><label for="name">Name:</label><input type="text" id="name" name="name"></div><div><label for="email">Email:</label><input type="email" id="email" name="email"></div><button type="submit">Submit</button></form>`,
      category: "HTML",
      description: "HTML form with inputs",
    },
  ],

  css: [
    {
      label: "Card Component",
      value: `.card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 16px; margin: 8px; } .card-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }`,
      category: "CSS",
      description: "Card component styles",
    },
  ],

  urls: [
    {
      label: "Common URLs",
      value:
        "https://example.com/path?param=value&other=123\nhttps://api.service.com/v1/users/123\nftp://files.example.com/download/file.zip",
      category: "Web",
      description: "Different URL formats",
    },
  ],
};
