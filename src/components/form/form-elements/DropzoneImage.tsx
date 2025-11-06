"use client";
import React, { useEffect } from "react";
import { useDropzone } from "react-dropzone";

type DropzoneImageProps = {
  onFileChange?: (file: File | null) => void;
  preview?: string | null;
};

const DropzoneImage: React.FC<DropzoneImageProps> = ({ onFileChange, preview: initialPreview }) => {
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(initialPreview || null);
  const [isRemoved, setIsRemoved] = React.useState<boolean>(false);

  // Sync preview when initialPreview changes (e.g., when editing a group)
  useEffect(() => {
    if (!isRemoved) {
      setPreview(initialPreview || null);
      setUploadedFile(null);
    }
  }, [initialPreview, isRemoved]);

  const onDrop = (acceptedFiles: File[]) => {
    console.log("Files dropped:", acceptedFiles);
    if (acceptedFiles && acceptedFiles.length && onFileChange) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setIsRemoved(false);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      onFileChange(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
    },
  });

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setPreview(null);
    setIsRemoved(true);
    if (onFileChange) {
      onFileChange(null);
    }
  };

  // Show upload UI only if there's no preview
  const showUploadUI = !preview;

  return (
    <>
      {showUploadUI ? (
        <div className="transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-lg hover:border-brand-500">
          <div
            {...getRootProps()}
            className={`dropzone rounded-lg border-dashed border-gray-200 p-6
          ${isDragActive
                ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
                : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
              }
        `}
            id="demo-upload-image"
          >
            {/* Hidden Input */}
            <input {...getInputProps()} />

            <div className="dz-message flex flex-col items-center">
              {/* Icon Container */}
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <svg
                    className="fill-current"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                </div>
              </div>

              {/* Text Content */}
              <h4 className="mb-2 font-semibold text-gray-800 text-sm dark:text-white/90">
                {isDragActive ? "Drop Image Here" : "Drag & Drop Image Here"}
              </h4>

              <span className="text-center mb-3 block text-xs text-gray-600 dark:text-gray-400">
                or browse to upload
              </span>

              <span className="font-medium underline text-xs text-brand-500">
                Browse File
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Image Preview */}
          {preview && (
            <div className="relative">
              <img
                src={preview}
                alt="Cover preview"
                className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  console.error("Image failed to load:", preview);
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-md hover:bg-white/70 dark:hover:bg-gray-900/70 transition-colors border border-white/20 dark:border-gray-700/20"
                title="Remove image"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DropzoneImage;