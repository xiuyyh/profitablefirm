
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Mail, Terminal, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, serverTimestamp } from "firebase/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !username)) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Please provide all required credentials.",
      });
      return;
    }

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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  }, [user, isRegistering, username, db]);

  if (isUserLoading) {
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
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Investor Terminal</p>
        </div>

        <Card className="border-border bg-card shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl font-bold tracking-tight">
              {isRegistering ? "Initialize Investor Profile" : "Identity Verification"}
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider">
              {isRegistering ? "Register your institutional account" : "Enter authorized credentials to proceed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Username / Identity</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="investor_01"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-background border-border text-sm focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resource Identifier (Email)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@firm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background border-border text-sm focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Access Token (Password)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background border-border text-sm focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:bg-primary/90">
                {isRegistering ? "Create Investor Account" : "Authorize Session"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
            >
              {isRegistering ? "Switch to existing session" : "Initialize new investor identity"}
            </button>
            <p className="text-[9px] text-center leading-relaxed text-muted-foreground uppercase tracking-tighter opacity-50">
              Authorized personnel only. Access is monitored and logged. <br />
              System Version: 2.4.0-SECURE
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
