"use client";

import * as z from "zod";
import { useState, useEffect } from "react";
import { SubCategory, Category } from "@prisma/client";
import { useForm } from "react-hook-form";
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

import { Trash2, PlusCircle, X } from "lucide-react";
import { Header } from "@/components/store/utils/header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { AlertModal } from "@/components/modals/alert-modal";
import { SubCategorySchema } from "@/schemas/subcategory-form-schema";
import { SingleImageUpload } from "../utils/single-image-upload";

interface SubCategoryFormProps {
  initialData: SubCategory | null;
  categories: Category[];
  subCategories: SubCategory[];
}

export const SubCategoryForm = ({
  initialData,
  categories,
  subCategories,
}: SubCategoryFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  const title = initialData ? "Edit Subcategory" : "Create Subcategory";
  const description = initialData
    ? "Edit a subcategory"
    : "Add a new subcategory";
  const toastMessage = initialData
    ? "Subcategory updated."
    : "Subcategory created.";
  const action = initialData ? "Save Changes" : "Create";

  const form = useForm<z.infer<typeof SubCategorySchema>>({
    resolver: zodResolver(SubCategorySchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug || "",
          bannerImage: initialData.bannerImage,
          description: initialData.description || "",
          icon: initialData.icon || "",
          categoryId: initialData.categoryId,
          parentId: initialData.parentId || undefined,
          reviewCategories: Array.isArray(initialData.reviewCategories)
            ? initialData.reviewCategories
                .filter(
                  (cat) => cat && typeof cat === "object" && "name" in cat
                )
                .map((cat: any) => ({ name: String(cat.name ?? "") }))
            : [],
        }
      : {
          name: "",
          slug: "",
          icon: "",
          bannerImage: "",
          description: "",
          categoryId: "",
          parentId: undefined,
          reviewCategories: [],
        },
  });

  const { watch, setValue } = form;
  const parentId = watch("parentId");

  // Prefill categoryId based on parentId
  useEffect(() => {
    if (parentId && parentId !== "none") {
      const parentSubCategory = subCategories.find(
        (sub) => sub.id === parentId
      );
      if (parentSubCategory) {
        setValue("categoryId", parentSubCategory.categoryId);
      }
    }
  }, [parentId, subCategories, setValue]);

  const onSubmit = async (values: z.infer<typeof SubCategorySchema>) => {
    try {
      setLoading(true);

      // Validate parentId to prevent cycles
      if (values.parentId && initialData?.id === values.parentId) {
        toast.error("A subcategory cannot be its own parent.");
        return;
      }

      // Map "none" to null for parentId
      const submitValues = {
        ...values,
        parentId: values.parentId === "none" ? null : values.parentId,
      };

      if (initialData) {
        await axios.patch(
          `/api/${params.storeId}/subcategories/${params.subCategoryId}`,
          submitValues
        );
      } else {
        await axios.post(`/api/${params.storeId}/subcategories`, submitValues);
      }
      router.refresh();
      router.push(`/${params.storeId}/subcategories`);
      toast.success(toastMessage);
    } catch (error: any) {
      console.log("[SUBCATEGORY_FORM]", error);
      if (
        error.response?.status === 400 &&
        error.response?.data === "Slug already exists"
      ) {
        form.setError("slug", {
          type: "manual",
          message: "Slug already exists. Please choose a different slug.",
        });
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(
        `/api/${params.storeId}/subcategories/${params.subCategoryId}`
      );
      router.refresh();
      router.push(`/${params.storeId}/subcategories`);
      toast.success("Subcategory deleted.");
    } catch (error) {
      console.log("[SUBCATEGORY_DELETE]", error);
      toast.error(
        "Make sure to remove all products using this subcategory first."
      );
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  // Function to add a new review category
  const addReviewCategory = () => {
    const currentCategories = form.getValues("reviewCategories") || [];
    form.setValue("reviewCategories", [...currentCategories, { name: "" }]);
  };

  // Function to remove a review category
  const removeReviewCategory = (index: number) => {
    const currentCategories = form.getValues("reviewCategories") || [];
    form.setValue(
      "reviewCategories",
      currentCategories.filter((_, i) => i !== index)
    );
  };

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
        {initialData && (
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={loading}
                      placeholder="Subcategory name"
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={loading}
                      placeholder="Subcategory slug"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    The slug must be unique, contain only lowercase letters,
                    numbers, and hyphens, and be at most 60 characters long.
                  </FormDescription>
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
                    disabled={loading || (!!parentId && parentId !== "none")}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripiton</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={loading}
                      placeholder="Enter Description"
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Subcategory</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value || "none"}
                    defaultValue={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value || "none"}
                          placeholder="Select a parent subcategory (optional)"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {subCategories
                        .filter((sub) => sub.id !== initialData?.id)
                        .map((subCategory) => (
                          <SelectItem
                            key={subCategory.id}
                            value={subCategory.id}
                          >
                            {subCategory.name}
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
              name="bannerImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <FormControl>
                    <SingleImageUpload
                      value={field.value || ""}
                      disabled={loading}
                      onChange={(url) => field.onChange(url)}
                      onRemove={() => field.onChange("")}
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <SingleImageUpload
                      value={field.value || ""}
                      disabled={loading}
                      onChange={(url) => field.onChange(url)}
                      onRemove={() => field.onChange("")}
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <FormField
                control={form.control}
                name="reviewCategories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Categories</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {(field.value || []).map(
                          (category: { name: string }, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={category.name}
                                onChange={(e) => {
                                  const newCategories = [...field.value];
                                  newCategories[index] = {
                                    name: e.target.value,
                                  };
                                  field.onChange(newCategories);
                                }}
                                placeholder={`Review category ${index + 1}`}
                                disabled={loading}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeReviewCategory(index)}
                                disabled={loading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addReviewCategory}
                          disabled={loading}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Review Category
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground">
                      Add categories for users to rate when reviewing products
                      in this subcategory (e.g., Battery, Camera, Display).
                    </FormDescription>
                    <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
