import type { Metadata } from "next";
import { Poiret_One } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import ThemeShortcuts from "@/components/theme-shortcuts";

const headerFont = Poiret_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-header",
  display: "swap",
});

const paragraphFont = localFont({
  src: "./fonts/Bookerly.ttf",
  variable: "--font-bookerly",
  display: "swap",
});

const dyslexicFont = localFont({
  src: "./fonts/OpenDyslexic-Regular.otf",
  variable: "--font-dyslexic",
  display: "swap",
  preload: false,
});

const appearanceScript = `try{for(const k of ["accent","font"]){const v=localStorage.getItem("aletheia-"+k);if(v)document.documentElement.dataset[k]=v}}catch{}`;

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body
        className={`${headerFont.variable} ${paragraphFont.variable} ${dyslexicFont.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
