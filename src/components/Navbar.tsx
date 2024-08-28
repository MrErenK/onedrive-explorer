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
  UserIcon,
  GithubIcon,
  MenuIcon,
  XIcon,
} from "./Icons";

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
      className={isMobile ? "w-full" : ""}
    >
      <Link
        href={href}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
          isActive
            ? "bg-primary-light/20 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark font-semibold"
            : "hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 text-text-light dark:text-text-dark hover:text-primary-light dark:hover:text-primary-dark"
        } ${isMobile ? "w-full justify-start text-sm font-semibold text-primary-light dark:text-primary-dark" : ""}`}
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
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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

  return (
    <nav className="relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
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
              {!session ? (
                <NavItem href="/login" icon={LoginIcon}>
                  Login
                </NavItem>
              ) : (
                <motion.li
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    className="flex items-center space-x-2 px-3 py-2 rounded-md transition-colors hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 text-text-light dark:text-text-dark hover:text-primary-light dark:hover:text-primary-dark"
                  >
                    <UserIcon className="w-5 h-5 flex-shrink-0" />
                    <span>Logged in as {session?.user?.name}</span>
                  </button>
                </motion.li>
              )}
            </ul>
          </div>
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-text-light dark:text-text-dark hover:text-primary-light dark:hover:text-primary-dark p-2"
            >
              {isMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden absolute top-16 left-0 bg-background-light dark:bg-background-dark shadow-lg overflow-hidden"
          >
            <ul className="px-2 py-3 space-y-2">
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
              {!session ? (
                <NavItem
                  href="/login"
                  icon={LoginIcon}
                  onClick={closeMenu}
                  isMobile={true}
                >
                  Login
                </NavItem>
              ) : (
                <motion.li
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex justify-center items-center"
                >
                  <button
                    onClick={() => {
                      closeMenu();
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md transition-colors hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 text-text-light dark:text-text-dark hover:text-primary-light dark:hover:text-primary-dark"
                  >
                    <UserIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-grow">
                      Logged in as {session?.user?.name}
                    </span>
                  </button>
                </motion.li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavBar;
