import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-[var(--background)] text-white antialiased" suppressHydrationWarning>

        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
