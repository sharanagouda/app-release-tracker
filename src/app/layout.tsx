import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/src/lib/store/StoreProvider";
import { AuthGuard } from "@/src/components/AuthGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LMG CodePush Dashboard",
  description: "Manage and monitor your CodePush deployments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans antialiased h-full`}>
        <StoreProvider>
          <AuthGuard>{children}</AuthGuard>
        </StoreProvider>
      </body>
    </html>
  );
}
