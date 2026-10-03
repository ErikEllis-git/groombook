import { business } from "@/config";

/** Shown only on the public demo deployment (NEXT_PUBLIC_DEMO_MODE=true). */
export function DemoBanner({ children }: { children: React.ReactNode }) {
  if (!business.demoMode) return null;
  return (
    <p
      role="note"
      className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950"
    >
      {children}
    </p>
  );
}
