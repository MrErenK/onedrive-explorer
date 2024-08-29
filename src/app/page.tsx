"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl"
      >
        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-light dark:text-primary-dark mb-6"
        >
          Welcome to OneDrive Explorer
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-xl sm:text-2xl text-secondary-light dark:text-secondary-dark mb-8"
        >
          Effortlessly browse and search OneDrive files with our intuitive
          interface.
        </motion.p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block"
        >
          <Link
            href="/files"
            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-black font-semibold py-3 px-8 rounded-lg inline-block transition-all duration-300 shadow-md hover:shadow-lg hover:bg-gray-700 dark:hover:bg-gray-300"
          >
            Explore OneDrive
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
