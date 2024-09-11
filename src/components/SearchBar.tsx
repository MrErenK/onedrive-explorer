"use client";
import React, { useState, useEffect } from "react";
import { SearchIcon } from "@/components/Icons";
import useDebounce from "@/hooks/useDebounce";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search files..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
      />
      <SearchIcon className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
    </div>
  );
};

export default SearchBar;
