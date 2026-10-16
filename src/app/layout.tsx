import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Sea Radar",
  description: "Educational vessel map in the Strait of Dover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
