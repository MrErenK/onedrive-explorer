"use client";
import OneDriveWrapper from "@/components/OneDriveWrapper";
import LoadingBar from "@/components/LoadingBar";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    // Simulate a short loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }

    return () => clearTimeout(timer);
  }, [isLoading, isLoggedIn, session, status, router]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background-light dark:bg-background-dark px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16"
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-light dark:text-primary-dark mb-6 sm:mb-8 md:mb-10 text-center">
          OneDrive Explorer
        </h1>
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <LoadingBar />
            <p className="mt-4 text-secondary-light dark:text-secondary-dark">
              Loading your OneDrive files...
            </p>
          </div>
        ) : (
          <OneDriveWrapper />
        )}
      </div>
    </motion.div>
  );
}
