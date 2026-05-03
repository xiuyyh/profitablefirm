
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Lock, Mail, Terminal, User as UserIcon, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, serverTimestamp } from "firebase/firestore";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
  const { user, isUserLoading, userError } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "investorProfiles", user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(profileRef);

  useEffect(() => {
    if (user && !isUserLoading && profile) {
      if (profile.role === "admin") {
        toast({
          title: "Authorization Confirmed",
          description: "Admin session initialized.",
        });
        router.push("/admin");
      } else if (profile.role === "investor") {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Insufficient privileges for administrative access.",
        });
        router.push("/");
      }
    }
  }, [user, isUserLoading, profile, router, toast]);

  useEffect(() => {
    if (userError && isPending) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: userError.message || "Credential verification failed.",
      });
      setIsPending(false);
    }
  }, [userError, isPending, toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !username)) {
      toast({
        variant: "destructive",
        title: "Input Error",
        description: "All authorization fields are required.",
      });
      return;
    }

    setIsPending(true);
    if (isRegistering) {
      initiateEmailSignUp(auth, email, password);
    } else {
      initiateEmailSignIn(auth, email, password);
    }
  };

  useEffect(() => {
    if (user && isRegistering && username && db) {
      const profileRef = doc(db, "investorProfiles", user.uid);
      setDocumentNonBlocking(profileRef, {
        id: user.uid,
        firstName: username,
        lastName: "(Admin)",
        email: user.email,
        role: "admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  }, [user, isRegistering, username, db]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-4 font-body z-50">
      <div className="w-full max-w-[420px] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded bg-destructive/20" />
            <div className="relative rounded border border-destructive/30 bg-destructive/10 p-4">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-widest text-foreground uppercase italic">ADMIN TERMINAL</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-destructive">Level 4 Restriction - Secure Gate</p>
          </div>
        </div>

        <Card className="border-destructive/20 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="h-1 w-full bg-destructive/50" />
          <CardHeader className="space-y-1 text-center bg-destructive/5 border-b border-destructive/10">
            <CardTitle className="text-lg font-bold tracking-tight uppercase">
              {isRegistering ? "Register Admin Identity" : "Authorize Admin Access"}
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              Identity validation required for system override
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Assigned Alias</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="e.g. SYSTEM_ADMIN"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-background/50 border-destructive/20 text-sm focus-visible:ring-destructive font-mono"
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Secure Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@profitablefirm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-destructive/20 text-sm focus-visible:ring-destructive font-mono"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Access Passcode</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-destructive/20 text-sm focus-visible:ring-destructive font-mono"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full h-12 bg-destructive text-destructive-foreground font-black uppercase tracking-[0.2em] hover:bg-destructive/90 transition-all active:scale-95 shadow-lg shadow-destructive/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    validating...
                  </>
                ) : (
                  isRegistering ? "CREATE ADMIN ACCOUNT" : "AUTHENTICATE ACCESS"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 pb-6 bg-destructive/5 border-t border-destructive/10 pt-4">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={isPending}
              className="text-[9px] font-bold uppercase tracking-[0.2em] text-destructive hover:underline disabled:opacity-50"
            >
              {isRegistering ? "Existing Admin? Return to Gate" : "Request Admin Credentials"}
            </button>
            <div className="flex flex-col items-center gap-2 opacity-40">
              <ShieldCheck className="h-3 w-3" />
              <p className="text-[8px] text-center leading-relaxed font-mono uppercase tracking-tighter">
                End-to-end encrypted protocol active. Session monitored by global audit logs.
              </p>
            </div>
          </CardFooter>
        </Card>
        
        <div className="flex justify-center">
           <button 
             onClick={() => router.push("/login")}
             className="text-[9px] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors tracking-widest"
           >
             Return to Investor Terminal
           </button>
        </div>
      </div>
    </div>
  );
}
