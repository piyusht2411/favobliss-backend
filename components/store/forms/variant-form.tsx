"use client";

import { useState, useEffect } from "react";
import { Size, Color, LocationGroup, SpecificationField } from "@prisma/client";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MediaUpload } from "@/components/store/utils/media-upload";
import { ProductFeatures } from "@/components/store/utils/product-features";
import { SpecificationInput } from "@/components/store/utils/specification-input";
import Editor from "./editor";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import * as z from "zod";
import { ProductSchema } from "@/schemas/product-form-schema";

interface VariantFormProps {
  index: number;
  remove: () => void;
  sizes: Size[];
  colors: Color[];
  locationGroups: LocationGroup[];
  specificationFields: (SpecificationField & { group: { name: string } })[];
  disabled: boolean;
}

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  step?: number;
}

const NumberInput = ({
  value,
  onChange,
  disabled,
  placeholder,
  min,
  step,
}: NumberInputProps) => {
  const [localValue, setLocalValue] = useState(value?.toString());

  useEffect(() => {
    setLocalValue(value?.toString());
  }, [value]);

  return (
    <Input
      type="number"
      min={min}
      step={step}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        const num = parseInt(localValue) || 0;
        setLocalValue(num.toString());
        onChange(num);
      }}
      onFocus={(e) => e.target.select()}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default function VariantForm({
  index,
  remove,
  sizes,
  colors,
  locationGroups,
  specificationFields,
  disabled,
}: VariantFormProps) {
  const form = useFormContext<z.infer<typeof ProductSchema>>();
  const { control, getValues } = form;

  const {
    fields: priceFields,
    append: appendPrice,
    remove: removePrice,
  } = useFieldArray({
    control,
    name: `variants.${index}.variantPrices`,
  });

  return (
    <div className="border p-4 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Variant #{index + 1}</h4>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={remove}
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`variants.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Variant name"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.slug`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Variant slug"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.about`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>About</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="About variant"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Editor
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.metaTitle`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="SEO meta title (max 60 characters)"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.metaDescription`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Description</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="SEO meta description (max 160 characters)"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.openGraphImage`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Open Graph Image URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="URL for Open Graph image"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.metaKeywords`}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Meta Keywords</FormLabel>
              <ProductFeatures
                value={field.value || []}
                disabled={disabled}
                onChange={(value) =>
                  field.onChange([...(field.value || []), value])
                }
                onRemove={(value) =>
                  field.onChange(
                    (field.value || []).filter((data) => data !== value)
                  )
                }
              />
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.specifications`}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Specifications</FormLabel>
              <SpecificationInput
                value={field.value || []}
                disabled={disabled}
                specificationFields={specificationFields}
                onChange={field.onChange}
              />
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.sizeId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Size</FormLabel>
              <Select
                disabled={disabled}
                onValueChange={(val) =>
                  field.onChange(val === "none" ? null : val)
                }
                value={field.value ?? "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {sizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name} ({size.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.colorId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <Select
                disabled={disabled}
                onValueChange={(val) =>
                  field.onChange(val === "none" ? null : val)
                }
                value={field.value ?? "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {colors.map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      {color.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.stock`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock</FormLabel>
              <FormControl>
                <NumberInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter stock"
                  disabled={disabled}
                  min={0}
                  step={1}
                />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.sku`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter SKU" disabled={disabled} />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.hsn`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>HSN Code</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter HSN Code"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.gstIn`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>GSTIN Number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter GSTIN Number"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${index}.tax`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax</FormLabel>
              <FormControl>
                <NumberInput
                  value={field.value as number}
                  onChange={field.onChange}
                  placeholder="Enter Tax"
                  disabled={disabled}
                  min={0}
                  step={1}
                />
              </FormControl>
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
        <div className="mt-4 md:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Prices by Location Group</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendPrice({
                  locationGroupId: locationGroups[0].id,
                  price: 0,
                  mrp: 0,
                })
              }
              disabled={disabled || locationGroups.length === 0}
            >
              Add Price
            </Button>
          </div>
          {priceFields.length === 0 && (
            <p className="text-destructive text-sm mb-2">
              At least one price per location group is required.
            </p>
          )}
          {priceFields.map((priceField, priceIndex) => (
            <div
              key={priceField.id}
              className="border p-3 rounded-md flex items-center gap-4 mb-2"
            >
              <FormField
                control={control}
                name={`variants.${index}.variantPrices.${priceIndex}.locationGroupId`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Location Group</FormLabel>
                    <Select
                      disabled={disabled}
                      onValueChange={(val) => {
                        const currentPrices = getValues(
                          `variants.${index}.variantPrices`
                        );
                        if (
                          currentPrices.some(
                            (p, i) =>
                              i !== priceIndex && p.locationGroupId === val
                          )
                        ) {
                          toast.error(
                            `Price for '${
                              locationGroups.find((lg) => lg.id === val)?.name
                            }' already exists in this variant.`
                          );
                          return;
                        }
                        field.onChange(val);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location group" />
                      </SelectTrigger>
                      <SelectContent>
                        {locationGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`variants.${index}.variantPrices.${priceIndex}.mrp`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>MRP (INR)</FormLabel>
                    <FormControl>
                      <NumberInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter MRP"
                        disabled={disabled}
                        min={0}
                        step={1}
                      />
                    </FormControl>
                    <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`variants.${index}.variantPrices.${priceIndex}.price`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Price (INR)</FormLabel>
                    <FormControl>
                      <NumberInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter price"
                        disabled={disabled}
                        min={0}
                        step={1}
                      />
                    </FormControl>
                    <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removePrice(priceIndex)}
                disabled={disabled || priceFields.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <FormField
          control={control}
          name={`variants.${index}.media`}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Media (Images/Videos)</FormLabel>
              <MediaUpload
                value={field.value}
                disabled={disabled}
                onChange={field.onChange}
                onRemove={(url) =>
                  field.onChange(field.value.filter((m) => m.url !== url))
                }
              />
              <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
