"use client";

import * as z from "zod";
import { useState } from "react";
import { SpecificationGroup } from "@prisma/client";
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

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/store/utils/header";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { AlertModal } from "@/components/modals/alert-modal";
import { Trash2 } from "lucide-react";

const SpecificationGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

interface SpecificationGroupFormProps {
  data: SpecificationGroup | null;
}

export const SpecificationGroupForm = ({
  data,
}: SpecificationGroupFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  const title = data
    ? "Edit Specification Group"
    : "Create Specification Group";
  const description = data
    ? "Edit a specification group"
    : "Add a new specification group";
  const toastMessage = data
    ? "Specification group updated."
    : "Specification group created.";
  const actions = data ? "Save Changes" : "Create";

  const form = useForm<z.infer<typeof SpecificationGroupSchema>>({
    resolver: zodResolver(SpecificationGroupSchema),
    defaultValues: data
      ? {
          name: data.name,
        }
      : {
          name: "",
        },
  });

  const onSubmit = async (values: z.infer<typeof SpecificationGroupSchema>) => {
    try {
      setLoading(true);

      if (data) {
        await axios.patch(
          `/api/${params.storeId}/specification-groups/${params.groupId}`,
          values
        );
      } else {
        await axios.post(`/api/${params.storeId}/specification-groups`, values);
      }
      router.refresh();
      router.push(`/${params.storeId}/specification-groups`);
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
        `/api/${params.storeId}/specification-groups/${params.groupId}`
      );
      router.refresh();
      router.push(`/${params.storeId}/specification-groups`);
      router.refresh();
      toast.success("Specification group deleted");
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
                    placeholder="Specification group name"
                  />
                </FormControl>
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
