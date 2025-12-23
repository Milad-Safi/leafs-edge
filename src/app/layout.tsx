import type { Metadata } from "next";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: "Leafs Edge",
  description: "Toronto Maple Leafs Game Previews",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
