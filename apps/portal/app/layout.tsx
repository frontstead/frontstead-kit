import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getPortalBrand } from "@/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Every page title ends with the portal's name: pages set just their own part
// ("Privacy") and the template adds " | <name>".
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getPortalBrand();
  return {
    title: { default: `${brand.name} | Golf Community Real Estate`, template: `%s | ${brand.name}` },
    description: `Homes in your area's golf communities. ${brand.brokerageName}, a licensed real estate brokerage.`,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
