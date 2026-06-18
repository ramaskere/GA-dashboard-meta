import type { Metadata } from "next";
import { getClientConfig } from "@/lib/clients";
import "./globals.css";

const client = getClientConfig();

export const metadata: Metadata = {
  title: `${client.name} — Meta Ads`,
  description: client.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={client.locale.split("-")[0]}>
      <body style={{ "--client-primary": client.primaryColor, "--client-accent": client.accentColor } as React.CSSProperties}>
        {children}
      </body>
    </html>
  );
}
