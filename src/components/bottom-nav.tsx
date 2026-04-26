"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Trophy, Plus, BarChart3, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const leftItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Journal", icon: BookOpen },
  { href: "/succes", label: "Challenges", icon: Trophy },
];

const rightItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/analyse", label: "Analyse", icon: BarChart3 },
  { href: "/profile", label: "Profil", icon: User },
];

const BAR_HEIGHT = 64;
const NOTCH_RADIUS = 30;
const SHOULDER = 10;
const CORNER_RADIUS = 24;

function buildPath(width: number) {
  const cx = width / 2;
  const w = width;
  return [
    `M ${CORNER_RADIUS} 0`,
    `L ${cx - NOTCH_RADIUS - SHOULDER} 0`,
    `Q ${cx - NOTCH_RADIUS} 0 ${cx - NOTCH_RADIUS} ${SHOULDER}`,
    `A ${NOTCH_RADIUS} ${NOTCH_RADIUS} 0 0 0 ${cx + NOTCH_RADIUS} ${SHOULDER}`,
    `Q ${cx + NOTCH_RADIUS} 0 ${cx + NOTCH_RADIUS + SHOULDER} 0`,
    `L ${w - CORNER_RADIUS} 0`,
    `A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 ${w} ${CORNER_RADIUS}`,
    `L ${w} ${BAR_HEIGHT - CORNER_RADIUS}`,
    `A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 ${w - CORNER_RADIUS} ${BAR_HEIGHT}`,
    `L ${CORNER_RADIUS} ${BAR_HEIGHT}`,
    `A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 0 ${BAR_HEIGHT - CORNER_RADIUS}`,
    `L 0 ${CORNER_RADIUS}`,
    `A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 ${CORNER_RADIUS} 0`,
    "Z",
  ].join(" ");
}

export function BottomNav() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="fixed bottom-3 inset-x-3 z-50 mx-auto max-w-md">
      <div
        ref={containerRef}
        className="relative"
        style={{ height: BAR_HEIGHT }}
      >
        <svg
          width={width}
          height={BAR_HEIGHT}
          viewBox={`0 0 ${width} ${BAR_HEIGHT}`}
          className="absolute inset-0"
          aria-hidden
          style={{
            filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.08))",
          }}
        >
          <path d={buildPath(width)} fill="white" />
        </svg>

        <div className="relative h-full flex items-center">
          <div className="flex-1 flex justify-around">
            {leftItems.map((item) => (
              <NavTab key={item.href} item={item} active={pathname.startsWith(item.href)} />
            ))}
          </div>

          <div className="shrink-0" style={{ width: (NOTCH_RADIUS + SHOULDER) * 2 }} />

          <div className="flex-1 flex justify-around">
            {rightItems.map((item) => (
              <NavTab key={item.href} item={item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        </div>

        <Link
          href="/scan"
          aria-label="Ajouter"
          className="absolute left-1/2 -translate-x-1/2 size-12 rounded-full flex items-center justify-center text-white shadow-lg"
          style={{
            backgroundColor: "var(--sane-plus)",
            top: SHOULDER - 24,
          }}
        >
          <Plus className="size-6" />
        </Link>
      </div>
    </nav>
  );
}

function NavTab({
  item,
  active,
}: {
  item: { href: string; label: string; icon: LucideIcon };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
        active ? "" : "text-muted-foreground",
      )}
      style={active ? { color: "var(--sane-accent)" } : undefined}
    >
      <Icon className="size-5" />
      <span className="text-[10px] font-medium">{item.label}</span>
    </Link>
  );
}
