import React, { Suspense } from "react";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import dynamic from "next/dynamic";
import Footer from "@/components/Footer";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { MAuthProvider } from "@/components/MAuthProvider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

const Header = dynamic(() => import("@/components/Header"), { ssr: false });

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OneDrive Index",
  description: "Browse and manage your OneDrive files",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                var mode = localStorage.getItem('theme');
                var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                if (!mode && supportDarkMode) document.documentElement.classList.add('dark');
                if (!mode) return;
                document.documentElement.classList.add(mode);
              } catch (e) {}
            })();
          `,
          }}
        />
      </head>
      <MAuthProvider>
        <AuthProvider>
          <body
            className={`${inter.className} bg-background-light dark:bg-background-dark`}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
            >
              <main>
                <div className="flex flex-col h-16">
                  <Header />
                </div>
                {children}
                <Toaster />
              </main>
              <Footer />
            </ThemeProvider>
          </body>
        </AuthProvider>
      </MAuthProvider>
    </html>
  );
}
