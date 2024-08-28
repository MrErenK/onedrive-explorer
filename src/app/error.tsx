"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background-light to-white dark:from-background-dark dark:to-gray-800 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">Oops!</h1>
        <h2 className="text-3xl font-semibold text-text-light dark:text-text-dark mb-6">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          We&apos;re sorry, but an error occurred while processing your request.
        </p>
        <button
          onClick={() => reset()}
          className="bg-primary-light hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out mr-4"
        >
          Try again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
