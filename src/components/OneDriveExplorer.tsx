"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { useRouter, useParams } from "next/navigation";
import LoadingBar from "./LoadingBar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DriveItemList } from "@/components/DriveListItem";
import SearchBar from "@/components/SearchBar";
import toast from "react-hot-toast";
import { getDriveContents, TokenExpiredError } from "@/lib/graph";
import LoadingSpinner from "./LoadingSpinner";
import { getServerTokens } from "@/lib/getServerTokens";
import { motion, AnimatePresence } from "framer-motion";
import { ExclamationCircleIcon } from "@/components/Icons";

interface DriveItem {
  id: string;
  name: string;
  folder?: {};
  file?: {
    mimeType: string;
  };
  size: number;
  lastModifiedDateTime: string;
}

interface OneDriveExplorerProps {
  initialTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  onPathNotFound?: () => void;
}

export default function OneDriveExplorer({
  initialTokens,
  onPathNotFound,
}: OneDriveExplorerProps) {
  const [tokens, setTokens] = useState(initialTokens);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DriveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const params = useParams();
  const scrollPositionRef = useRef<number>(0);
  const [pathNotFound, setPathNotFound] = useState(false);
  const currentPath = Array.isArray(params.path) ? params.path.join("/") : "";

  useEffect(() => {
    async function fetchTokens() {
      try {
        const fetchedTokens = await getServerTokens();
        if (fetchedTokens) {
          setTokens(fetchedTokens);
        } else {
          throw new Error("Tokens not received");
        }
      } catch (error) {
        console.error("Failed to fetch tokens:", error);
        toast.error(
          "Failed to fetch authentication tokens. Please try logging in again. Redirecting to login page...",
        );
        setTimeout(() => {
          router.push("/login");
        }, 500);
      }
    }

    if (!tokens) {
      fetchTokens();
    }
  }, [tokens, router]);

  const sendRefreshTokenRequest = useCallback(async () => {
    const response = await fetch("/api/onedrive");
    if (response.ok) {
      toast.success("Token refreshed successfully.");
      router.push(currentPath);
    } else {
      toast.error("Failed to refresh token. Redirecting to login page...");
      setTimeout(() => {
        router.push("/login");
      }, 500);
    }
  }, [router, currentPath]);

  const fetchItems = useCallback(
    async (path: string) => {
      if (!tokens?.accessToken) return;

      setIsLoading(true);
      try {
        const data = await getDriveContents(tokens.accessToken, path);
        if (data === null) {
          setPathNotFound(true);
          onPathNotFound?.(); // Call the callback if provided
        } else {
          setItems(data);
          setFilteredItems(data);
          setPathNotFound(false);
        }
      } catch (error) {
        if (error instanceof TokenExpiredError) {
          toast.error("Session has expired. Trying token refresh...");
          await sendRefreshTokenRequest();
        } else {
          toast.error(
            "An error occurred while fetching items. Trying to refresh token...",
          );
          await sendRefreshTokenRequest();
          console.error("Error fetching items:", error);
          setPathNotFound(true);
          onPathNotFound?.(); // Call the callback if provided
        }
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    },
    [tokens?.accessToken, onPathNotFound, sendRefreshTokenRequest],
  );

  useEffect(() => {
    fetchItems(currentPath);
  }, [currentPath, fetchItems]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredItems(filtered);
    }
  }, [items, searchQuery]);

  const handleItemClick = useCallback(
    (item: DriveItem) => {
      // Save current scroll position
      scrollPositionRef.current = window.pageYOffset;

      if (item.folder) {
        const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        setIsLoading(true);
        router.replace(`/files/${newPath}`);
      } else {
        // Navigate to the file details page
        const filePath = currentPath
          ? `${currentPath}/${item.name}`
          : item.name;
        setIsLoading(true);
        router.push(`/file/${filePath}`);
      }
    },
    [currentPath, router],
  );

  useLayoutEffect(() => {
    // Restore scroll position after the component has rendered
    window.scrollTo(0, scrollPositionRef.current);
  }, [items]); // Depend on items to ensure this runs after new content is loaded

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const breadcrumbs = ["Home", ...currentPath.split("/").filter(Boolean)];

  if (!tokens) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-background-light to-background-light/80 dark:from-background-dark dark:to-background-dark/80">
        <LoadingSpinner />
      </div>
    );
  }

  if (pathNotFound) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center h-full p-8 text-center"
      >
        <ExclamationCircleIcon className="w-16 h-16 text-yellow-500 mb-4" />
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2"
        >
          Path Not Found
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg text-gray-600 dark:text-gray-400 mb-4"
        >
          The folder or file you&apos;re looking for doesn&apos;t exist or has
          been moved.
        </motion.p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light rounded-md shadow-md hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 transition-colors duration-200"
          onClick={() => router.replace("/files")}
        >
          Go Home
        </motion.button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-b from-background-light to-background-light/80 dark:from-background-dark dark:to-background-dark/80 min-h-screen p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto bg-background-light dark:bg-background-dark rounded-xl shadow-lg p-4 sm:p-6 md:p-8"
        >
          <Breadcrumb items={breadcrumbs} />
          <div className="mb-4">
            <SearchBar onSearch={handleSearch} />
          </div>
          {isLoading || isInitialLoad ? (
            <LoadingBar />
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPath}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <DriveItemList
                    items={filteredItems}
                    onItemClick={handleItemClick}
                  />
                </motion.div>
              </AnimatePresence>
              {items.length === 0 && (
                <p className="text-text-light dark:text-text-dark text-center mt-8 text-lg">
                  This folder is empty.
                </p>
              )}
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
