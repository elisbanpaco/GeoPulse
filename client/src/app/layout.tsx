import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GeoPulse — Plataforma de Inteligencia Criminal del Perú",
  description:
    "Dashboard analítico de inteligencia criminal para el monitoreo, análisis y visualización de indicadores de seguridad ciudadana en todas las regiones del Perú. Datos oficiales del Plan de Acción de Seguridad Ciudadana.",
  keywords: [
    "criminalidad",
    "seguridad ciudadana",
    "Perú",
    "dashboard",
    "inteligencia criminal",
    "análisis de datos",
    "regiones",
  ],
  authors: [{ name: "GeoPulse Intelligence" }],
  openGraph: {
    title: "GeoPulse — Inteligencia Criminal del Perú",
    description: "Plataforma analítica de seguridad ciudadana nacional",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
