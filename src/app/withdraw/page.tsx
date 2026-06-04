
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Wallet, 
  ShieldCheck, 
  Terminal,
  ChevronRight,
  BadgeDollarSign,
  ChevronLeft,
  ArrowUpToLine
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function WithdrawPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep = () => {
    if (step === 1) {
      const numAmount = Number(amount);
      if (!amount || numAmount <= 0) {
        toast({
          variant: "destructive",
          title: "Amount Required",
          description: "Please enter a valid amount to withdraw.",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!method) {
        toast({
          variant: "destructive",
          title: "Network Required",
          description: "Please select a withdrawal network.",
        });
        return;
      }
      setStep(3);
    }
  };

  const handleSubmitWithdrawal = () => {
    if (!destinationAddress) {
      toast({
        variant: "destructive",
        title: "Address Required",
        description: "Please enter your destination wallet address.",
      });
      return;
    }

    if (!firestore || !user) return;
    setIsSubmitting(true);

    const colRef = collection(firestore, "investorProfiles", user.uid, "transactions");
    addDocumentNonBlocking(colRef, {
      investorId: user.uid,
      type: "Withdrawal",
      amount: Number(amount),
      currency: "USD",
      description: `Withdrawal to ${method} (Pending)`,
      paymentMethod: method,
      destinationAddress: destinationAddress,
      status: "Pending",
      createdAt: serverTimestamp(),
    });

    toast({
      title: "Request Submitted",
      description: "Your withdrawal request is being processed by the system.",
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
              <ArrowUpToLine className="h-5 w-5 text-primary" />
              Withdraw Funds
            </h1>
          </div>
        </header>

        <main className="p-6 md:p-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="w-full max-w-md space-y-6">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className={`h-1.5 w-12 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-1.5 w-12 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-1.5 w-12 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            </div>

            {step === 1 && (
              <Card className="border-border bg-card shadow-none border-glow animate-in fade-in slide-in-from-bottom-4">
                <CardHeader className="bg-muted/10 border-b">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <BadgeDollarSign className="h-4 w-4" /> 1. Enter Amount
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-tighter">Enter the amount you wish to withdraw.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Withdrawal Amount ($)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$</span>
                      <Input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="pl-8 bg-background border-border font-mono text-lg"
                      />
                    </div>
                  </div>
                  <Button onClick={handleNextStep} className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] py-6">
                    Next Step <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="border-border bg-card shadow-none border-glow animate-in fade-in slide-in-from-right-4">
                <CardHeader className="bg-muted/10 border-b">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Wallet className="h-4 w-4" /> 2. Select Network
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-tighter">Choose the network for your withdrawal.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Network</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Choose a network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">BTC (Bitcoin)</SelectItem>
                        <SelectItem value="ETH">ETH (Ethereum)</SelectItem>
                        <SelectItem value="USDT(TRX)">USDT (TRX/TRC20)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-border font-bold uppercase tracking-widest text-[10px]">
                      <ChevronLeft className="mr-1 h-3 w-3" /> Back
                    </Button>
                    <Button onClick={handleNextStep} className="flex-[2] bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px]">
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="border-border bg-card shadow-none border-glow animate-in fade-in slide-in-from-right-4">
                <CardHeader className="bg-muted/10 border-b">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> 3. Destination Address
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-tighter">Enter your external wallet address.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your {method} Wallet Address</Label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={destinationAddress} 
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        placeholder="Enter Address"
                        className="pl-10 bg-background border-border font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-border font-bold uppercase tracking-widest text-[10px]">
                      <ChevronLeft className="mr-1 h-3 w-3" /> Back
                    </Button>
                    <Button onClick={handleSubmitWithdrawal} disabled={isSubmitting} className="flex-[2] bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px]">
                      {isSubmitting ? "Submitting..." : "Confirm Withdrawal"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-center gap-2 opacity-30">
              <ShieldCheck className="h-3 w-3" />
              <span className="text-[8px] font-bold uppercase tracking-[0.3em]">Secure Transaction Request</span>
            </div>
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
