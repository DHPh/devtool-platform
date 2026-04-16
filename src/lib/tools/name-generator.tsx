"use client";

import { useState } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Shuffle } from "lucide-react";
import { toast } from "sonner";
import {
  QuickActions,
  ResultCard,
  CopyableResult,
} from "@/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  generateNameBatch,
  type NameCategory,
  type PersonGender,
} from "@/lib/processors/random-generators";

export default function NameGenerator() {
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [nameType, setNameType] = useState<NameCategory>("person");
  const [personGender, setPersonGender] = useState<PersonGender>("unisex");
  const [count, setCount] = useState(5);

  const generateNames = () => {
    const result = generateNameBatch({
      type: nameType,
      gender: personGender,
      count,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setGeneratedNames(result.value);
    toast.success(`Generated ${result.value.length} ${nameType} names!`);
  };

  const copyName = async (name: string) => {
    try {
      await writeClipboardText(name);
      toast.success("Name copied to clipboard!");
    } catch {
      // Error toast is already surfaced by writeClipboardText
    }
  };

  const copyAllNames = async () => {
    try {
      await writeClipboardText(generatedNames.join("\n"));
      toast.success("All names copied to clipboard!");
    } catch {
      // Error toast is already surfaced by writeClipboardText
    }
  };

  const clearAll = () => {
    setGeneratedNames([]);
  };

  return (
    <div className="space-y-6">
      <QuickActions
        actions={[
          {
            id: "generate",
            label: "Generate Names",
            onClick: generateNames,
            variant: "default" as const,
          },
          {
            id: "regenerate",
            label: "Regenerate",
            onClick: generateNames,
            disabled: generatedNames.length === 0,
            variant: "outline" as const,
          },
          {
            id: "copy-all",
            label: "Copy All",
            onClick: () => void copyAllNames(),
            disabled: generatedNames.length === 0,
            variant: "outline" as const,
          },
          {
            id: "clear",
            label: "Clear All",
            onClick: clearAll,
            disabled: generatedNames.length === 0,
            variant: "outline" as const,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <ResultCard
            title="Generator Settings"
            description="Configure name generation options"
            status="info"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="name-type">Name Type</Label>
                <Select
                  value={nameType}
                  onValueChange={(value) => setNameType(value as NameCategory)}
                >
                  <SelectTrigger id="name-type" aria-label="Name type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Person Names</SelectItem>
                    <SelectItem value="company">Company Names</SelectItem>
                    <SelectItem value="project">Project Names</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {nameType === "person" && (
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={personGender}
                    onValueChange={(value) =>
                      setPersonGender(value as PersonGender)
                    }
                  >
                    <SelectTrigger id="gender" aria-label="Person gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unisex">Unisex</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="count">Number of Names</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) =>
                    setCount(
                      Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)),
                    )
                  }
                />
              </div>

              <Button onClick={generateNames} className="w-full">
                <Shuffle className="h-4 w-4 mr-2" />
                Generate Names
              </Button>
            </div>
          </ResultCard>
        </div>

        <div className="lg:col-span-2">
          <ResultCard
            title="Generated Names"
            description={`${generatedNames.length} ${nameType} names generated`}
            status={generatedNames.length > 0 ? "success" : "info"}
            onCopy={
              generatedNames.length > 0 ? () => void copyAllNames() : undefined
            }
            copyLabel="Copy All Names"
          >
            {generatedNames.length > 0 ? (
              <div className="space-y-2">
                {generatedNames.map((name, index) => (
                  <div
                    key={`${name}-${index}`}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="font-medium">{name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Copy ${name}`}
                      onClick={() => void copyName(name)}
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <CopyableResult
                value=""
                placeholder="Generated names will appear here..."
                rows={8}
              />
            )}
          </ResultCard>
        </div>
      </div>
    </div>
  );
}
