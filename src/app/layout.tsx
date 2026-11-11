import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Header, Footer } from "@/components/Chrome";

const inter = localFont({
  src: [
    { path: "../fonts/Inter-Regular.otf", weight: "400" },
    { path: "../fonts/Inter-Medium.otf", weight: "500" },
    { path: "../fonts/Inter-SemiBold.otf", weight: "600" },
    { path: "../fonts/Inter-Bold.otf", weight: "700" },
    { path: "../fonts/Inter-ExtraBold.otf", weight: "800" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediSync – gyógyszerbiztonsági bemutató",
  description: "Oktatási prototípus: automatikus kölcsönhatás-, allergia- és duplikációellenőrzés gyógyszerfelíráskor. Szintetikus adatokkal, nem klinikai használatra.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <Header />
          <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
