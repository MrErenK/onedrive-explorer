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
}

export default function OneDriveExplorer({
  initialTokens,
}: OneDriveExplorerProps) {
  const [tokens, setTokens] = useState(initialTokens);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DriveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const params = useParams();
  const scrollPositionRef = useRef<number>(0);

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
        }, 1000);
      }
    }

    if (!tokens) {
      fetchTokens();
    }
  }, [tokens, router]);

  const fetchItems = useCallback(
    async (path: string) => {
      if (!tokens?.accessToken) return;

      setIsLoading(true);
      try {
        const data = await getDriveContents(tokens.accessToken, path);
        setItems(data);
      } catch (error) {
        if (error instanceof TokenExpiredError) {
          toast.error("Your session has expired. Please relogin.");
        } else {
          toast.error("An error occurred while fetching items.");
          console.error("Error fetching items:", error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [tokens?.accessToken],
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
        router.push(`/files/${newPath}`);
      } else {
        // Navigate to the file details page
        const filePath = currentPath
          ? `${currentPath}/${item.name}`
          : item.name;
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

  return (
    <>
      {isLoading && <LoadingBar />}
      <div className="bg-gradient-to-b from-background-light to-background-light/80 dark:from-background-dark dark:to-background-dark/80 min-h-screen p-8">
        <div className="max-w-6xl mx-auto bg-background-light dark:bg-background-dark rounded-xl shadow-lg p-8">
          <Breadcrumb items={breadcrumbs} />
          <div className="mb-4">
            <SearchBar onSearch={handleSearch} />
          </div>
          {isLoading ? (
            <LoadingBar />
          ) : (
            <>
              <DriveItemList
                items={filteredItems}
                onItemClick={handleItemClick}
              />
              {items.length === 0 && (
                <p className="text-text-light dark:text-text-dark text-center mt-8 text-lg">
                  This folder is empty.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}