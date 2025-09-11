import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/navigation";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI School Recommend App",
  description: "Find the perfect school and program for your educational journey",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col overflow-x-hidden bg-gradient-to-br from-blue-50 to-indigo-100`}>
      <header className="shrink-0 border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">AI School Recommend</h1>
          <Navigation />
        </div>
      </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>

        <footer className="shrink-0 bg-gray-900 text-white">
          <div className="container mx-auto px-6 py-8 text-center">
            <p className="text-gray-400">
              © 2024 AI School Recommend App. Built with Next.js and Supabase.
            </p>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}
