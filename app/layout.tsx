import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Colores - Learn Spanish Colors",
  description: "A sophisticated, ML-powered web experience for learning Spanish color vocabulary through beautiful imagery",
  keywords: ["Spanish", "learning", "colors", "language", "education"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          {children}
        </div>
      </body>
    </html>
  );
}
