"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import OneDriveExplorer from "@/components/OneDriveExplorer";

export default function OneDrivePage() {
  const [notFound, setNotFound] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background-light to-primary-light/10 dark:from-background-dark dark:to-primary-dark/10 px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16 flex flex-col"
    >
      <div className="max-w-7xl w-full mx-auto flex-grow flex flex-col">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-light dark:text-primary-dark mb-6 sm:mb-8 md:mb-10 text-center"
        >
          OneDrive Explorer
        </motion.h1>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-grow flex flex-col"
        >
          <div className="w-full h-full overflow-auto">
            <OneDriveExplorer onPathNotFound={() => setNotFound(true)} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
