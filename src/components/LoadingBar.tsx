"use client";

import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/utils/utils";

interface LoadingBarProps {
  className?: string;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ className }) => {
  const controls = useAnimation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    controls.start({
      width: "100%",
      transition: { duration: 2, ease: "easeInOut" },
    });

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 200);

    return () => {
      clearInterval(timer);
    };
  }, [controls]);

  return (
    <motion.div
      className={cn("fixed top-0 left-0 right-0 h-1 bg-primary-light dark:bg-primary-dark z-50", className)}
      style={{ width: `${progress}%` }}
      animate={controls}
    />
  );
};

export default LoadingBar;
