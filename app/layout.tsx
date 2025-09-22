import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { poppins } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Next.js + ShadCN admin starter"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="font-poppins">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
