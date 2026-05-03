
"use client";

import { useEffect, useState, useMemo } from "react";
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
  PlusCircle,
  Shield,
  Terminal,
  Zap,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { collection, query, limit, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isProcessingYield, setIsProcessingYield] = useState(false);
  
  // UI Volatility Ticker state - High frequency for live market feel
  const [marketNoise, setMarketNoise] = useState(1);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // High-Frequency Market Ticker Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuation between -0.15% and +0.15% every 500ms for a very active feel
      const noise = 0.9985 + (Math.random() * 0.003);
      setMarketNoise(noise);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Fetch full profile for yield config
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "investorProfiles", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(profileRef);

  // Fetch Investments
  const investmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "investorProfiles", user.uid, "investments");
  }, [firestore, user?.uid]);

  const { data: investments, isLoading: isInvestmentsLoading } = useCollection(investmentsQuery);

  // Fetch Transactions for Ledger Balance
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "investorProfiles", user.uid, "transactions");
  }, [firestore, user?.uid]);

  const { data: transactions } = useCollection(transactionsQuery);

  // Yield Accrual Logic with High-Frequency Updates (Every 1 Minute)
  useEffect(() => {
    if (profile?.autoProfitEnabled && investments && investments.length > 0 && !isProcessingYield) {
      const interval = setInterval(() => {
        const now = new Date();
        const lastAccrual = profile.lastYieldAccrualAt 
          ? new Date(profile.lastYieldAccrualAt.seconds * 1000) 
          : new Date(profile.createdAt?.seconds * 1000 || Date.now());

        const secondsPassed = (now.getTime() - lastAccrual.getTime()) / 1000;

        // Process if at least 60 seconds have passed
        if (secondsPassed >= 60 && !isProcessingYield) { 
          setIsProcessingYield(true);
          
          // Calculate the exact portion of the daily profit for the elapsed time
          const dayFraction = secondsPassed / (24 * 3600);
          const baseProfitSlice = profile.dailyProfitAmount * dayFraction;
          
          // Real Trading Simulation variance: -20% to +220%
          const varianceFactor = -0.2 + (Math.random() * 2.4);
          const profitToApply = baseProfitSlice * varianceFactor;

          const targets = investments.filter(inv => inv.type === profile.profitAssetType);
          
          if (targets.length > 0) {
            const target = targets[0];
            const profitPerUnit = profitToApply / target.quantity;
            const newPrice = target.currentMarketPricePerUnit + profitPerUnit;

            const invRef = doc(firestore, "investorProfiles", user!.uid, "investments", target.id);
            updateDocumentNonBlocking(invRef, {
              currentMarketPricePerUnit: newPrice,
              lastPriceUpdate: serverTimestamp(),
              updatedAt: serverTimestamp()
            });

            const profRef = doc(firestore, "investorProfiles", user!.uid);
            updateDocumentNonBlocking(profRef, {
              lastYieldAccrualAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            
            setTimeout(() => setIsProcessingYield(false), 2000);
          } else {
            setIsProcessingYield(false);
          }
        }
      }, 30000); // Pulse check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [profile, investments, firestore, user, isProcessingYield]);

  // Derived Values
  const ledgerBalance = useMemo(() => {
    return transactions?.reduce((sum, tx) => {
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum + tx.amount;
    }, 0) || 0;
  }, [transactions]);

  const baseInvestmentValue = useMemo(() => {
    return investments?.reduce((sum, inv) => sum + (inv.currentMarketPricePerUnit * inv.quantity), 0) || 0;
  }, [investments]);

  const totalCost = useMemo(() => {
    return investments?.reduce((sum, inv) => sum + (inv.purchasePricePerUnit * inv.quantity), 0) || 0;
  }, [investments]);

  // Apply Live Ticker Noise to the entire Equity stack
  const totalAccountEquity = (baseInvestmentValue + ledgerBalance) * marketNoise;
  
  const unrealizedPnL = totalAccountEquity - (totalCost + ledgerBalance);
  const pnlPercentage = (totalCost + ledgerBalance) > 0 ? (unrealizedPnL / (totalCost + ledgerBalance)) * 100 : 0;

  // Real Asset Allocation
  const allocation = useMemo(() => {
    if (!investments || baseInvestmentValue === 0) return [];
    const types = ["Crypto", "Stock", "Forex", "Bond", "ETF"];
    return types.map(type => {
      const value = investments.filter(i => i.type === type).reduce((s, i) => s + (i.currentMarketPricePerUnit * i.quantity), 0);
      const percentage = (value / baseInvestmentValue) * 100;
      return { type, value, percentage };
    }).filter(a => a.value > 0);
  }, [investments, baseInvestmentValue]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Terminal className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-body antialiased">
      <AppSidebar />
      <SidebarInset className="flex flex-col w-full">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <div className="relative w-full max-w-sm hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search portfolio..."
                className="h-8 pl-8 bg-background border-border text-xs focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-green-500">Live Network</span>
            </div>
            {profile?.autoProfitEnabled && (
              <Badge variant="outline" className="text-[10px] uppercase border-yellow-500/30 text-yellow-500 bg-yellow-500/5">
                <Zap className="h-3 w-3 mr-1" /> Yield Active
              </Badge>
            )}
            <div className="h-7 w-7 rounded bg-muted flex items-center justify-center text-[10px] font-bold border border-border">
              {user.email?.substring(0, 2).toUpperCase() || "US"}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 space-y-6 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Investor Terminal</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Portfolio Analysis</h1>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => router.push('/investments')} className="h-8 px-4 text-xs font-bold bg-primary text-primary-foreground uppercase tracking-wider">
                <PlusCircle className="h-3.5 w-3.5 mr-2" /> Manage Assets
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Total Account Equity" 
              value={`$${totalAccountEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              trend={pnlPercentage !== 0 ? Number(pnlPercentage.toFixed(2)) : undefined} 
              icon={DollarSign}
              variant="accent"
            />
            <MetricCard 
              title="Ledger Balance" 
              value={`$${ledgerBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              icon={CreditCard}
              trendLabel="VERIFIED CASH"
            />
            <MetricCard 
              title="Net Delta (PnL)" 
              value={`${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              trend={Number(pnlPercentage.toFixed(2))} 
              icon={TrendingUp}
            />
            <MetricCard 
              title="Growth Rate" 
              value={profile?.autoProfitEnabled ? `+$${profile.dailyProfitAmount.toFixed(2)}/day` : "$0.00"} 
              icon={Zap}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PerformanceChart currentTotal={totalAccountEquity} />
            </div>
            <div className="space-y-6">
              <Card className="border border-border bg-card shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Diversification Matrix</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allocation.length > 0 ? allocation.map((item) => (
                    <div key={item.type} className="space-y-1.5">
                      <div className="flex justify-between text-[11px] uppercase tracking-tight">
                        <span className="font-semibold">{item.type}</span>
                        <span className="text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  )) : (
                    <div className="py-10 text-center opacity-30 text-[10px] font-bold uppercase tracking-widest">
                      No Assets Detected
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border border-border bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Market Ticker (Live Holdings)</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/investments')} className="h-7 text-[10px] uppercase font-bold text-primary">Portfolio Auditor</Button>
            </CardHeader>
            <CardContent>
              {isInvestmentsLoading ? (
                <div className="h-20 flex items-center justify-center">
                  <Terminal className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-[10px] uppercase tracking-wider h-10">Security</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider h-10">Classification</TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-wider h-10">Equity (USD)</TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-wider h-10">Position Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments?.slice(0, 8).map((inv) => (
                      <TableRow key={inv.id} className="border-border hover:bg-muted/30">
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight">{inv.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{inv.symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter bg-muted font-bold px-2 py-0 border border-border">
                            {inv.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-sm py-3 tabular-nums">
                          ${((inv.currentMarketPricePerUnit * inv.quantity) * marketNoise).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs py-3">
                          {inv.quantity.toLocaleString()} Units
                        </TableCell>
                      </TableRow>
                    ))}
                    {!investments?.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs uppercase tracking-widest">
                          Zero Asset Data Found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
