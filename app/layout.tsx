import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Accounts",
  description: "Gastos compartidos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
