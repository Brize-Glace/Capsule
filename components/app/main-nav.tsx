"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, LayoutDashboard, WalletCards } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Vue d’ensemble", short: "Aperçu", icon: LayoutDashboard },
  { href: "/conges", label: "Mes congés", short: "Congés", icon: CalendarDays },
  { href: "/budget", label: "Mon budget", short: "Budget", icon: WalletCards },
  { href: "/emplois", label: "Mes emplois", short: "Emplois", icon: BriefcaseBusiness },
];

/** Main navigation: full labels in the desktop sidebar, short ones in the mobile tab bar. */
export function MainNav({ className, short = false }: { className?: string; short?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={className} aria-label="Navigation principale">
      {NAV_ITEMS.map(({ href, label, short: shortLabel, icon: Icon }) => (
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
          <Icon aria-hidden="true" />
          <span>{short ? shortLabel : label}</span>
        </Link>
      ))}
    </nav>
  );
}
