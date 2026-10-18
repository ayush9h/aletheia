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
import { SITE } from "@/lib/site";
import {ConsentBanner, ConsentDialog, ConsentRoot} from 'c15t/next'
import {resolveConsent} from 'c15t/next/server'

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
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["AI assistant", "chat", "GitHub", "Slack", "web search", "productivity"],
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.ico", apple: "/logo.png" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html
      lang="en"
      className={`${headerFont.variable} ${paragraphFont.variable} ${dyslexicFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body
        className="antialiased"
      >
        <ConsentRoot state={resolveConsent()}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <SessionProvider session={session}>
              
              <ThemeShortcuts />
              
              {children}

              <ConsentBanner legalLinks={["privacyPolicy", "termsOfService"]} />
              <ConsentDialog legalLinks={["privacyPolicy", "termsOfService"]} />
              
              <Toaster position="bottom-right" />

            </SessionProvider>

          </TooltipProvider>
        </ThemeProvider>

        </ConsentRoot>
      </body>
    </html>
  );
}
