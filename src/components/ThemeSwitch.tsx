"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "@/components/Icons";

const ThemeSwitch = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    document.body.classList.add("theme-transition");
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-14 h-7 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div
        className={`w-6 h-6 relative rounded-full transition-all duration-500 transform ${
          theme === "dark"
            ? "translate-x-7 bg-primary-dark"
            : "translate-x-1 bg-primary-light"
        } shadow-md`}
      >
        <SunIcon
          className={`absolute inset-0 w-6 h-6 text-text-dark transition-opacity duration-500 ${
            theme === "dark" ? "opacity-0" : "opacity-100"
          }`}
        />
        <MoonIcon
          className={`absolute inset-0 w-6 h-6 text-text-light transition-opacity duration-500 ${
            theme === "dark" ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </button>
  );
};

export default ThemeSwitch;
