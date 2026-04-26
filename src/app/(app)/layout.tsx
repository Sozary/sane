import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationPrompt } from "@/components/notification-prompt";
import { PageTransition } from "@/components/page-transition";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <main className="flex-1 max-w-md mx-auto w-full pb-24">
        <Suspense fallback={children}>
          <PageTransition>{children}</PageTransition>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
      <Suspense fallback={null}>
        <NotificationPrompt />
      </Suspense>
    </div>
  );
}
