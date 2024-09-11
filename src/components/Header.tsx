"use client";

import React, { useState, useEffect } from "react";
import NavBar from "./Navbar";
import ThemeSwitch from "./ThemeSwitch";
import { motion, useScroll, useTransform } from "framer-motion";
import { CloudIcon } from "./Icons";
import Link from "next/link";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 50], [0.9, 1]);
  const headerHeight = useTransform(scrollY, [0, 50], ["4rem", "3.5rem"]);

  useEffect(() => {
    const updateScrolled = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", updateScrolled);
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <motion.header
      style={{ opacity: headerOpacity, height: headerHeight }}
      className={`fixed w-full top-0 left-0 z-50 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark shadow-md transition-all duration-300 backdrop-blur-md ${
        isScrolled
          ? "backdrop-blur-lg bg-background-light/80 dark:bg-background-dark/80"
          : ""
      }`}
    >
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <CloudIcon className="h-6 w-6 md:h-7 md:w-7 text-primary-light dark:text-primary-dark" />
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Link href="/">
              <span className="text-sm md:text-base font-bold hidden sm:inline text-primary-light dark:text-primary-dark">
                OneDrive Explorer
              </span>
            </Link>
          </motion.div>
        </div>
        <NavBar />
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center hover:cursor-pointer"
          >
            <ThemeSwitch />
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
