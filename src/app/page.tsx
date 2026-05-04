
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { 
  DollarSign, 
  TrendingUp, 
  Briefcase, 
  Activity, 
  Search,
  Shield,
  Terminal,
  Zap,
  CreditCard
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isProcessingYield, setIsProcessingYield] = useState(false);
  const [marketNoise, setMarketNoise] = useState(1);
  const accrualStreak = useRef(0);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "investorProfiles", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(profileRef);

  // TICKER NOISE CONTROLLER
  useEffect(() => {
    if (!profile?.autoProfitEnabled) {
      setMarketNoise(1);
      return;
    }
    const interval = setInterval(() => {
      const noise = 0.999 + (Math.random() * 0.002);
      setMarketNoise(noise);
    }, 400);
    return () => clearInterval(interval);
  }, [profile?.autoProfitEnabled]);

  const investmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "investorProfiles", user.uid, "investments");
  }, [firestore, user?.uid]);

  const { data: investments, isLoading: isInvestmentsLoading } = useCollection(investmentsQuery);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "investorProfiles", user.uid, "transactions");
  }, [firestore, user?.uid]);

  const { data: transactions } = useCollection(transactionsQuery);

  // LEDGER ACCOUNTING
  const ledgerBalance = useMemo(() => {
    const calculated = transactions?.reduce((sum, tx) => {
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum + tx.amount;
    }, 0) || 0;
    return profile?.manualLedgerOverride ?? calculated;
  }, [transactions, profile]);

  const netExternalCapital = useMemo(() => {
    const assetCostBasis = investments?.reduce((sum, inv) => sum + (inv.purchasePricePerUnit * inv.quantity), 0) || 0;
    const netCashInjected = transactions?.reduce((sum, tx) => {
      if (tx.type === 'Deposit') return sum + tx.amount;
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum;
    }, 0) || 0;
    return assetCostBasis + netCashInjected;
  }, [investments, transactions]);

  // INSTITUTIONAL MOMENTUM ENGINE
  useEffect(() => {
    if (profile?.autoProfitEnabled && !isProcessingYield && firestore && user && netExternalCapital > 0) {
      const interval = setInterval(() => {
        const now = new Date();
        const lastAccrual = profile.lastYieldAccrualAt 
          ? new Date(profile.lastYieldAccrualAt.seconds * 1000) 
          : new Date(profile.createdAt?.seconds * 1000 || Date.now());

        const secondsPassed = (now.getTime() - lastAccrual.getTime()) / 1000;
        const stepSize = 60;

        if (secondsPassed >= stepSize && !isProcessingYield) { 
          setIsProcessingYield(true);
          
          const stepsToProcess = Math.min(Math.floor(secondsPassed / stepSize), 1440);
          let cumulativeProfit = 0;
          let currentStreak = accrualStreak.current;

          for (let i = 0; i < stepsToProcess; i++) {
            const baseProfitPerStep = (profile.dailyProfitAmount || 0) / (24 * 60);
            let multiplier = 1;

            if (currentStreak >= 5) {
              multiplier = -1.2; 
              currentStreak = 0;
            } else {
              if (Math.random() > 0.2) {
                multiplier = 1.8; 
                currentStreak += 1;
              } else {
                multiplier = 0.8; 
                currentStreak = 0;
              }
            }
            cumulativeProfit += baseProfitPerStep * multiplier;
          }

          accrualStreak.current = currentStreak;
          const targets = investments?.filter(inv => inv.type === profile.profitAssetType) || [];
          
          if (targets.length > 0) {
            targets.forEach(target => {
              const portionProfit = cumulativeProfit / targets.length;
              const profitPerUnit = portionProfit / target.quantity;
              const newPrice = target.currentMarketPricePerUnit + profitPerUnit;

              const invRef = doc(firestore, "investorProfiles", user.uid, "investments", target.id);
              updateDocumentNonBlocking(invRef, {
                currentMarketPricePerUnit: newPrice,
                lastPriceUpdate: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            });
          } else {
            const transRef = collection(firestore, "investorProfiles", user.uid, "transactions");
            addDocumentNonBlocking(transRef, {
              investorId: user.uid,
              type: 'Profit',
              amount: cumulativeProfit,
              currency: 'USD',
              description: stepsToProcess > 1 ? `Offline Catch-up (${stepsToProcess}m)` : 'Real-Time Yield Distribution',
              status: 'Completed',
              createdAt: serverTimestamp()
            });
          }

          const profRef = doc(firestore, "investorProfiles", user.uid);
          updateDocumentNonBlocking(profRef, {
            lastYieldAccrualAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          setTimeout(() => setIsProcessingYield(false), 1500);
        }
      }, 5000); 
      
      return () => clearInterval(interval);
    }
  }, [profile, investments, firestore, user, isProcessingYield, netExternalCapital]);

  const baseInvestmentValue = useMemo(() => {
    return investments?.reduce((sum, inv) => sum + (inv.currentMarketPricePerUnit * inv.quantity), 0) || 0;
  }, [investments]);

  // DETERMINISTIC EQUITY CALCULATION
  const settledEquity = profile?.manualAumOverride ?? (baseInvestmentValue + ledgerBalance);
  const totalAccountEquity = settledEquity * marketNoise;
  const netPnL = profile?.manualPnlOverride ?? (settledEquity - netExternalCapital);
  const pnlPercentage = netExternalCapital > 0 ? (netPnL / netExternalCapital) * 100 : 0;

  const sortedInvestments = useMemo(() => {
    if (!investments) return [];
    return [...investments].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [investments]);

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
      <SidebarInset className="flex flex-col w-full">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <div className="relative w-full max-sm hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search portfolio nodes..."
                className="h-8 pl-8 bg-background border-border text-xs focus-visible:ring-primary rounded-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <div className={`h-2 w-2 rounded-full ${profile?.autoProfitEnabled ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-widest ${profile?.autoProfitEnabled ? 'text-primary glow-text' : 'text-muted-foreground'}`}>
                {profile?.autoProfitEnabled ? 'Neural Link Active' : 'Static Node'}
              </span>
            </div>
            <div className="h-7 w-7 rounded-sm bg-primary/10 flex items-center justify-center text-[10px] font-bold border border-primary/30 text-primary">
              {user.email?.substring(0, 2).toUpperCase() || "US"}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 space-y-6 w-full max-w-none">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Neural Investor Terminal</span>
              </div>
              <h1 className="text-2xl font-black tracking-widest glow-text">PORTFOLIO INTELLIGENCE</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Total Account Equity" 
              value={`$${totalAccountEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              trend={Number(pnlPercentage.toFixed(2))} 
              icon={DollarSign}
              variant="accent"
              trendLabel="LIVE BALANCE"
            />
            <MetricCard 
              title="Financial Ledger" 
              value={`$${ledgerBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              icon={CreditCard}
              trendLabel="SETTLED CASH"
            />
            <MetricCard 
              title="Net Delta (PnL)" 
              value={`${netPnL >= 0 ? '+' : ''}$${netPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              trend={Number(pnlPercentage.toFixed(2))} 
              icon={TrendingUp}
              trendLabel="TOTAL GROWTH"
            />
            <MetricCard 
              title="Accrual Velocity" 
              value={profile?.autoProfitEnabled ? `+$${profile.dailyProfitAmount.toFixed(2)}/day` : "OFFLINE"} 
              icon={Zap}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PerformanceChart currentTotal={settledEquity} />
            </div>
            <Card className="border border-border bg-card/40 shadow-none border-glow h-full">
              <CardHeader className="pb-2 border-b border-border/10 bg-muted/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">System Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="p-4 bg-muted/20 border border-border/10 flex flex-col items-center justify-center gap-3 text-center">
                  <Activity className={`h-8 w-8 ${profile?.autoProfitEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">{profile?.autoProfitEnabled ? 'TRADING ACTIVE' : 'TRADING STATIC'}</p>
                    <p className="text-[9px] text-muted-foreground uppercase mt-1">Institutional nodes processing growth steps.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Engine Load</span>
                    <span>{profile?.autoProfitEnabled ? '84%' : '0%'}</span>
                  </div>
                  <div className="h-1 bg-muted rounded-none overflow-hidden">
                    <div className="h-full bg-primary glow-primary" style={{ width: profile?.autoProfitEnabled ? '84%' : '0%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-border bg-card shadow-none border-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b bg-muted/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Live Holding Auditor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isInvestmentsLoading ? (
                <div className="h-20 flex items-center justify-center">
                  <Terminal className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border bg-muted/10">
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10 px-6">Security</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10">Class</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] h-10 px-6">Valuation (USD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedInvestments.map((inv) => (
                      <TableRow key={inv.id} className="border-border hover:bg-primary/5 transition-colors">
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight text-foreground uppercase">{inv.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{inv.symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="secondary" className="text-[9px] uppercase tracking-widest bg-muted/30 font-bold px-2 py-0">
                            {inv.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-black text-sm py-4 px-6 text-primary glow-text">
                          ${((inv.currentMarketPricePerUnit * inv.quantity) * marketNoise).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </>
  );
}
