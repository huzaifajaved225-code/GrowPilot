import { Spinner } from "@/components/ui/spinner";

export default function Loading(): React.JSX.Element {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32} />
        <p className="text-sm text-muted-foreground">Loading GrowPilot…</p>
      </div>
    </div>
  );
}
