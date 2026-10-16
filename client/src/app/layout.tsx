import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Managing Your Files",
    description: "Advanced File Management System",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
        <Providers>
            <Toaster position="top-right" />
            {children}
        </Providers>
        </body>
        </html>
    );
}
