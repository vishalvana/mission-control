import type { Metadata } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import { profile } from "@/content/profile";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vishal Vana",
  description: `${profile.headline} ${profile.intro}`,
  openGraph: {
    title: "Vishal Vana",
    description: profile.headline,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${martian.variable}`}>
      <body>{children}</body>
    </html>
  );
}
