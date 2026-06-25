import "./globals.css";
import QueryProvider from '@/providers/QueryProvider';
import { ThemeProvider } from 'next-themes'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { OfflineBanner } from '@/components/OfflineBanner'
import { Toaster } from '@/components/ui/sonner'
import { plusJakartaSans } from '@/lib/fonts'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${plusJakartaSans.variable} font-sans`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e1b4b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VetPro" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryProvider>
            <OfflineBanner />
            {children}
          </QueryProvider>
          <Toaster />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
