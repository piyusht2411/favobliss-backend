"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { ImagePlusIcon, Trash, Grip } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MediaUploadProps {
  value: Array<{ url: string; mediaType: "IMAGE" | "VIDEO" }>;
  disabled: boolean;
  onChange: (
    value: Array<{ url: string; mediaType: "IMAGE" | "VIDEO" }>
  ) => void;
  onRemove: (url: string) => void;
}

interface SortableMediaItemProps {
  media: { url: string; mediaType: "IMAGE" | "VIDEO" };
  index: number;
  disabled: boolean;
  loading: boolean;
  onRemove: (url: string) => void;
}

const SortableMediaItem = ({
  media,
  index,
  disabled,
  loading,
  onRemove,
}: SortableMediaItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative w-[200px] h-[220px] rounded-md overflow-hidden border-2 border-transparent transition"
    >
      <div
        {...listeners}
        className="z-10 absolute top-2 left-2 cursor-grab active:cursor-grabbing"
      >
        <span className="bg-white p-1 flex rounded-lg">
          <Grip className="h-5 w-5 text-black" />
        </span>
      </div>
      <div className="z-10 absolute top-2 right-2">
        <Button
          variant="destructive"
          size="icon"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(media.url);
          }}
          disabled={disabled || loading}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
      {media.mediaType === "VIDEO" ? (
        <video
          src={media.url}
          controls
          className="w-full h-full object-cover"
        />
      ) : (
        <Image
          fill
          className="object-cover"
          alt="Uploaded image"
          src={media.url}
        />
      )}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {media.mediaType}
      </div>
    </div>
  );
};

export const MediaUpload = ({
  value,
  disabled,
  onChange,
  onRemove,
}: MediaUploadProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<"IMAGE" | "VIDEO">(
    "IMAGE"
  );
  const [loading, setLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [widgetKey, setWidgetKey] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setUploadQueue([]);
    };
  }, []);

  useEffect(() => {
    setWidgetKey((prev) => prev + 1);
  }, [selectedMediaType]);

  const onUpload = (result: any) => {
    if (result.event === "success") {
      const newUrl = result.info.secure_url;
      setUploadQueue((prev) => prev.filter((url) => url !== newUrl));
      onChange([...value, { url: newUrl, mediaType: selectedMediaType }]);
      toast.success(`${selectedMediaType.toLowerCase()} uploaded successfully`);
    } else if (result.event === "error") {
      setUploadQueue((prev) =>
        prev.filter((url) => url !== result.info?.secure_url)
      );
      toast.error(`Failed to upload ${selectedMediaType.toLowerCase()}`);
      console.error("[MEDIA_UPLOAD_ERROR]", result.info);
    }
    if (uploadQueue.length === 0) {
      setLoading(false);
    }
  };

  const onUploadStart = (file: any) => {
    setLoading(true);
    setUploadQueue((prev) => [...prev, file.name]);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = value.findIndex((item) => item.url === active.id);
    const newIndex = value.findIndex((item) => item.url === over.id);

    const reorderedMedia = [...value];
    const [movedItem] = reorderedMedia.splice(oldIndex, 1);
    reorderedMedia.splice(newIndex, 0, movedItem);

    onChange(reorderedMedia);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div>
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={value.map((item) => item.url)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="mb-4 flex items-center gap-4 flex-wrap">
            {value.map((media, index) => (
              <SortableMediaItem
                key={media.url}
                media={media}
                index={index}
                disabled={disabled}
                loading={loading}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex items-center gap-4">
        <Select
          value={selectedMediaType}
          onValueChange={(value: "IMAGE" | "VIDEO") => {
            setSelectedMediaType(value);
            setUploadQueue([]);
          }}
          disabled={disabled || loading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select media type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IMAGE">Image</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
          </SelectContent>
        </Select>
        <CldUploadWidget
          key={widgetKey}
          onUpload={onUpload}
          onQueuesStart={(files: any) => {
            files.files.forEach((file: any) => onUploadStart(file));
          }}
          uploadPreset="manav-ecom"
          options={{
            sources: ["local", "url", "camera"],
            multiple: true,
            maxFiles: 5,
            resourceType: selectedMediaType.toLowerCase(),
            folder:
              selectedMediaType === "VIDEO"
                ? "product_videos"
                : "product_images",
            clientAllowedFormats:
              selectedMediaType === "VIDEO"
                ? ["mp4", "webm", "mov"]
                : ["jpg", "png", "jpeg", "gif", "webp"],
            //@ts-ignore
            accept: selectedMediaType === "VIDEO" ? "video/*" : "image/*",
            maxFileSize: selectedMediaType === "VIDEO" ? 100000000 : 10000000,
          }}
        >
          {({ open }) => {
            const onClick = () => {
              if (!loading) {
                open();
              }
            };
            return (
              <Button
                type="button"
                disabled={disabled || loading}
                onClick={onClick}
                variant="secondary"
              >
                <ImagePlusIcon className="h-4 w-4 mr-2" />
                Upload {selectedMediaType === "VIDEO" ? "Video" : "Image"}
              </Button>
            );
          }}
        </CldUploadWidget>
      </div>
    </div>
  );
};
