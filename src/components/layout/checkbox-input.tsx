"use client";

import { Label } from "@/components/ui/label";

interface CheckboxInputProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function CheckboxInput({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = "",
}: CheckboxInputProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
      />
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
