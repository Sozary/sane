"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      {children}
    </div>
  );
}
