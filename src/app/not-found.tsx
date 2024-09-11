"use client";
import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function NotFound() {
  useEffect(() => {
    document.title = "404 - Page Not Found";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background-light to-white dark:from-background-dark dark:to-gray-800 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-8xl font-bold text-primary-light dark:text-primary-dark mb-4 animate-pulse">
          404
        </h1>
        <h2 className="text-4xl font-semibold text-text-light dark:text-text-dark mb-6">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Oops! The page you&apos;re looking for doesn&apos;t exist. It might
          have been moved or deleted.
        </p>
        <Link
          href="/"
          className="bg-primary-light hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 inline-block"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  );
}
