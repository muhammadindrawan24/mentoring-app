import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIM Mentoring Islam",
  description: "Sistem Manajemen Mentoring Agama Islam Mahasiswa Baru",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans antialiased">{children}</body>
    </html>
  );
}
