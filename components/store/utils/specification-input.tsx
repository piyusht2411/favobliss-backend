"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { SpecificationField } from "@prisma/client";

interface SpecificationInputProps {
  value: { specificationFieldId: string; value: string }[];
  disabled?: boolean;
  specificationFields: (SpecificationField & { group: { name: string } })[];
  onChange: (value: { specificationFieldId: string; value: string }[]) => void;
}

export const SpecificationInput = ({
  value,
  disabled,
  specificationFields,
  onChange,
}: SpecificationInputProps) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>(
    undefined
  );
  const [fieldValue, setFieldValue] = useState("");

  const handleAdd = () => {
    if (selectedFieldId && fieldValue) {
      onChange([
        ...value,
        { specificationFieldId: selectedFieldId, value: fieldValue },
      ]);
      setSelectedFieldId(undefined);
      setFieldValue("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  // Group specification fields by group name
  const groupedFields = specificationFields.reduce((acc, field) => {
    const groupName = field.group.name;
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(field);
    return acc;
  }, {} as Record<string, typeof specificationFields>);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select
          disabled={disabled}
          value={selectedFieldId}
          onValueChange={setSelectedFieldId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a specification field" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedFields).map(([groupName, fields]) => (
              <div key={groupName}>
                {/* Group Header */}
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                  {groupName}
                </div>
                {/* Group Items */}
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id} className="pl-6">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{field.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        <Input
          disabled={disabled}
          value={fieldValue}
          onChange={(e) => setFieldValue(e.target.value)}
          placeholder="Enter value"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !selectedFieldId || !fieldValue}
        >
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {value.map((spec, index) => {
          const field = specificationFields.find(
            (f) => f.id === spec.specificationFieldId
          );
          return (
            <div
              key={index}
              className="flex items-center gap-2 p-2 border rounded-md bg-muted/20"
            >
              <span className="flex-1">
                {field ? (
                  <span>
                    <span className="text-xs text-muted-foreground">
                      {field.group.name}
                    </span>
                    <br />
                    <span className="font-medium">{field.name}:</span>{" "}
                    {spec.value}
                  </span>
                ) : (
                  "Unknown"
                )}
              </span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
