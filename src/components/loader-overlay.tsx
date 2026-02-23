import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

interface LoaderOverlayProps {
  className?: string;
}

export function LoaderOverlay({ className }: LoaderOverlayProps) {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 w-screen h-screen bg-white/75 flex justify-center items-center rounded-md z-10",
        className,
      )}
    >
      <Loader size="lg" />
    </div>
  );
}
