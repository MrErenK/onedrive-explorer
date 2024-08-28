"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CloudIcon } from "@/components/Icons";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/files");
    }
  }, [status, router]);

  const handleLogin = () => {
    signIn("azure-ad", { callbackUrl: "/files" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg"
        >
          <div className="w-16 h-16 border-t-4 border-primary-light dark:border-primary-dark border-solid rounded-full animate-spin mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 bg-white dark:bg-gray-900 shadow-lg rounded-lg text-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-center justify-center mb-6"
        >
          <CloudIcon className="w-12 h-12 text-primary-light dark:text-primary-dark" />
          <h1 className="text-3xl font-bold ml-4 text-primary-light dark:text-primary-dark">
            OneDrive Explorer
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-xl text-secondary-light dark:text-secondary-dark mb-8"
        >
          Sign in to access and manage your OneDrive files
        </motion.p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <button
            onClick={handleLogin}
            className="w-full bg-primary-light dark:bg-primary-dark text-text-dark dark:text-text-light font-bold py-3 px-4 rounded-lg hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-opacity-50 transition duration-300 shadow-md hover:shadow-lg"
          >
            Sign in with Microsoft
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
