import React from "react";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-background-light to-primary-light/10 dark:from-background-dark dark:to-primary-dark/10 text-text-light dark:text-text-dark py-8 px-4">
      <div className="max-w-6xl mx-auto w-full text-center">
        <p className="text-sm text-secondary-light dark:text-secondary-dark">
          © {currentYear} The halcyon project. Made with{" "}
          <span className="text-red-500 font-bold">❤️</span> by{" "}
          <Link
            href="https://github.com/MrErenK"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-light dark:text-primary-dark hover:text-primary-light/80 dark:hover:text-primary-dark/80 transition-colors"
          >
            MrErenK
          </Link>
          .
        </p>
      </div>
    </footer>
  );
};

export default Footer;
