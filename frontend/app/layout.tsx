import type { Metadata } from "next";
import "./globals.css";

// Self-hosted system font stack — no runtime dependency on Google Fonts
// (resilient offline + avoids leaking user IPs to Google, a GDPR consideration).

export const metadata: Metadata = {
  title: {
    default: "AI Medical Diagnosis — Clinical Decision Support",
    template: "%s · AI Medical Diagnosis",
  },
  description:
    "Citation-grounded clinical decision support. A multi-model quorum grounds every assessment in verified medical sources, with consensus, confidence, and full citations.",
  applicationName: "AI Medical Diagnosis",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
