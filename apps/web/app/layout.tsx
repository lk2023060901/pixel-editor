import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixel Editor",
  description: "Web-first Tiled-compatible editor"
};

export default function RootLayout(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{props.children}</body>
    </html>
  );
}

