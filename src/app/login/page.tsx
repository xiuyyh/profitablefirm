
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
import { Shield, Lock, Mail, Terminal, User as UserIcon, Loader2 } from "lucide-react";
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
          title: "Authentication Successful",
          description: isRegistering ? "Your account has been created." : "Welcome back to the dashboard.",
        });
        setIsPending(false);
      }
      
      // Redirect based on role
      if (profile.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [user, isUserLoading, profile, router, isPending, isRegistering, toast]);

  useEffect(() => {
    if (userError && isPending) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: userError.message || "Could not verify credentials.",
      });
      setIsPending(false);
    }
  }, [userError, isPending, toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !username)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide all required credentials.",
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
        lastName: "",
        email: user.email,
        role: "investor",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  }, [user, isRegistering, username, db]);

  if (isUserLoading && !isPending) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Terminal className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-4 font-body z-50">
      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center space-y-2">
          <div className="rounded border border-primary/20 bg-primary/5 p-3">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-foreground uppercase">PROFITABLEFIRM</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Portfolio Manager</p>
        </div>

        <Card className="border-border bg-card shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl font-bold tracking-tight">
              {isRegistering ? "Create Account" : "Login"}
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider">
              {isRegistering ? "Register your new account" : "Enter your credentials to access your portfolio"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Username</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-background border-border text-sm focus-visible:ring-primary"
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background border-border text-sm focus-visible:ring-primary"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background border-border text-sm focus-visible:ring-primary"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full h-11 bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:bg-primary/90"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  isRegistering ? "Sign Up" : "Login"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={isPending}
              className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline disabled:opacity-50"
            >
              {isRegistering ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </button>
            <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-border w-full">
               <button 
                onClick={() => router.push("/admin/login")}
                className="text-[9px] uppercase font-bold text-muted-foreground hover:text-destructive transition-colors tracking-[0.2em]"
              >
                Administrative Portal Access
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
