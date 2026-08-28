import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "People Analytics DAX Kit", description: "Medidas DAX documentadas para plantilla, rotación y absentismo en Power BI.", other: { "codex-preview": "development" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
