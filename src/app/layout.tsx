import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { business } from "@/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${business.name} | Book an appointment`,
    template: `%s | ${business.name}`,
  },
  description: `Request a mobile dog-grooming appointment with ${business.name}.`,
};

export const viewport: Viewport = {
  themeColor: "#115e59",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
