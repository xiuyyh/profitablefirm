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
import { Shield, Lock, Mail, Terminal, User as UserIcon, Loader2, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, serverTimestamp } from "firebase/firestore";

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
    <div className="fixed inset-0 flex items-center justify-center bg-background p-4 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05),transparent_70%)]" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
      
      <div className="w-full max-w-[420px] space-y-8 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative rounded-sm border border-primary/30 bg-primary/10 p-5 glow-primary">
              <Cpu className="h-10 w-10 text-primary glow-text" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-[0.4em] text-foreground glow-text uppercase">PROFITABLEFIRM</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/70">Neural Financial Terminal</p>
          </div>
        </div>

        <Card className="border-primary/20 bg-card/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
          <CardHeader className="space-y-1 text-center bg-primary/5 border-b border-primary/10 pb-6 pt-8">
            <CardTitle className="text-xl font-black tracking-widest uppercase">
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
                End-to-end neural encryption active. unauthorized access attempts are logged to the global ledger.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}