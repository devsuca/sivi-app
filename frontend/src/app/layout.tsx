import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders"; // Import ClientProviders
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "SIVIS+360º",
  description: "DDS-DTTI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body
        className={`antialiased ${GeistSans.className}`}>
        <ClientProviders>
          {children}
          <Toaster richColors />
        </ClientProviders>
      </body>
    </html>
  );
}
