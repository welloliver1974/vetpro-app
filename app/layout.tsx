import "./globals.css";
import QueryProvider from '@/providers/QueryProvider';
import { ThemeProvider } from 'next-themes'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e1b4b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VetPro" />
      </head>
      <body className="bg-slate-950 text-slate-200 antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryProvider>
            {children}
          </QueryProvider>
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
