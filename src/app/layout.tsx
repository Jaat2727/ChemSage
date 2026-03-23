import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";

export const metadata: Metadata = {
  title: "ChemSAGE | IIT Madras Chemistry workspace",
  description: "Student portal for the IIT Madras Chemistry Department powered by Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/[0.07] blur-[100px]" />
          <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.05] blur-[100px]" />
          <div className="absolute -bottom-40 left-1/3 h-[600px] w-[600px] rounded-full bg-purple-600/[0.04] blur-[120px]" />
        </div>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
