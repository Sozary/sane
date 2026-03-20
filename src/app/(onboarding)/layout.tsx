export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        {children}
      </div>
    </div>
  );
}
