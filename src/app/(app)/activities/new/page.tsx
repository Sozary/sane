import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { NewActivityForm } from "@/components/new-activity-form";

export default function NewActivityPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewActivityForm />
    </Suspense>
  );
}
