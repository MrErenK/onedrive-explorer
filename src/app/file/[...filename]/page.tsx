"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { formatFileSize, getFileExtension } from "@/utils/fileUtils";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/Icons";
import toast from "react-hot-toast";
import LoadingBar from "@/components/LoadingBar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface FileDetails {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  lastModifiedDateTime: string;
  webUrl: string;
}

export default function FilePage() {
  const params = useParams();
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const filePath = Array.isArray(params.filename)
    ? params.filename.join("/")
    : params.filename;

  useEffect(() => {
    const fetchFileDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/onedrive?action=item&path=${encodeURIComponent(filePath)}`,
        );
        if (!response.ok) throw new Error("Failed to fetch file details");
        const data = await response.json();
        setFileDetails(data);
      } catch (err) {
        setError("Failed to load file details");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileDetails();
  }, [filePath]);

  const handleDownload = () => {
    window.open(
      `/api/onedrive?action=download&path=${encodeURIComponent(filePath)}`,
      "_blank",
    );
  };

  const handleCopyLink = useCallback(() => {
    if (!isCopying) {
      setIsCopying(true);
      navigator.clipboard
        .writeText(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/onedrive?action=download&path=${encodeURIComponent(filePath)}`,
        )
        .then(() => toast.success("Link copied to clipboard"))
        .catch((err) => toast.error("Failed to copy link"))
        .finally(() => {
          setTimeout(() => setIsCopying(false), 500); // Debounce for 500ms
        });
    }
  }, [isCopying, filePath]);

  if (isLoading)
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-screen flex flex-col justify-center items-center">
        <LoadingBar />
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-secondary-light dark:text-secondary-dark text-lg sm:text-xl font-medium animate-pulse mt-4">
            Loading file details...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 animate-pulse">
            This may take a moment
          </p>
        </div>
      </div>
    );

  if (error)
    return <div className="text-red-500 dark:text-red-400">{error}</div>;
  if (!fileDetails)
    return (
      <div className="text-text-light dark:text-text-dark">
        No file details available
      </div>
    );

  const parentPath = filePath.split("/").slice(0, -1).join("/");
  const parentName = parentPath.split("/").pop() || "Files";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-primary-light dark:text-primary-dark">
        {fileDetails.name}
      </h1>
      <Link
        href={`/files/${parentPath}`}
        className="inline-flex items-center text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors mb-4"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        <span>Back to {parentName}</span>
      </Link>
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Size</p>
            <p className="font-semibold text-text-light dark:text-text-dark">
              {typeof fileDetails.size === "number"
                ? formatFileSize(fileDetails.size)
                : "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Type</p>
            <p className="font-semibold text-text-light dark:text-text-dark">
              {getFileExtension(fileDetails.name)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Last Modified</p>
            <p className="font-semibold text-text-light dark:text-text-dark">
              {fileDetails.lastModifiedDateTime
                ? new Date(fileDetails.lastModifiedDateTime).toLocaleString()
                : "Unknown"}
            </p>
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleDownload}
            className="bg-primary-light dark:bg-primary-dark hover:bg-gray-800 dark:hover:bg-gray-200 text-text-dark dark:text-text-light font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Download
          </button>
          <button
            onClick={handleCopyLink}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded transition-colors duration-200"
            disabled={isCopying}
          >
            Copy Link
          </button>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-primary-light dark:text-primary-dark">
          File Preview
        </h2>
        <div className="bg-gray-100 dark:bg-gray-800 h-64 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-secondary-light dark:text-secondary-dark">
            File preview will be implemented here
          </p>
        </div>
      </div>
    </div>
  );
}
