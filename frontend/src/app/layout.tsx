import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Providers } from "@/components/Providers";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NITH TPR Dashboard",
  description: "Automated Job Discovery and Company Tracking",
  icons: {
    icon: "https://res.cloudinary.com/dzbliymin/image/upload/r_20/v1781725894/logonith_gb3opv.webp",
    apple: "https://res.cloudinary.com/dzbliymin/image/upload/r_20/v1781725894/logonith_gb3opv.webp",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} border-t-[4px] border-[#1b4376] flex min-h-screen w-full bg-slate-50 text-slate-900`}>
        <Providers>
          <Toaster position="top-right" richColors />
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
