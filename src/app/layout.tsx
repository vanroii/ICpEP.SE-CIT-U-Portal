import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICpEP.SE CIT-U Portal",
  description:
    "Official student portal for the Institute of Computer Engineers of the Philippines - CIT-U Student Edition.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F8F7] text-[#1C1713] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
