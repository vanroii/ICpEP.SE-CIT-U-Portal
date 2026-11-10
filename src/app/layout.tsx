import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ICpEP.SE CIT-U Portal",
  description:
    "Official student portal for the Institute of Computer Engineers of the Philippines - CIT-U Student Edition.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#F8F8F7] text-[#1C1713] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
