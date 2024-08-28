import React from "react";
import OneDriveExplorer from "@/components/OneDriveExplorer";

export default function OneDrivePage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-light dark:text-primary-dark mb-6 text-center">
          OneDrive Explorer
        </h1>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <OneDriveExplorer />
        </div>
      </div>
    </div>
  );
}
