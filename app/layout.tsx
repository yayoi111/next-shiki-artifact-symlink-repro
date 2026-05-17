import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Next Turbopack external alias repro",
  description: "Reproduction for hashed server external aliases in Turbopack.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
