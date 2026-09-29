import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Capsule — Budget & congés",
    template: "%s · Capsule",
  },
  description: "Pilotez vos congés, vos emplois et votre épargne au même endroit.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
