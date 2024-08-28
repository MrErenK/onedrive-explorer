import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background-light to-white dark:from-background-dark dark:to-gray-800 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-light dark:text-primary-dark mb-4">
          404
        </h1>
        <h2 className="text-3xl font-semibold text-text-light dark:text-text-dark mb-6">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Oops! The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="bg-primary-light hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
