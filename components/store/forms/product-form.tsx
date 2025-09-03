"use client";

import * as z from "zod";
import { useState } from "react";
import {
  Brand,
  Category,
  Color,
  Product,
  Size,
  SubCategory,
  SpecificationField,
  Variant,
  VariantImage,
  LocationGroup,
} from "@prisma/client";
import { useForm, FieldError, useFormContext, useFieldArray } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Trash2 } from "lucide-react";
import { Header } from "@/components/store/utils/header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductFeatures } from "@/components/store/utils/product-features";
import { ProductSchema } from "@/schemas/product-form-schema";
import { Switch } from "@/components/ui/switch";
import VariantForm from "./variant-form";
import { useParams, useRouter } from "next/navigation";
import { AlertModal } from "@/components/modals/alert-modal";
import { Input } from "@/components/ui/input";

const getSubCategoryName = (
  subCategory: SubCategory,
  subCategories: SubCategory[]
): string => {
  if (!subCategory.parentId) return subCategory.name;
  const parent = subCategories.find((sub) => sub.id === subCategory.parentId);
  return parent
    ? `${getSubCategoryName(parent, subCategories)} > ${subCategory.name}`
    : subCategory.name;
};

interface ProductFormProps {
  data:
    | (Product & {
        brand: Brand | null;
        variants: (Variant & {
          images: (VariantImage & { mediaType: "IMAGE" | "VIDEO" })[];
          variantPrices: {
            locationGroupId: string;
            price: number;
            mrp: number;
          }[];
          variantSpecifications: {
            specificationFieldId: string;
            value: string;
          }[];
        })[];
      })
    | null;
  brands: Brand[];
  categories: Category[];
  subCategories: SubCategory[];
  sizes: Size[];
  colors: Color[];
  specificationFields: (SpecificationField & { group: { name: string } })[];
  locationGroups: LocationGroup[];
}

export const ProductForm = ({
  data,
  brands,
  categories,
  subCategories,
  sizes,
  colors,
  specificationFields,
  locationGroups,
}: ProductFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  const title = data ? "Edit Product" : "Create Product";
  const description = data ? "Edit a product" : "Add a new product";
  const toastMessage = data ? "Product updated." : "Product created.";
  const actions = data ? "Save Changes" : "Create";

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
    defaultValues: data
      ? {
          ...data,
          brandId: data.brandId ?? undefined,
          sizeAndFit: data.sizeAndFit || [],
          materialAndCare: data.materialAndCare || [],
          enabledFeatures: data.enabledFeatures || [],
          expressDelivery: data.expressDelivery || false,
          warranty: data.warranty || "",
          isFeatured: data.isFeatured || false,
          isNewArrival: data.isNewArrival || false,
          isArchieved: data.isArchieved || false,
          categoryId: data.categoryId ?? undefined,
          subCategoryId: data.subCategoryId ?? undefined,
          variants: data.variants.map((v: any) => ({
            ...v,
            media: v.images.map((img: any) => ({
              url: img.url,
              mediaType: img.mediaType || "IMAGE",
            })),
            specifications: v.variantSpecifications || [],
            variantPrices: v.variantPrices || [],
          })),
        }
      : {
          brandId: undefined,
          sizeAndFit: [],
          materialAndCare: [],
          enabledFeatures: [],
          expressDelivery: false,
          warranty: "",
          isFeatured: false,
          isNewArrival: false,
          isArchieved: false,
          categoryId: "",
          subCategoryId: undefined,
          variants: [
            {
              name: "",
              slug: "",
              about: "",
              description: "",
              metaTitle: "",
              metaDescription: "",
              metaKeywords: [],
              openGraphImage: "",
              stock: 0,
              media: [],
              sizeId: undefined,
              colorId: undefined,
              sku: "",
              hsn: "",
              tax: 0,
              gstIn: "",
              specifications: [],
              variantPrices:
                locationGroups.length > 0
                  ? [
                      {
                        locationGroupId: locationGroups[0].id,
                        price: 0,
                        mrp: 0,
                      },
                    ]
                  : [],
            },
          ],
        },
  });
  // console.log("Form values:", values);
  console.log("Form errors:", form.formState.errors);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const onSubmit = async (values: z.infer<typeof ProductSchema>) => {
    if (locationGroups.length === 0) {
      toast.error("No location groups available. Please add at least one.");
      return;
    }

    const hasValidPrices = values.variants.every(
      (variant) => variant.variantPrices.length > 0
    );
    if (!hasValidPrices) {
      toast.error(
        "Each variant must have at least one price for a location group."
      );
      return;
    }

    try {
      setLoading(true);

      const submitValues = {
        ...values,
        subCategoryId:
          values.subCategoryId === "none" ? undefined : values.subCategoryId,
      };

      if (data) {
        await axios.patch(
          `/api/${params.storeId}/products/${params.productId}`,
          submitValues
        );
      } else {
        await axios.post(`/api/${params.storeId}/products`, submitValues);
      }
      router.refresh();
      router.push(`/${params.storeId}/products`);
      router.refresh();
      toast.success(toastMessage);
    } catch (error: any) {
      console.log(error);
      if (
        error.response?.status === 400 &&
        error.response?.data === "Slug or SKU or HSN already exists"
      ) {
        toast.error(
          "Slug, SKU, or HSN already exists. Please choose different values."
        );
      } else {
        toast.error("Internal server error");
      }
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/products/${params.productId}`);
      router.refresh();
      router.push(`/${params.storeId}/products`);
      router.refresh();
      toast.success("Product deleted");
    } catch (error) {
      console.error(error);
      toast.error("Internal server error");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryId = form.watch("categoryId");

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        loading={loading}
        onConfirm={onDelete}
      />
      <div className="flex items-center justify-between">
        <Header title={title} description={description} />
        {data && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash2 />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value === null ? undefined : field.value}
                    defaultValue={
                      field.value === null ? undefined : field.value
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={
                            field.value === null ? undefined : field.value
                          }
                          placeholder="Select a brand"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value}
                          placeholder="Select a category"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={
                      field.value === null ? undefined : field.value || "none"
                    }
                    defaultValue={
                      field.value === null ? undefined : field.value || "none"
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value || "none"}
                          placeholder="Select a subcategory"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {subCategories
                        .filter(
                          (sub) =>
                            !selectedCategoryId ||
                            sub.categoryId === selectedCategoryId
                        )
                        .map((subCategory) => (
                          <SelectItem
                            key={subCategory.id}
                            value={subCategory.id}
                          >
                            {getSubCategoryName(subCategory, subCategories)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="warranty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warranty</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={loading}
                      placeholder="Warranty information (e.g., 1 year)"
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expressDelivery"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                  <div className="space-y-1 leading-none">
                    <FormLabel>Express Delivery</FormLabel>
                    <FormDescription>
                      Enable express delivery for this product
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isNewArrival"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                  <div className="space-y-1 leading-none">
                    <FormLabel>New Arrival</FormLabel>
                    <FormDescription>
                      This product will be marked as a new arrival
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                  <div className="space-y-1 leading-none">
                    <FormLabel>Featured</FormLabel>
                    <FormDescription>
                      This product will appear as Favobliss choice
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isArchieved"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                  <div className="space-y-1 leading-none">
                    <FormLabel>Archived</FormLabel>
                    <FormDescription>
                      This product will not be visible to customers
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="sizeAndFit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size and Fit</FormLabel>
                <FormControl>
                  <ProductFeatures
                    value={field.value || []}
                    disabled={loading}
                    onChange={(value) =>
                      field.onChange([...(field.value || []), value])
                    }
                    onRemove={(value) =>
                      field.onChange(
                        (field.value || []).filter((data) => data !== value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="materialAndCare"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material and Care</FormLabel>
                <FormControl>
                  <ProductFeatures
                    value={field.value || []}
                    disabled={loading}
                    onChange={(value) =>
                      field.onChange([...(field.value || []), value])
                    }
                    onRemove={(value) =>
                      field.onChange(
                        (field.value || []).filter((data) => data !== value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="enabledFeatures"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enabled Features</FormLabel>
                <FormControl>
                  <ProductFeatures
                    value={field.value || []}
                    disabled={loading}
                    onChange={(value) =>
                      field.onChange([...(field.value || []), value])
                    }
                    onRemove={(value) =>
                      field.onChange(
                        (field.value || []).filter((data) => data !== value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Variants</FormLabel>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <VariantForm
                  key={field.id}
                  index={index}
                  remove={() => remove(index)}
                  sizes={sizes}
                  colors={colors}
                  specificationFields={specificationFields}
                  locationGroups={locationGroups}
                  disabled={loading}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  name: "",
                  slug: "",
                  about: "",
                  description: "",
                  metaTitle: "",
                  metaDescription: "",
                  metaKeywords: [],
                  openGraphImage: "",
                  stock: 0,
                  media: [],
                  sizeId: undefined,
                  colorId: undefined,
                  sku: "",
                  hsn: "",
                  tax: 0,
                  gstIn: "",
                  specifications: [],
                  variantPrices:
                    locationGroups.length > 0
                      ? [
                          {
                            locationGroupId: locationGroups[0].id,
                            price: 0,
                            mrp: 0,
                          },
                        ]
                      : [],
                })
              }
              disabled={loading || locationGroups.length === 0}
            >
              Add Variant
            </Button>
            <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
          </FormItem>
          <Button type="submit" disabled={loading}>
            {actions}
          </Button>
        </form>
      </Form>
    </>
  );
};