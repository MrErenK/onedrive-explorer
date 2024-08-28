import React from "react";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { MAuthProvider } from "@/components/MAuthProvider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

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
    <html lang="en">
      <MAuthProvider>
        <AuthProvider>
          <body className={`${inter.className}`}>
            <main>
              <ThemeProvider attribute="class" defaultTheme="dark">
                <div className="flex flex-col h-16">
                  <Header />
                </div>
                {children}
                <Toaster />
              </ThemeProvider>
            </main>
            <Footer />
          </body>
        </AuthProvider>
      </MAuthProvider>
    </html>
  );
}
