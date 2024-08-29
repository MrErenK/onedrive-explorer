import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderIcon,
  DocumentIcon,
  ViewListIcon,
  ViewGridIcon,
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

export const DriveItemList: React.FC<DriveItemListProps> = ({
  items,
  onItemClick,
}) => {
  const [isListView, setIsListView] = useState(() => {
    // Initialize state from localStorage, default to true if not set
    if (typeof window !== "undefined") {
      const savedView = window.localStorage.getItem("fileViewPreference");
      return savedView === null ? true : savedView === "list";
    }
    return true;
  });

  useEffect(() => {
    // Save the current view preference to localStorage whenever it changes
    localStorage.setItem("fileViewPreference", isListView ? "list" : "grid");
  }, [isListView]);

  const toggleView = () => setIsListView(!isListView);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const folderCount = items.filter((item) => item.folder).length;
  const fileCount = items.length - folderCount;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <div className="text-secondary-light dark:text-secondary-dark text-sm sm:text-base w-full sm:w-auto mb-2 sm:mb-0">
          <span className="font-medium">{folderCount}</span> folder
          {folderCount !== 1 ? "s" : ""},{" "}
          <span className="font-medium">{fileCount}</span> file
          {fileCount !== 1 ? "s" : ""}
        </div>
        <motion.button
          onClick={toggleView}
          className="flex items-center bg-primary-light dark:bg-primary-dark text-text-dark dark:text-text-light px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 transition-colors duration-200 shadow-md hover:shadow-lg w-full sm:w-auto justify-center sm:justify-start"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isListView ? (
            <>
              <ViewListIcon className="h-5 w-5 mr-2" />
              <span>List View</span>
            </>
          ) : (
            <>
              <ViewGridIcon className="h-5 w-5 mr-2" />
              <span>Grid View</span>
            </>
          )}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {isListView ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-x-auto"
          >
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900">
                  <th className="text-left p-2 sm:p-3 text-text-light dark:text-text-dark font-semibold">
                    Name
                  </th>
                  <th className="text-left p-2 sm:p-3 text-text-light dark:text-text-dark font-semibold hidden sm:table-cell">
                    Modified
                  </th>
                  <th className="text-left p-2 sm:p-3 text-text-light dark:text-text-dark font-semibold hidden sm:table-cell">
                    Size
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <motion.tr
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className="cursor-pointer hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 text-text-light dark:text-text-dark border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    whileHover={{
                      backgroundColor: "rgba(var(--color-primary-light), 0.1)",
                    }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center">
                        {item.folder ? (
                          <FolderIcon className="h-6 w-6 text-primary-light dark:text-primary-dark mr-3 flex-shrink-0" />
                        ) : (
                          <DocumentIcon className="h-6 w-6 text-secondary-light dark:text-secondary-dark mr-3 flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                            {getFileExtension(item.name)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 text-secondary-light dark:text-secondary-dark hidden sm:table-cell">
                      <div className="text-xs mt-1">
                        {formatDate(item.lastModifiedDateTime)}
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 text-secondary-light dark:text-secondary-dark hidden sm:table-cell">
                      {item.folder ? (
                        <div className="text-xs">
                          {formatFileSize(item.size)}
                        </div>
                      ) : (
                        <div className="text-xs">
                          {formatFileSize(item.size)}
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
              layout
            >
              {items.map((item) => (
                <motion.li
                  key={item.id}
                  layoutId={item.id}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer bg-background-light dark:bg-background-dark hover:bg-primary-light/5 dark:hover:bg-primary-dark/5 rounded-lg p-4 transition-colors duration-200 border border-gray-200 dark:border-gray-700 flex flex-col"
                  onClick={() => onItemClick(item)}
                >
                  <div className="flex items-center mb-3">
                    {item.folder ? (
                      <FolderIcon className="h-10 w-10 text-primary-light dark:text-primary-dark mr-3 flex-shrink-0" />
                    ) : (
                      <DocumentIcon className="h-10 w-10 text-secondary-light dark:text-secondary-dark mr-3 flex-shrink-0" />
                    )}
                    <span className="text-text-light dark:text-text-dark font-medium text-lg truncate flex-grow">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-sm text-secondary-light dark:text-secondary-dark mt-auto">
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
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
