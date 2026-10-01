import type { Metadata } from "next";
import {  Poiret_One, Varela } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "./auth";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from 'sonner'
import { ThemeProvider } from "next-themes";

const headerFont = Poiret_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-header",
  display: "swap",
});

const paragraphFont = Varela({
  subsets: ["latin"],
  variable: "--font-paragraph",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: { default: "Aletheia", template: "%s | Aletheia" },
  description: "Your assistant for your daily tasks",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${headerFont.variable} ${paragraphFont.variable} antialiased`}
      >
        <ThemeProvider  attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <SessionProvider session={session}>
              {children}
              <Toaster position="bottom-right" />
            </SessionProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
