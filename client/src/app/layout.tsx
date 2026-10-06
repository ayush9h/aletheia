import type { Metadata } from "next";
import { Poiret_One } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "./auth";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from 'sonner'
import { ThemeProvider } from "next-themes";
import ThemeShortcuts from "./reducers/theme-shortcut";

const headerFont = Poiret_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-header",
  display: "swap",
});

const paragraphFont = localFont({
  src: "./fonts/AlkesRegular.ttf",
  variable: "--font-paragraph",
  display: "swap",
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
              <ThemeShortcuts />
              {children}
              <Toaster position="bottom-right" />
            </SessionProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
