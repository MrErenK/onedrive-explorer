import Link from "next/link";
import { ChevronRightIcon, HomeIcon, FolderIcon } from "@/components/Icons";

interface BreadcrumbProps {
  items: string[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => (
  <nav className="mb-4 sm:mb-6 md:mb-8" aria-label="Breadcrumb">
    <ol className="flex flex-wrap items-center space-x-1 sm:space-x-2 text-sm sm:text-base text-text-light dark:text-text-dark">
      {items.map((item, index) => (
        <li key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 mx-1 sm:mx-2" />
          )}
          <Link
            href={
              index === 0
                ? "/files"
                : `/files/${items.slice(1, index + 1).join("/")}`
            }
            className="flex items-center hover:text-primary-light dark:hover:text-primary-dark transition-colors duration-200"
          >
            {index === 0 ? (
              <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
            ) : (
              <FolderIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
            )}
            <span className="truncate max-w-[100px] sm:max-w-none">
              {index === 0 ? "Home" : item}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  </nav>
);
