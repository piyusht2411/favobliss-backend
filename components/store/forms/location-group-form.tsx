"use client";

import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { useState } from "react";
import { Location, LocationGroup } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Header } from "@/components/store/utils/header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { AlertModal } from "@/components/modals/alert-modal";
import { LocationGroupFormSchema } from "../../../schemas/location-group-form-schema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface LocationGroupFormProps {
  data: (LocationGroup & { locations: Location[] }) | null;
  locations: { id: string; pincode: string; city: string }[];
}

export const LocationGroupForm = ({
  data,
  locations,
}: LocationGroupFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const params = useParams();
  const router = useRouter();

  const title = data ? "Edit Location Group" : "Create Location Group";
  const description = data
    ? "Edit a location group"
    : "Add a new location group";
  const toastMessage = data
    ? "Location Group updated."
    : "Location Group created.";
  const actions = data ? "Save Changes" : "Create";

  const form = useForm<z.infer<typeof LocationGroupFormSchema>>({
    resolver: zodResolver(LocationGroupFormSchema),
    defaultValues: data
      ? {
          name: data.name,
          locationIds: data.locations.map((loc) => loc.id),
          isCodAvailable: data.isCodAvailable,
          deliveryDays: data.deliveryDays ?? 1,
          isExpressDelivery: data.isExpressDelivery ?? false,
          expressDeliveryText: data.expressDeliveryText ?? "",
        }
      : {
          name: "",
          locationIds: [],
          isCodAvailable: false,
          isExpressDelivery: false,
          deliveryDays: 1,
          expressDeliveryText: "",
        },
  });

  const onSubmit = async (values: z.infer<typeof LocationGroupFormSchema>) => {
    try {
      setLoading(true);

      if (data) {
        await axios.patch(
          `/api/${params.storeId}/location-group/${params.locationGroupId}`,
          values
        );
      } else {
        await axios.post(`/api/${params.storeId}/location-group`, values);
      }
      router.refresh();
      router.push(`/${params.storeId}/location-group`);
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
        `/api/${params.storeId}/location-group/${params.locationGroupId}`
      );
      router.refresh();
      router.push(`/${params.storeId}/location-group`);
      router.refresh();
      toast.success("Location Group deleted");
    } catch (error) {
      console.error(error);
      toast.error(
        "Make sure you removed all related locations and variant prices first."
      );
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
                      placeholder="Location Group Name"
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locationIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locations</FormLabel>
                  <FormControl>
                    <Popover open={comboOpen} onOpenChange={setComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboOpen}
                          className="w-full justify-between"
                          disabled={loading}
                        >
                          {field.value && field.value.length > 0
                            ? `${field.value.length} location(s) selected`
                            : "Select locations"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search locations..." />
                          <CommandList>
                            <CommandEmpty>No locations found.</CommandEmpty>
                            <CommandGroup>
                              {locations.map((location) => (
                                <CommandItem
                                  key={location.id}
                                  value={`${location.pincode} - ${location.city}`}
                                  onSelect={() => {
                                    const newValue = field.value?.includes(
                                      location.id
                                    )
                                      ? field.value.filter(
                                          (id) => id !== location.id
                                        )
                                      : [...(field.value || []), location.id];
                                    field.onChange(newValue);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value?.includes(location.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {location.pincode} - {location.city}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliveryDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      disabled={loading}
                      placeholder="Enter delivery days"
                      min="1"
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isCodAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Cash on Delivery</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enable Cash on Delivery for this location
                    </p>
                  </div>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isExpressDelivery"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Express Delivery</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enable Express Delivery on this location
                    </p>
                  </div>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expressDeliveryText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Express Delivery Text</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={loading}
                      placeholder="Express Delivery Test"
                    />
                  </FormControl>
                  <FormMessage className="w-full px-2 py-2 bg-destructive/20 text-destructive/70 rounded-md" />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {actions}
          </Button>
        </form>
      </Form>
    </>
  );
};
