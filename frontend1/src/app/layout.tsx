import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Portal | NITH TPR System",
  description: "TPO office administration portal",
  icons: {
    icon: "https://res.cloudinary.com/dzbliymin/image/upload/r_20/v1781725894/logonith_gb3opv.webp",
    apple: "https://res.cloudinary.com/dzbliymin/image/upload/r_20/v1781725894/logonith_gb3opv.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.className} h-full antialiased`}
    >
      <body className="min-h-full w-full flex flex-col bg-slate-50 text-slate-900 border-t-[4px] border-[#1b4376]">
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}
