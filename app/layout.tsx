import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const tidioKey = process.env.NEXT_PUBLIC_TIDIO_PUBLIC_KEY;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Banana Carousel — AI Prompt Generator for Instagram Carousels",
  description:
    "Dari ide sederhana menjadi prompt carousel premium siap generate dalam hitungan detik. Powered by Gemini AI.",
  keywords: [
    "Instagram carousel",
    "Gemini AI",
    "prompt generator",
    "content creator",
    "AI design",
    "Indonesia",
  ],
  authors: [{ name: "Banana Carousel" }],
  openGraph: {
    title: "Banana Carousel — AI Prompt Generator",
    description:
      "Generate prompt carousel Instagram siap copy-paste ke Gemini AI dalam hitungan detik.",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${display.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            theme="dark"
            richColors
            closeButton
          />
        </ThemeProvider>
        <SpeedInsights />
        {tidioKey && (
          <Script src={`//code.tidio.co/${tidioKey}.js`} strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
