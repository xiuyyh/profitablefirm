"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Terminal, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "investorProfiles", user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading) {
      if (!user || profile?.role !== "admin") {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, isUserLoading, profile, isProfileLoading]);

  if (isUserLoading || isProfileLoading || isAuthorized === null) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
        <Terminal className="h-8 w-8 animate-pulse text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Verifying Authority...</span>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6 text-center gap-6">
        <div className="p-6 border border-destructive/30 bg-destructive/5 rounded-none glow-primary">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-black uppercase tracking-widest text-destructive mb-2">Access Denied</h1>
          <p className="text-[10px] uppercase tracking-tighter text-muted-foreground max-w-xs mx-auto">
            You do not have the administrative credentials required to access this sector of the network.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push("/")}
          className="font-bold uppercase tracking-widest text-[10px] border-border"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
