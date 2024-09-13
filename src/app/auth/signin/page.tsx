"use client";

import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { CloudIcon } from "@/components/Icons";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const { data: session, status } = useSession();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const response = await fetch("/api/log-utils");
      const data = await response.json();
      setIsLoggedIn(data.isLoggedIn);
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/files");
    }
  }, [isLoggedIn, session, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_LOGIN_PASSWORD) {
      signIn("azure-ad", { callbackUrl: "/files" });
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="p-6 sm:p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-t-4 border-primary-light dark:border-primary-dark border-solid rounded-full animate-spin mx-auto"></div>
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
          Enter the password to access OneDrive Explorer login page
        </motion.p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-3 border rounded-md text-text-light dark:text-text-dark bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <button
              type="submit"
              className="w-full bg-primary-light dark:bg-primary-dark text-text-dark dark:text-text-light font-semibold py-3 px-4 rounded-md hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-opacity-50 transition duration-300 shadow-md hover:shadow-lg"
            >
              Sign in
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
