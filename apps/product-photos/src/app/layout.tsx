import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Novalup AI — Product Photos",
  description: "Convertí las fotos de tu producto en imágenes de marketing profesionales con IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-night font-sans text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
