"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // You could add error reporting to a service here
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background-light to-white dark:from-background-dark dark:to-gray-800 px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-6xl font-bold text-red-600 mb-4 animate-bounce">
          Oops!
        </h1>
        <h2 className="text-3xl font-semibold text-text-light dark:text-text-dark mb-6">
          Something unexpected happened
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          We apologize for the inconvenience. An error occurred while processing
          your request. Our team has been notified and is working on it.
        </p>
        <div className="space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-primary-light hover:bg-primary-dark text-white font-bold py-2 px-6 rounded transition duration-300 ease-in-out"
          >
            Try again
          </button>
          <Link href="/">
            <button className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded transition duration-300 ease-in-out">
              Go Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
