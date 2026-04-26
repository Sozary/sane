import { BottomNav } from "@/components/bottom-nav";
import { NotificationPrompt } from "@/components/notification-prompt";
import { PageTransition } from "@/components/page-transition";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <main className="flex-1 max-w-md mx-auto w-full pb-24">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
      <NotificationPrompt />
    </div>
  );
}
