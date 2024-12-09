"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2, ArrowUpDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Cloudinary } from "@cloudinary/url-gen";
import { quality, format } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import { fill } from "@cloudinary/url-gen/actions/resize";

interface ModernImageUploadProps {
  onChange: (urls: { main: string; additional: string[] }) => void;
  value?: { main: string; additional: string[] };
  className?: string;
}

// Initialize Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dkdscxzz7",
  },
});

export function ModernImageUpload({
  onChange,
  value = { main: "", additional: [] },
  className,
}: ModernImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ""
    );

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error.message}`);
      }

      const data = await response.json();

      // Create an optimized image URL using the SDK
      const optimizedImage = cld
        .image(data.public_id)
        .delivery(quality(auto()))
        .delivery(format("auto"))
        .resize(fill().width(1200).height(800));

      return optimizedImage.toURL();
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      throw error;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      setError(null);

      try {
        const validFiles = acceptedFiles.filter(
          (file) => file.size <= 10 * 1024 * 1024
        );

        if (validFiles.length < acceptedFiles.length) {
          setError("Some files were skipped because they exceed 10MB");
        }

        const uploadPromises = validFiles.map(uploadToCloudinary);
        const newUrls = await Promise.all(uploadPromises);

        const updatedImages = {
          main: value.main || newUrls[0] || "",
          additional: [
            ...value.additional,
            ...(value.main ? newUrls : newUrls.slice(1)),
          ],
        };

        onChange(updatedImages);
      } catch (err) {
        setError("Failed to upload images. Please try again.");
        console.error("Upload error:", err);
      } finally {
        setUploading(false);
      }
    },
    [value, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".avif"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  const removeImage = (index: number, isMain: boolean = false) => {
    if (isMain) {
      const newMain = value.additional[0] || "";
      onChange({
        main: newMain,
        additional: value.additional.slice(1),
      });
    } else {
      onChange({
        main: value.main,
        additional: value.additional.filter((_, i) => i !== index),
      });
    }
  };

  const makeMainImage = (index: number) => {
    const oldMain = value.main;
    const newMain = value.additional[index];
    const newAdditional = [...value.additional];
    newAdditional.splice(index, 1);

    if (oldMain) {
      newAdditional.unshift(oldMain);
    }

    onChange({
      main: newMain,
      additional: newAdditional,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-gray-300 hover:border-primary"
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
            <p className="text-sm text-gray-600">
              Uploading and optimizing images...
            </p>
          </div>
        ) : (
          <>
            <ImageIcon className="w-10 h-10 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600">
              Drag & drop images here, or click to select files
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Maximum file size: 10MB. Supported formats: PNG, JPG, JPEG, WebP,
              AVIF
            </p>
          </>
        )}
      </div>

      {(value.main || value.additional.length > 0) && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Uploaded Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.main && (
              <div className="relative group">
                <img
                  src={value.main}
                  alt="Main"
                  className="w-full aspect-square object-cover rounded-lg ring-2 ring-primary"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeImage(0, true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Main
                </span>
              </div>
            )}

            {value.additional.map((url, index) => (
              <div key={url} className="relative group">
                <img
                  src={url}
                  alt={`Additional ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => makeMainImage(index)}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeImage(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
