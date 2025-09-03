"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { ImagePlusIcon, Trash } from "lucide-react";

interface ImageUploadProps {
  value: string; // Changed from string[] to string
  disabled: boolean;
  onChange: (value: string) => void; // Changed to accept string
  onRemove: () => void; // Simplified since no need to pass a specific URL
}

export const SingleImageUpload = ({
  value,
  disabled,
  onChange,
  onRemove,
}: ImageUploadProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onUpload = (result: any) => {
    const newUrl = result.info.secure_url;
    onChange(newUrl); // Set the new URL directly
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        {value && ( // Only render if there is a value
          <div className="relative w-[200px] h-[220px] rounded-md overflow-hidden">
            <div className="z-10 absolute top-2 right-2">
              <Button
                variant="destructive"
                size="icon"
                type="button"
                onClick={onRemove}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            <Image fill className="object-cover" alt="Image" src={value} />
          </div>
        )}
      </div>
      <CldUploadWidget onUpload={onUpload} uploadPreset="manav-ecom">
        {({ open }) => {
          const onClick = () => {
            open();
          };
          return (
            <Button
              type="button"
              disabled={disabled || !!value} // Disable button if an image is already uploaded
              onClick={onClick}
              variant="secondary"
            >
              <ImagePlusIcon className="h-4 w-4 mr-2" />
              Upload an Image
            </Button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
};
