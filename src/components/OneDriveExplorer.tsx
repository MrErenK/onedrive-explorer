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
import { signOut, getSession } from "next-auth/react";
import { getDriveContents, TokenExpiredError } from "@/lib/graph";
import LoadingSpinner from "./LoadingSpinner";

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

export default function OneDriveExplorer() {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DriveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const params = useParams();
  const scrollPositionRef = useRef<number>(0);

  const currentPath = Array.isArray(params.path) ? params.path.join("/") : "";

  const getAccessToken = async () => {
    const session = await getSession();
    return session?.accessToken;
  };

  const fetchItems = useCallback(async (path: string) => {
    setIsLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (accessToken) {
        const data = await getDriveContents(accessToken, path);
        setItems(data);
      } else {
        throw new Error("Failed to get access token");
      }
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        toast.error("Your session has expired. Please log in again.");
        signOut({ callbackUrl: "/login" });
      } else {
        toast.error("An error occurred while fetching items.");
        console.error("Error fetching items:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

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
            <>
              <LoadingBar />
              <div className="flex justify-center items-center h-full mt-12">
                <LoadingSpinner />
              </div>
            </>
          ) : (
            <DriveItemList
              items={filteredItems}
              onItemClick={handleItemClick}
            />
          )}
          {items.length === 0 && !isLoading && (
            <p className="text-text-light dark:text-text-dark text-center mt-8 text-lg">
              This folder is empty.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
