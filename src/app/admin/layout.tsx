
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Terminal, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "investorProfiles", user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    // Skip auth check for the dedicated login page to avoid loops
    if (pathname === "/admin/login") {
      setIsAuthorized(true);
      return;
    }

    if (!isUserLoading && !isProfileLoading) {
      if (!user) {
        router.push("/admin/login");
        return;
      }

      if (profile?.role !== "admin") {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, isUserLoading, profile, isProfileLoading, router, pathname]);

  // Handle Loading State
  if (isUserLoading || (isProfileLoading && pathname !== "/admin/login")) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
        <Terminal className="h-8 w-8 animate-pulse text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Verifying Authority...</span>
      </div>
    );
  }

  // Handle Unauthorized Access
  if (isAuthorized === false && pathname !== "/admin/login") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6 text-center gap-6">
        <div className="p-12 border border-destructive/30 bg-destructive/5 rounded-none border-glow">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-black uppercase tracking-widest text-destructive mb-4">Security Breach</h1>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Your credentials do not grant access to this sector. All unauthorized access attempts are logged.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push("/")}
          className="font-bold uppercase tracking-widest text-[10px] border-border h-12 px-8"
        >
          Return to Public Sector
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
