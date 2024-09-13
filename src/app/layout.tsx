import React, { Suspense } from "react";
import { Inter } from "next/font/google";
import { Metadata, Viewport } from "next";
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
  title: "Halcyon Project Drive",
  description: "Official halcyon project storage website.",
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: [{ url: "/icons/favicon.svg" }],
    other: [
      { rel: "manifest", url: "/icons/site.webmanifest" },
      {
        rel: "mask-icon",
        url: "/icons/safari-pinned-tab.svg",
        color: "#5bbad5",
      },
    ],
  },
  appleWebApp: {
    title: "Halcyon Project Drive",
  },
  applicationName: "Halcyon Project Drive",
  other: {
    "msapplication-TileColor": "#da532c",
    "msapplication-config": "/icons/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
              <main className="flex flex-col min-h-screen">
                <div className="flex-grow pt-12">
                  <Header />
                  {children}
                </div>
                <Toaster />
                <Footer />
              </main>
            </ThemeProvider>
          </body>
        </AuthProvider>
      </MAuthProvider>
    </html>
  );
}
