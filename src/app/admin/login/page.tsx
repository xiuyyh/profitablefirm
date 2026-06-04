
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ShieldAlert, Terminal, Loader2, User as UserIcon } from "lucide-react";
import { doc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { user, isUserLoading } = useUser();
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
    if (user && !isUserLoading && profile?.role === "admin") {
      router.push("/admin");
    }
  }, [user, isUserLoading, profile, router]);

  // Handle profile creation for new admins
  useEffect(() => {
    if (user && isRegistering && db && !isUserLoading && !profile) {
      const newProfileRef = doc(db, "investorProfiles", user.uid);
      setDocumentNonBlocking(newProfileRef, {
        id: user.uid,
        firstName: username || "Admin",
        lastName: "",
        email: user.email,
        role: "admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({
        title: "ADMIN ACCOUNT CREATED",
        description: "Your administrative authority has been established.",
      });
    }
  }, [user, isRegistering, db, isUserLoading, profile, username, toast]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    if (isRegistering) {
      initiateEmailSignUp(auth, email, password);
    } else {
      initiateEmailSignIn(auth, email, password);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05),transparent_70%)]" />
      <div className="scan-line" />
      
      <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="p-4 border border-primary/30 bg-primary/10 rounded-none glow-primary">
            <ShieldAlert className="h-10 w-10 text-primary glow-text" />
          </div>
          <h1 className="text-2xl font-black tracking-[0.4em] uppercase text-foreground text-center">Admin Terminal</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase opacity-50">
            {isRegistering ? "Registering New Authority" : "Authorized Personnel Only"}
          </p>
        </div>

        <Card className="border-border bg-card/50 backdrop-blur-xl shadow-none rounded-none border-glow overflow-hidden">
          <div className="h-1 w-full bg-primary" />
          <CardHeader className="space-y-1 text-center bg-primary/5 pb-8 pt-10 border-b border-border">
            <CardTitle className="text-lg font-black tracking-widest uppercase italic">
              {isRegistering ? "Establish Credentials" : "Secure Login"}
            </CardTitle>
            <CardDescription className="text-[9px] uppercase tracking-[0.3em] font-mono mt-2">
              {isRegistering ? "Create a new administrative node" : "Enter credentials to gain access"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8 pb-6">
            <form onSubmit={handleAuth} className="space-y-6">
              {isRegistering && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70">Admin Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-primary/40" />
                    <Input 
                      placeholder="e.g. System Administrator"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-background/50 border-border font-mono text-sm focus-visible:ring-primary rounded-none h-12"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70">Secure Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-primary/40" />
                  <Input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-border font-mono text-sm focus-visible:ring-primary rounded-none h-12"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70">Encrypted Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-primary/40" />
                  <Input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-border font-mono text-sm focus-visible:ring-primary rounded-none h-12"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-[0.3em] hover:bg-primary/90 glow-primary rounded-none"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (isRegistering ? "Create Admin Node" : "Initiate Access")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8 pt-2 bg-primary/5 border-t border-border">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={isPending}
              className="text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors"
            >
              {isRegistering ? "Back to Secure Login" : "Register new admin account"}
            </button>
          </CardFooter>
        </Card>
        
        <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
          <Terminal className="h-3 w-3" />
          <span className="text-[8px] font-bold uppercase tracking-[0.5em]">System Protected by AES-256 Encryption</span>
        </div>
      </div>
    </div>
  );
}
