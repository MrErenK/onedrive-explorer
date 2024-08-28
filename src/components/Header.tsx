"use client";

import React, { useState, useEffect } from "react";
import NavBar from "./Navbar";
import ThemeSwitch from "./ThemeSwitch";
import { motion, useScroll, useTransform } from "framer-motion";
import { CloudIcon } from "./Icons";
import Link from "next/link";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 50], [0.9, 1]);
  const headerHeight = useTransform(scrollY, [0, 50], ["3.5rem", "3rem"]);

  useEffect(() => {
    setIsClient(true);
    const updateScrolled = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", updateScrolled);
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <header
      className={`fixed w-full top-0 left-0 z-50 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark shadow-md transition-all duration-300 backdrop-blur-md ${
        isScrolled
          ? "backdrop-blur-lg bg-background-light/70 dark:bg-background-dark/70"
          : ""
      }`}
    >
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <CloudIcon className="h-5 w-5 text-primary-light dark:text-primary-dark" />
          <div className="flex items-center space-x-2">
            {isClient && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex items-center space-x-2"
              >
                <Link href="/">
                  <span className="text-sm font-bold hidden sm:inline text-primary-light dark:text-primary-dark">
                    OneDrive Explorer
                  </span>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
        <NavBar />
        {isClient && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center space-x-2 hover:cursor-pointer"
          >
            <ThemeSwitch />
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;
