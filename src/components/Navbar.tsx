"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  FolderIcon,
  LoginIcon,
  LogoutIcon,
  GithubIcon,
  MenuIcon,
  XIcon,
} from "./Icons";
import LoadingBar from "./LoadingBar";

interface NavItemProps {
  href: string;
  children: React.ReactNode;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  target?: string;
  onClick?: () => void;
  isMobile?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  href,
  children,
  icon: Icon,
  target,
  onClick,
  isMobile = false,
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <motion.li
      whileHover={{ scale: isMobile ? 1 : 1.05 }}
      whileTap={{ scale: isMobile ? 0.98 : 0.95 }}
      className={`${isMobile ? "w-full" : ""} mb-2 md:mb-0`}
    >
      <Link
        href={href}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
          isActive
            ? "bg-primary-light/20 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark font-semibold"
            : "hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 text-text-light dark:text-text-dark hover:text-primary-light dark:hover:text-primary-dark"
        } ${isMobile ? "w-full justify-start text-base font-semibold text-primary-light dark:text-primary-dark" : ""}`}
        target={target}
        onClick={onClick}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-grow">{children}</span>
      </Link>
    </motion.li>
  );
};

const NavBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/log-utils`,
        );
        const data = await response.json();
        setIsLoggedIn(data.isLoggedIn);
      } catch (error) {
        console.error("Error checking login status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== "loading") {
      checkLoginStatus();
    }
  }, [status]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/log-utils", { method: "POST" });
      if (response.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        console.error("Failed to logout");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/files", icon: FolderIcon, label: "Files" },
    {
      href: "https://github.com/MrErenK/onedrive-explorer",
      icon: GithubIcon,
      label: "GitHub",
      target: "_blank",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingBar />
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <ul className="flex items-center space-x-4">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              target={item.target}
            >
              {item.label}
            </NavItem>
          ))}
          {session && isLoggedIn ? (
            <motion.li
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
            >
              <button className="flex items-center space-x-2 px-3 py-2 rounded-md transition-colors hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 text-text-light dark:text-text-dark hover:text-primary-light dark:hover:text-primary-dark">
                <LogoutIcon className="w-5 h-5 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </motion.li>
          ) : null}
          {!isLoggedIn && !session ? (
            <NavItem icon={LoginIcon} href="/login">
              Login
            </NavItem>
          ) : null}
        </ul>
      </div>
      <div className="md:hidden">
        <button
          onClick={toggleMenu}
          className="text-text-light dark:text-text-dark hover:text-primary-light dark:hover:text-primary-dark p-2 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark rounded-md"
        >
          {isMenuOpen ? (
            <XIcon className="w-6 h-6" />
          ) : (
            <MenuIcon className="w-6 h-6" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-background-light dark:bg-background-dark shadow-lg overflow-hidden z-50"
          >
            <ul className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  target={item.target}
                  onClick={closeMenu}
                  isMobile={true}
                >
                  {item.label}
                </NavItem>
              ))}
              {session && isLoggedIn ? (
                <motion.li
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="w-full"
                >
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-md transition-colors hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 text-text-light dark:text-text-dark hover:text-primary-light dark:hover:text-primary-dark w-full justify-start text-base font-semibold">
                    <LogoutIcon className="w-5 h-5 flex-shrink-0" />
                    <span>Logout</span>
                  </button>
                </motion.li>
              ) : !isLoggedIn && !session ? (
                <NavItem icon={LoginIcon} isMobile={true} href="/login">
                  Login
                </NavItem>
              ) : null}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavBar;
