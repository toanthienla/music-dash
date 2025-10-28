"use client";
import React from "react";
import { useDropzone } from "react-dropzone";

type DropzoneMp3Props = {
  onFileChange?: (file: File | null) => void;
};

const DropzoneMp3: React.FC<DropzoneMp3Props> = ({ onFileChange }) => {
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    console.log("Files dropped:", acceptedFiles);
    if (acceptedFiles && acceptedFiles.length && onFileChange) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      onFileChange(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/mp3": [".mp3"],
    },
  });

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (onFileChange) {
      onFileChange(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const truncateFileName = (name: string, maxLength: number = 30): string => {
    if (name.length <= maxLength) return name;
    const extension = name.substring(name.lastIndexOf("."));
    const nameWithoutExt = name.substring(0, name.lastIndexOf("."));
    const charsToKeep = maxLength - extension.length - 3;
    return nameWithoutExt.substring(0, charsToKeep) + "..." + extension;
  };

  return (
    <>
      {!uploadedFile ? (
        <div className="transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-lg hover:border-brand-500">
          <form
            {...getRootProps()}
            className={`dropzone rounded-lg border-dashed border-gray-200 p-6
          ${isDragActive
                ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
                : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
              }
        `}
            id="demo-upload-mp3"
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
                    viewBox="0 0 29 28"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M14.5 2C7.92 2 2.5 7.42 2.5 14s5.42 12 12 12 12-5.42 12-12S21.08 2 14.5 2zm0 22C8.98 24 4.5 19.52 4.5 14S8.98 4 14.5 4s10 4.48 10 10-4.48 10-10 10zm3.5-10c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5 1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5z" />
                  </svg>
                </div>
              </div>

              {/* Text Content */}
              <h4 className="mb-2 font-semibold text-gray-800 text-sm dark:text-white/90">
                {isDragActive ? "Drop MP3 File Here" : "Drag & Drop MP3 File Here"}
              </h4>

              <span className="text-center mb-3 block text-xs text-gray-600 dark:text-gray-400">
                or browse to upload
              </span>

              <span className="font-medium underline text-xs text-brand-500">
                Browse File
              </span>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            {/* Music Icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-500 dark:bg-brand-900/30 dark:text-brand-400 flex-shrink-0">
              <svg
                className="fill-current"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5 1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5z" />
              </svg>
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-0.5 break-words"
                title={uploadedFile.name}
              >
                {truncateFileName(uploadedFile.name, 30)}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formatFileSize(uploadedFile.size)}
              </p>
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemoveFile}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors flex-shrink-0"
              title="Remove file"
            >
              <svg
                className="fill-current"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" />
              </svg>
            </button>
          </div>

          {/* Success Badge */}
          <div className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg
              className="fill-current flex-shrink-0"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span className="text-xs font-medium">Ready to upload</span>
          </div>
        </div>
      )}
    </>
  );
};

export default DropzoneMp3;