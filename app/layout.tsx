import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHIELD.OS — Spare Parts Integrity",
  description:
    "Immutable procurement ledger: who, where, when, what, approved_by, geo, photo_hash.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
