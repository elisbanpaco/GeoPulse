import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GeoPulse — Indicadores de seguridad ciudadana del Perú",
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
    title: "GeoPulse — Indicadores del Perú",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
