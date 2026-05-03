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
import Image from "next/image";

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background overflow-hidden font-body">
      {/* Visual Branding Section - Landscape Desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-destructive/20 bg-destructive/5">
        <div className="absolute inset-0 bg-destructive/5 z-10" />
        <div className="scan-line z-20 bg-gradient-to-r from-transparent via-destructive to-transparent" />
        <Image 
          src="https://picsum.photos/seed/finance1/1200/800"
          alt="Admin Control"
          fill
          className="object-cover opacity-20 mix-blend-multiply grayscale contrast-125"
          priority
          data-ai-hint="security server"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50 z-10" />
        
        <div className="relative z-20 flex flex-col justify-between p-12 w-full h-full">
          <div className="flex items-center gap-3">
            <div className="rounded-sm border border-destructive/30 bg-destructive/10 p-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <span className="text-xl font-black tracking-[0.4em] text-foreground uppercase italic">SYSTEM TERMINAL</span>
          </div>

          <div className="space-y-6">
            <div className="inline-block px-3 py-1 border border-destructive/50 bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-[0.3em]">
              RESTRICTED AREA
            </div>
            <h2 className="text-5xl font-black tracking-tighter leading-none uppercase italic">
              COMMAND & <br />
              <span className="text-destructive">CONTROL</span>
            </h2>
            <p className="max-w-md text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground leading-relaxed">
              Administrative override protocol active. Full-spectrum monitoring and identity verification enabled for Level 4 personnel.
            </p>
          </div>

          <div className="flex items-center gap-2 opacity-50">
            <Terminal className="h-4 w-4 text-destructive" />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-destructive">Unauthorized access will be logged to global ledger</span>
          </div>
        </div>
      </div>

      {/* Admin Auth Terminal Section */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.05),transparent_70%)] lg:hidden" />
        
        <div className="w-full max-[420px] space-y-8 relative z-10 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="flex flex-col items-center space-y-4 lg:hidden">
            <div className="relative rounded-sm border border-destructive/30 bg-destructive/10 p-4">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-black tracking-[0.4em] text-foreground uppercase italic">ADMIN TERMINAL</h1>
          </div>

          <Card className="border-destructive/20 bg-card/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-none">
            <div className="h-1 w-full bg-destructive/50" />
            <CardHeader className="space-y-1 text-center bg-destructive/5 border-b border-destructive/10 pb-6 pt-8">
              <CardTitle className="text-xl font-bold tracking-tight uppercase">
                {isRegistering ? "Register Admin" : "Authorize Access"}
              </CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mt-2">
                Identity validation required for system override
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-8 px-8">
              <form onSubmit={handleAuth} className="space-y-5">
                {isRegistering && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Assigned Alias</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="SYSTEM_ADMIN"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 bg-background/50 border-destructive/20 text-sm focus-visible:ring-destructive font-mono rounded-none"
                        required
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
                      placeholder="admin@firm.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-background/50 border-destructive/20 text-sm focus-visible:ring-destructive font-mono rounded-none"
                      required
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
                      className="pl-10 bg-background/50 border-destructive/20 text-sm focus-visible:ring-destructive font-mono rounded-none"
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full h-12 bg-destructive text-destructive-foreground font-black uppercase tracking-[0.2em] hover:bg-destructive/90 transition-all active:scale-95 shadow-lg shadow-destructive/20 rounded-none mt-4"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRegistering ? "CREATE ACCOUNT" : "AUTHENTICATE")}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 pb-8 pt-4 bg-destructive/5 border-t border-destructive/10">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                disabled={isPending}
                className="text-[9px] font-bold uppercase tracking-[0.2em] text-destructive hover:underline"
              >
                {isRegistering ? "Return to Gate" : "Request Admin Credentials"}
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
    </div>
  );
}
