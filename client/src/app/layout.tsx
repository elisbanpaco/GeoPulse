import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GeoPulse | Plataforma de Inteligencia Geoespacial de Seguridad",
  description:
    "Visualiza, analiza y predice niveles de seguridad y criminalidad a nivel departamental en Perú mediante IA y análisis geoespacial avanzado.",
  keywords: ["seguridad", "criminalidad", "Perú", "geoespacial", "dashboard", "análisis"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#07090f] antialiased">
        {children}
      </body>
    </html>
  );
}
