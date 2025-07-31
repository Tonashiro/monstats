import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monstats - Monad Blockchain Analytics & Leaderboard",
  description:
    "Track your Monad blockchain activity with comprehensive analytics, dynamic scoring, and community leaderboards. See how you rank against other users in the Monad ecosystem with real-time sorting and advanced metrics.",
  keywords: [
    "Monad",
    "blockchain",
    "analytics",
    "leaderboard",
    "DeFi",
    "crypto",
    "metrics",
    "on-chain",
    "wallet analysis",
    "scoring system",
    "NFT tracking",
    "transaction history",
    "gas fees",
    "volume tracking",
    "community platform",
  ],
  authors: [{ name: "Tonashiro" }],
  creator: "Tonashiro",
  publisher: "Tonashiro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://monstats.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Monstats - Monad Blockchain Analytics & Leaderboard",
    description:
      "Track your Monad blockchain activity with comprehensive analytics, dynamic scoring, and community leaderboards. See how you rank against other users in the Monad ecosystem.",
    url: "https://monstats.vercel.app",
    siteName: "Monstats",
    images: [
      {
        url: "/og_image.png",
        width: 1200,
        height: 630,
        alt: "Monstats - Monad Blockchain Analytics Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Monstats - Monad Blockchain Analytics & Leaderboard",
    description:
      "Track your Monad blockchain activity with comprehensive analytics, dynamic scoring, and community leaderboards.",
    images: ["/og_image.png"],
    creator: "@tonashiro_",
    site: "@tonashiro_",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  category: "technology",
  classification: "Blockchain Analytics Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
