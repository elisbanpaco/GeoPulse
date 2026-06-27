import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GeoPulse",
  description: "GeoPulse Analytics Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
