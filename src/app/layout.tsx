import type { Metadata } from "next";
import "@/styles/global.css";
import { Inter } from "next/font/google";
import React from "react";

// Load Inter font and expose it as a CSS variable for global usage
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

// Static metadata
export const metadata: Metadata = {
  title: "Leafs Edge",
  description: "Toronto Maple Leafs Year in Stats",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Root HTML wrapper for the entire app
    // Sets language, default dark theme, and global font class
    <html lang="en" data-theme="dark" className={inter.className}>
      {/* Visual-only wrapper that applies the global page background and base styles */}
      <body className="Body">{children}</body>
    </html>
  );
}
