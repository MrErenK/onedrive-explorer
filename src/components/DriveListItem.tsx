import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderIcon,
  DocumentIcon,
  ViewListIcon,
  ViewGridIcon,
  SortAscendingIcon,
  SortDescendingIcon,
} from "@/components/Icons";
import { formatFileSize, getFileExtension } from "@/utils/fileUtils";

interface DriveItem {
  id: string;
  name: string;
  folder?: {
    childCount?: number;
  };
  file?: {
    mimeType: string;
  };
  size: number;
  lastModifiedDateTime: string;
}

interface DriveItemListProps {
  items: DriveItem[];
  onItemClick: (item: DriveItem) => void;
}

type SortKey = "name" | "lastModifiedDateTime" | "size";
type SortOrder = "asc" | "desc";

export const DriveItemList: React.FC<DriveItemListProps> = ({
  items,
  onItemClick,
}) => {
  const [isListView, setIsListView] = useState(() => {
    if (typeof window !== "undefined") {
      const savedView = window.localStorage.getItem("fileViewPreference");
      return savedView === null ? true : savedView === "list";
    }
    return true;
  });
  const [isChanging, setIsChanging] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sortKey") as SortKey) || "name";
    }
    return "name";
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sortOrder") as SortOrder) || "asc";
    }
    return "asc";
  });

  useEffect(() => {
    localStorage.setItem("fileViewPreference", isListView ? "list" : "grid");
  }, [isListView]);

  useEffect(() => {
    localStorage.setItem("sortKey", sortKey);
    localStorage.setItem("sortOrder", sortOrder);
  }, [sortKey, sortOrder]);

  const toggleView = useCallback(() => {
    if (!isChanging) {
      setIsChanging(true);
      setIsListView((prevView) => !prevView);
      setTimeout(() => setIsChanging(false), 500);
    }
  }, [isChanging]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const folderCount = items.filter((item) => item.folder).length;
  const fileCount = items.length - folderCount;

  const sortItems = (a: DriveItem, b: DriveItem) => {
    if (a.folder && !b.folder) return -1;
    if (!a.folder && b.folder) return 1;

    let comparison = 0;
    if (sortKey === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortKey === "lastModifiedDateTime") {
      comparison =
        new Date(a.lastModifiedDateTime).getTime() -
        new Date(b.lastModifiedDateTime).getTime();
    } else if (sortKey === "size") {
      comparison = a.size - b.size;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedItems = [...items].sort(sortItems);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0 md:space-x-4">
        <div className="text-secondary-light dark:text-secondary-dark text-sm md:text-base w-full md:w-auto">
          <span className="font-medium">{folderCount.toLocaleString()}</span>{" "}
          folder{folderCount !== 1 ? "s" : ""},{" "}
          <span className="font-medium">{fileCount.toLocaleString()}</span> file
          {fileCount !== 1 ? "s" : ""}
        </div>
        <motion.button
          onClick={toggleView}
          className="flex items-center justify-center bg-primary-light dark:bg-primary-dark text-text-dark dark:text-text-light px-4 py-2 rounded-lg hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 transition-colors duration-200 shadow-md hover:shadow-lg w-full md:w-auto"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isListView ? (
            <ViewGridIcon className="h-5 w-5 mr-2" />
          ) : (
            <ViewListIcon className="h-5 w-5 mr-2" />
          )}
          <span>{isListView ? "Grid View" : "List View"}</span>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {isListView ? (
          <div key="list-view" className="overflow-x-auto w-full">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th
                    className="text-left p-3 md:p-4 text-text-light dark:text-text-dark font-semibold cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    {sortKey === "name" &&
                      (sortOrder === "asc" ? (
                        <SortAscendingIcon className="inline-block ml-1 h-4 w-4" />
                      ) : (
                        <SortDescendingIcon className="inline-block ml-1 h-4 w-4" />
                      ))}
                  </th>
                  <th
                    className="text-left p-3 md:p-4 text-text-light dark:text-text-dark font-semibold hidden md:table-cell cursor-pointer"
                    onClick={() => handleSort("lastModifiedDateTime")}
                  >
                    Modified
                    {sortKey === "lastModifiedDateTime" &&
                      (sortOrder === "asc" ? (
                        <SortAscendingIcon className="inline-block ml-1 h-4 w-4" />
                      ) : (
                        <SortDescendingIcon className="inline-block ml-1 h-4 w-4" />
                      ))}
                  </th>
                  <th
                    className="text-left p-3 md:p-4 text-text-light dark:text-text-dark font-semibold hidden md:table-cell cursor-pointer"
                    onClick={() => handleSort("size")}
                  >
                    Size
                    {sortKey === "size" &&
                      (sortOrder === "asc" ? (
                        <SortAscendingIcon className="inline-block ml-1 h-4 w-4" />
                      ) : (
                        <SortDescendingIcon className="inline-block ml-1 h-4 w-4" />
                      ))}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className="cursor-pointer text-text-light dark:text-text-dark border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-all duration-100 ease-in-out hover:-translate-y-[2px] hover:bg-primary-light/10 dark:hover:bg-primary-dark/10"
                  >
                    <td className="p-3 md:p-4">
                      <div className="flex items-center space-x-3">
                        <div className="transition-transform duration-100 ease-in-out hover:scale-105">
                          {item.folder ? (
                            <FolderIcon className="h-6 w-6 text-primary-light dark:text-primary-dark flex-shrink-0" />
                          ) : (
                            <DocumentIcon className="h-6 w-6 text-secondary-light dark:text-secondary-dark flex-shrink-0" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                            {getFileExtension(item.name)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 md:p-4 text-secondary-light dark:text-secondary-dark hidden md:table-cell">
                      <div className="text-sm">
                        {formatDate(item.lastModifiedDateTime)}
                      </div>
                    </td>
                    <td className="p-3 md:p-4 text-secondary-light dark:text-secondary-dark hidden md:table-cell">
                      <div className="text-sm">{formatFileSize(item.size)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`grid-view`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.ul
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                layout
              >
                {sortedItems.map((item) => (
                  <motion.li
                    key={item.id}
                    layoutId={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer bg-background-light dark:bg-background-dark hover:bg-primary-light/5 dark:hover:bg-primary-dark/5 rounded-lg p-4 transition-all duration-200 border border-gray-200 dark:border-gray-700 flex flex-col"
                    onClick={() => onItemClick(item)}
                  >
                    <motion.div className="flex items-center mb-3" layout>
                      {item.folder ? (
                        <FolderIcon className="h-10 w-10 text-primary-light dark:text-primary-dark mr-3 flex-shrink-0" />
                      ) : (
                        <DocumentIcon className="h-10 w-10 text-secondary-light dark:text-secondary-dark mr-3 flex-shrink-0" />
                      )}
                      <motion.span
                        className="text-text-light dark:text-text-dark font-medium text-lg truncate flex-grow"
                        layout
                      >
                        {item.name}
                      </motion.span>
                    </motion.div>
                    <motion.div
                      className="text-sm text-secondary-light dark:text-secondary-dark mt-auto"
                      layout
                    >
                      <p className="mb-1">
                        Modified: {formatDate(item.lastModifiedDateTime)}
                      </p>
                      <p className="mb-1">
                        {item.folder ? "Folder" : formatFileSize(item.size)}
                      </p>
                      {item.folder && (
                        <p>
                          {item.folder.childCount ?? 0} item
                          {(item.folder.childCount ?? 0) !== 1 ? "s" : ""}
                        </p>
                      )}
                    </motion.div>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </AnimatePresence>
        )}
        ;
      </AnimatePresence>
    </div>
  );
};
