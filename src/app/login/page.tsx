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
import { Lock, Mail, User as UserIcon, Loader2, Cpu, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";

export default function LoginPage() {
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
      if (isPending) {
        toast({
          title: "NEURAL LINK ESTABLISHED",
          description: isRegistering ? "Identity registered in global nodes." : "Authentication verified.",
        });
        setIsPending(false);
      }
      if (profile.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [user, isUserLoading, profile, router, isPending, isRegistering, toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
        lastName: "",
        email: user.email,
        role: "investor",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  }, [user, isRegistering, username, db]);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background overflow-hidden font-body">
      {/* Visual Branding Section - Landscape Desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-primary/20">
        <div className="absolute inset-0 bg-primary/5 z-10" />
        <div className="scan-line z-20" />
        <Image 
          src="https://picsum.photos/seed/finance1/1200/800"
          alt="Neural Interface"
          fill
          className="object-cover opacity-40 mix-blend-luminosity grayscale"
          priority
          data-ai-hint="finance dashboard"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50 z-10" />
        
        <div className="relative z-20 flex flex-col justify-between p-12 w-full h-full">
          <div className="flex items-center gap-3">
            <div className="rounded-sm border border-primary/30 bg-primary/10 p-2 glow-primary">
              <Cpu className="h-6 w-6 text-primary glow-text" />
            </div>
            <span className="text-xl font-black tracking-[0.4em] text-foreground glow-text uppercase">PROFITABLEFIRM</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl font-black tracking-tighter leading-none glow-text uppercase">
              INSTITUTIONAL <br />
              <span className="text-primary">INTELLIGENCE</span>
            </h2>
            <p className="max-w-md text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground leading-relaxed">
              Experience the next generation of financial monitoring. Real-time neural links, deterministic accrual, and institutional-grade auditing.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-primary uppercase">Uptime</span>
                <span className="text-lg font-mono font-bold">99.999%</span>
              </div>
              <div className="h-10 w-px bg-primary/20" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-primary uppercase">Security</span>
                <span className="text-lg font-mono font-bold uppercase">Level 4</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-50">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]">End-to-End Neural Encryption Active</span>
          </div>
        </div>
      </div>

      {/* Auth Terminal Section */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05),transparent_70%)] lg:hidden" />
        
        <div className="w-full max-[420px] space-y-8 relative z-10 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="flex flex-col items-center space-y-4 lg:hidden">
            <div className="relative rounded-sm border border-primary/30 bg-primary/10 p-4 glow-primary">
              <Cpu className="h-8 w-8 text-primary glow-text" />
            </div>
            <h1 className="text-2xl font-black tracking-[0.4em] text-foreground glow-text uppercase">PROFITABLEFIRM</h1>
          </div>

          <Card className="border-primary/20 bg-card/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-none">
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            <CardHeader className="space-y-1 text-center bg-primary/5 border-b border-primary/10 pb-6 pt-8">
              <CardTitle className="text-xl font-black tracking-widest uppercase italic">
                {isRegistering ? "Register Node" : "Access Terminal"}
              </CardTitle>
              <CardDescription className="text-[9px] uppercase tracking-[0.3em] font-mono text-muted-foreground mt-2">
                Identity validation required for encrypted session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-8 px-8">
              <form onSubmit={handleAuth} className="space-y-5">
                {isRegistering && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70 ml-1">Identity Alias</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-primary/40" />
                      <Input
                        id="username"
                        placeholder="e.g. USER_01"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 bg-background/50 border-primary/20 text-sm focus-visible:ring-primary font-mono rounded-none"
                        required
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70 ml-1">Secure Channel (Email)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-primary/40" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="protocol@firm.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-background/50 border-primary/20 text-sm focus-visible:ring-primary font-mono rounded-none"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70 ml-1">Access Passphrase</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-primary/40" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-background/50 border-primary/20 text-sm focus-visible:ring-primary font-mono rounded-none"
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full h-12 bg-primary text-primary-foreground font-black uppercase tracking-[0.3em] hover:bg-primary/90 transition-all active:scale-95 glow-primary rounded-none mt-4"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRegistering ? "INITIALIZE" : "AUTHENTICATE")}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 pb-8 pt-4 bg-primary/5 border-t border-primary/10">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                disabled={isPending}
                className="text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors"
              >
                {isRegistering ? "Return to Login" : "Initialize New Node"}
              </button>
              <div className="flex flex-col items-center gap-2 opacity-30 px-6">
                <p className="text-[8px] text-center leading-relaxed font-mono uppercase tracking-tighter">
                  Authorized access only. Session monitored by global neural audit logs.
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
