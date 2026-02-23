import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

interface LoaderOverlayProps {
  className?: string;
}

export function LoaderOverlay({ className }: LoaderOverlayProps) {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 z-10 flex h-screen w-screen items-center justify-center rounded-md bg-white/75",
        className,
      )}
    >
      <Loader size="lg" />
    </div>
  );
}
