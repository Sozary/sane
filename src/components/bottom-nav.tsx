"use client";

import { cn } from "@/lib/utils";
import { Home, Camera, User, CalendarDays, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/analyse", label: "Analyse", icon: CalendarDays },
  { href: "/scan", label: "Scanner", icon: Camera, accent: true },
  { href: "/succes", label: "Succès", icon: Trophy },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border safe-area-pb">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.accent) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="flex items-center justify-center -mt-4"
              >
                <div
                  className="size-14 rounded-full flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: "#E8384F" }}
                >
                  <Icon className="size-6" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
