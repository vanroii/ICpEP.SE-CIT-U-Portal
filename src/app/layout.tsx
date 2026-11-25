import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICpEP.SE CIT-U Portal",
  description:
    "Official student portal for the Institute of Computer Engineers of the Philippines - CIT-U Student Edition.",
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-page text-ink-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
