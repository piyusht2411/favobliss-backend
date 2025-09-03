"use client";

import * as z from "zod";
import { useState } from "react";
import { SpecificationField, SpecificationGroup } from "@prisma/client";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";

import {
  Form,
  FormControl,
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

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/store/utils/header";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { AlertModal } from "@/components/modals/alert-modal";
import { Trash2 } from "lucide-react";

const SpecificationFieldSchema = z.object({
  name: z.string().min(1, "Name is required"),
  groupId: z.string().min(1, "Group is required"),
});

interface SpecificationFieldFormProps {
  data: (SpecificationField & { group: SpecificationGroup }) | null;
  groups: SpecificationGroup[];
}

export const SpecificationFieldForm = ({
  data,
  groups,
}: SpecificationFieldFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  const title = data
    ? "Edit Specification Field"
    : "Create Specification Field";
  const description = data
    ? "Edit a specification field"
    : "Add a new specification field";
  const toastMessage = data
    ? "Specification field updated."
    : "Specification field created.";
  const actions = data ? "Save Changes" : "Create";

  const form = useForm<z.infer<typeof SpecificationFieldSchema>>({
    resolver: zodResolver(SpecificationFieldSchema),
    defaultValues: data
      ? {
          name: data.name,
          groupId: data.groupId,
        }
      : {
          name: "",
          groupId: "",
        },
  });

  const onSubmit = async (values: z.infer<typeof SpecificationFieldSchema>) => {
    try {
      setLoading(true);

      if (data) {
        await axios.patch(
          `/api/${params.storeId}/specification-fields/${params.fieldId}`,
          values
        );
      } else {
        await axios.post(`/api/${params.storeId}/specification-fields`, values);
      }
      router.refresh();
      router.push(`/${params.storeId}/specification-fields`);
      router.refresh();
      toast.success(toastMessage);
    } catch (error) {
      console.log(error);
      toast.error("Internal server error");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(
        `/api/${params.storeId}/specification-fields/${params.fieldId}`
      );
      router.refresh();
      router.push(`/${params.storeId}/specification-fields`);
      router.refresh();
      toast.success("Specification field deleted");
    } catch (error) {
      console.error(error);
      toast.error("Internal server error");
    } finally {
      setLoading(false);
    }
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
                    placeholder="Specification field name"
                  />
                </FormControl>
                <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="groupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group</FormLabel>
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
                        placeholder="Select a group"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {groups.map((group) => (
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
          <Button type="submit" disabled={loading}>
            {actions}
          </Button>
        </form>
      </Form>
    </>
  );
};
