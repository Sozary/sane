import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background pb-20">
      <main className="flex-1 max-w-md mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
