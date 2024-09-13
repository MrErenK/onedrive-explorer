"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-light to-primary-light/10 dark:from-background-dark dark:to-primary-dark/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center px-6 sm:px-8 md:px-12 lg:px-16 max-w-4xl w-full"
      >
        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-light dark:text-primary-dark mb-6 leading-tight"
        >
          Welcome to Halcyon Project Storage
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg sm:text-xl md:text-2xl text-secondary-light dark:text-secondary-dark mb-10 leading-relaxed"
        >
          Explore Halcyon Project builds with ease. Download the latest builds
          for your device.
        </motion.p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block"
        >
          <Link
            href="/files"
            className="bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light font-semibold py-3 px-8 rounded-full inline-block transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 text-lg"
          >
            Get Builds
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
