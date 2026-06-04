"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Terminal } from "lucide-react";

/**
 * Global Ledger Page
 * This page has been decommissioned as requested.
 * It now provides a secure redirect to the main admin control panel.
 */
export default function DecommissionedLedgerPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediate redirect to prevent access to decommissioned logic
    const timer = setTimeout(() => {
      router.push("/admin");
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-center p-6">
      <Terminal className="h-12 w-12 text-destructive animate-pulse mb-4" />
      <h1 className="text-xl font-black tracking-widest uppercase italic">NODE DECOMMISSIONED</h1>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 max-w-xs">
        The Global Ledger protocol has been terminated by administrator command. 
        Redirecting to primary control node...
      </p>
    </div>
  );
}