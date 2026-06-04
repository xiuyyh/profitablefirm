"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  CreditCard, 
  Wallet, 
  ShieldCheck, 
  Terminal,
  Info,
  ChevronRight,
  BadgeDollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function DepositPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep = () => {
    const numAmount = Number(amount);
    if (!amount || numAmount < 100) {
      toast({
        variant: "destructive",
        title: "Minimum Amount Required",
        description: "The minimum amount you can add is $100.",
      });
      return;
    }
    setStep(2);
  };

  const handleSubmitDeposit = () => {
    if (!senderAddress) {
      toast({
        variant: "destructive",
        title: "Information Required",
        description: "Please enter your wallet address so we can verify your payment.",
      });
      return;
    }

    if (!firestore || !user) return;
    setIsSubmitting(true);

    const colRef = collection(firestore, "investorProfiles", user.uid, "transactions");
    addDocumentNonBlocking(colRef, {
      investorId: user.uid,
      type: "Deposit",
      amount: Number(amount),
      currency: "USD",
      description: "Money Added (Pending)",
      senderAddress: senderAddress,
      status: "Pending",
      createdAt: serverTimestamp(),
    });

    toast({
      title: "Request Received",
      description: "We are now checking your payment. This will update shortly.",
    });

    setTimeout(() => {
      router.push("/transactions");
    }, 1500);
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Terminal className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset className="w-full">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Add Money
            </h1>
          </div>
        </header>

        <main className="p-6 md:p-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="w-full max-w-md space-y-6">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className={`h-2 w-12 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-2 w-12 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>

            {step === 1 ? (
              <Card className="border-border bg-card shadow-none border-glow animate-in fade-in slide-in-from-bottom-4">
                <CardHeader className="bg-muted/10 border-b">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <BadgeDollarSign className="h-4 w-4" /> Deposit Funds
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-tighter">Enter the amount you want to add to your account (Min $100).</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount ($)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$</span>
                      <Input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="100.00"
                        className="pl-8 bg-background border-border font-mono text-lg"
                      />
                    </div>
                  </div>
                  <Button onClick={handleNextStep} className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] py-6">
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-card shadow-none border-glow animate-in fade-in slide-in-from-right-4">
                <CardHeader className="bg-muted/10 border-b">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Confirm Payment
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-tighter">Send your payment and provide your address below.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <Alert className="bg-primary/5 border-primary/20 text-primary rounded-none">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-[10px] font-black uppercase tracking-widest">How to pay</AlertTitle>
                    <AlertDescription className="text-[9px] uppercase tracking-tighter mt-1">
                      Please send ${Number(amount).toLocaleString()} to the wallet address shown below. Once done, enter your address so we can find your payment.
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 bg-muted/20 border border-border/50 rounded-sm space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Company Wallet Address</p>
                    <p className="text-xs font-mono break-all text-foreground">0x71C7656EC7ab88b098defB751B7401B5f6d8976F</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Wallet Address</Label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={senderAddress} 
                        onChange={(e) => setSenderAddress(e.target.value)}
                        placeholder="Your 0x address"
                        className="pl-10 bg-background border-border font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-border font-bold uppercase tracking-widest text-[10px]">Back</Button>
                    <Button onClick={handleSubmitDeposit} disabled={isSubmitting} className="flex-[2] bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px]">
                      {isSubmitting ? "Sending..." : "I've Sent Payment"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-center gap-2 opacity-30">
              <ShieldCheck className="h-3 w-3" />
              <span className="text-[8px] font-bold uppercase tracking-[0.3em]">Secure Payment System Active</span>
            </div>
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
