import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageBackdrop } from "@/components/PageBackdrop";
import { DemoEditionBanner } from "@/components/DemoEditionBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sentinel Voice — Build Your Crypto Future. Protect Every Step.",
  description:
    "AI-powered crypto education and security: VoiceGuard AI for learning, Sentinel AI for transaction and smart-contract checks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} backdrop min-h-screen font-sans antialiased`}
      >
        <Header />
        <DemoEditionBanner />
        <div className="relative pb-8">
          <PageBackdrop />
          <main className="relative">{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
