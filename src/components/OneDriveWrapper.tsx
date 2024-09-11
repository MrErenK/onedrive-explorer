"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import OneDriveExplorer from "./OneDriveExplorer";

const OneDriveWrapper = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-background-light dark:bg-background-dark rounded-xl shadow-lg dark:shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-w-6xl mx-auto"
    >
      <div className="p-4 sm:p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key="onedrive-explorer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <OneDriveExplorer />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default OneDriveWrapper;
