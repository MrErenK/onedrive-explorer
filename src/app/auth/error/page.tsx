"use client";

import { motion } from "framer-motion";
import { CloudIcon } from "@/components/Icons";
import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 bg-white dark:bg-gray-900 shadow-lg rounded-lg text-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center mb-6"
        >
          <CloudIcon className="w-16 h-16 sm:w-12 sm:h-12 text-primary-light dark:text-primary-dark mb-4 sm:mb-0" />
          <h1 className="text-2xl sm:text-3xl font-bold sm:ml-4 text-primary-light dark:text-primary-dark">
            OneDrive Explorer
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg sm:text-xl text-text-light dark:text-text-dark mb-8"
        >
          Oops! Something went wrong.
        </motion.p>
        <p className="text-text-light dark:text-text-dark mb-8">
          We apologize for the inconvenience. Please try again later or contact
          support if the problem persists.
        </p>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Link
            href="/"
            className="inline-block w-full bg-primary-light dark:bg-primary-dark text-text-dark dark:text-text-light font-semibold py-3 px-4 rounded-md hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-opacity-50 transition duration-300 shadow-md hover:shadow-lg"
          >
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
