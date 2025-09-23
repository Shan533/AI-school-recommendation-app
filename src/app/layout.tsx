import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Top Tech Schools",
  description: "Find, rate, and review top CS, AI/ML, Data, Cybersecurity & more—matched to your profile",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col overflow-x-hidden bg-white`}>
        <Header />

        <main className="flex-1 flex flex-col">
          {children}
        </main>

        <Footer />

        <Analytics />
      </body>
    </html>
  );
}
