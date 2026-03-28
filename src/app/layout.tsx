import type { Metadata } from "next";
import "@/styles/global.css";
import { Inter } from "next/font/google";
import React from "react";
import SiteFooter from "@/components/SiteFooter";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Leafs Edge",
  description: "Toronto Maple Leafs Year in Stats",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={inter.className}>
      <body className="Body">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}