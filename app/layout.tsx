import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bronzer Spa & Wellness",
  description: "Medical Aesthetic Center",
  manifest: "/manifest.json", // <--- ESTA LINEA ES LA CLAVE
  themeColor: "#D4AF37",      // <--- ESTA TAMBIÉN
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // Esto evita zoom indeseado en inputs
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
