import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Landsat Name Generator | Satellite Imagery Typography",
  description: "A fast, bulk-generation tool to spell out words using authentic NASA Landsat satellite imagery. Generate multiple words at once and download them with transparent backgrounds.",
  keywords: ["NASA", "Landsat", "Name Generator", "Satellite Imagery", "Space Typography", "Earth Observation"],
  authors: [{ name: "Praveen Jadhav", url: "https://praveenjadhav.in" }],
  creator: "Praveen Jadhav",
  openGraph: {
    title: "Landsat Name Generator | Satellite Imagery Typography",
    description: "Spell out your name using authentic NASA Landsat satellite imagery. A fast, bulk-generation tool.",
    url: "https://github.com/praveenjadhav1510/landsat",
    siteName: "Landsat Name Generator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Landsat Name Generator | Satellite Imagery Typography",
    description: "Spell out your name using authentic NASA Landsat satellite imagery. A fast, bulk-generation tool.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
