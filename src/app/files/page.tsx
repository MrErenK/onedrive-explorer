"use client";
import OneDriveWrapper from "@/components/OneDriveWrapper";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function OneDrivePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/log-utils`,
      );
      const data = await response.json();
      setIsLoggedIn(data.isLoggedIn);
      setIsLoading(false);
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoading, isLoggedIn, status, router]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col bg-gradient-to-br from-background-light to-primary-light/10 dark:from-background-dark dark:to-primary-dark/10"
    >
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16">
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-light dark:text-primary-dark mb-6 sm:mb-8 md:mb-10 text-center"
        >
          OneDrive Explorer
        </motion.h1>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col justify-center items-center h-64"
            >
              <LoadingSpinner />
              <p className="mt-4 text-secondary-light dark:text-secondary-dark">
                Loading your OneDrive files...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-7xl"
            >
              <OneDriveWrapper />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
