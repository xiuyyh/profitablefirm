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
  Activity, 
  Search,
  Shield,
  Terminal,
  Zap,
  CreditCard,
  User as UserIcon
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
import { collection, doc } from "firebase/firestore";

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [marketNoise, setMarketNoise] = useState(1);

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

  // Visual market wiggle effect - only active if trading is enabled by admin
  useEffect(() => {
    if (!profile?.autoProfitEnabled) {
      setMarketNoise(1);
      return;
    }
    const interval = setInterval(() => {
      // Subtle visual wiggling between 0.999 and 1.001
      const noise = 0.999 + (Math.random() * 0.002);
      setMarketNoise(noise);
    }, 400);
    return () => clearInterval(interval);
  }, [profile?.autoProfitEnabled]);

  const investmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "investorProfiles", user.uid, "investments");
  }, [firestore, user?.uid]);

  const { data: rawInvestments, isLoading: isInvestmentsLoading } = useCollection(investmentsQuery);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "investorProfiles", user.uid, "transactions");
  }, [firestore, user?.uid]);

  const { data: rawTransactions } = useCollection(transactionsQuery);

  const investments = useMemo(() => {
    if (!rawInvestments) return null;
    return [...rawInvestments].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawInvestments]);

  const transactions = useMemo(() => {
    if (!rawTransactions) return null;
    return [...rawTransactions].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawTransactions]);

  const ledgerBalance = useMemo(() => {
    const calculated = transactions?.reduce((sum, tx) => {
      if (tx.status !== 'Completed') return sum;
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum + tx.amount;
    }, 0) || 0;
    return profile?.manualLedgerOverride ?? calculated;
  }, [transactions, profile]);

  const netExternalCapital = useMemo(() => {
    const assetCostBasis = investments?.reduce((sum, inv) => sum + (inv.purchasePricePerUnit * inv.quantity), 0) || 0;
    const netCashInjected = transactions?.reduce((sum, tx) => {
      if (tx.status !== 'Completed') return sum;
      if (tx.type === 'Deposit') return sum + tx.amount;
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum;
    }, 0) || 0;
    return assetCostBasis + netCashInjected;
  }, [investments, transactions]);

  const baseInvestmentValue = useMemo(() => {
    return investments?.reduce((sum, inv) => sum + (inv.currentMarketPricePerUnit * inv.quantity), 0) || 0;
  }, [investments]);

  const settledEquity = profile?.manualAumOverride ?? (baseInvestmentValue + ledgerBalance);
  const totalAccountEquity = settledEquity * marketNoise;
  const netPnL = profile?.manualPnlOverride ?? (settledEquity - netExternalCapital);
  const pnlPercentage = netExternalCapital > 0 ? (netPnL / netExternalCapital) * 100 : 0;

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
                placeholder="Search portfolio..."
                className="h-8 pl-8 bg-background border-border text-xs focus-visible:ring-primary rounded-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <div className={`h-2 w-2 rounded-full ${profile?.autoProfitEnabled ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-widest ${profile?.autoProfitEnabled ? 'text-primary glow-text' : 'text-muted-foreground'}`}>
                {profile?.autoProfitEnabled ? 'System Active' : 'System Static'}
              </span>
            </div>
            <div className="h-7 w-7 rounded-sm bg-primary/10 flex items-center justify-center text-[10px] font-bold border border-primary/30 text-primary">
              {user.email?.substring(0, 2).toUpperCase() || "US"}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 space-y-6 w-full max-w-none">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Investor Dashboard</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-widest glow-text uppercase">My Portfolio</h1>
                {profile && (
                  <div className="flex items-center gap-2 mt-2 py-1 px-3 bg-primary/10 border border-primary/20 w-fit">
                    <UserIcon className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      WELCOME @{profile.firstName || user.email?.split('@')[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard 
              title="Total Balance" 
              value={`$${totalAccountEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              trend={Number(pnlPercentage.toFixed(2))} 
              icon={DollarSign}
              variant="accent"
              trendLabel="LIVE BALANCE"
            />
            <MetricCard 
              title="Cash Balance" 
              value={`$${ledgerBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              icon={CreditCard}
              trendLabel="SETTLED CASH"
            />
            <MetricCard 
              title="Profit / Loss" 
              value={`${netPnL >= 0 ? '+' : ''}$${netPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              trend={Number(pnlPercentage.toFixed(2))} 
              icon={TrendingUp}
              trendLabel="TOTAL GROWTH"
            />
          </div>

          <div className="w-full">
            <PerformanceChart currentTotal={settledEquity} />
          </div>

          <Card className="border border-border bg-card shadow-none border-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b bg-muted/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Current Assets
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
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10 px-6">Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10">Type</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] h-10 px-6">Value (USD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments?.map((inv) => (
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
                    {!investments?.length && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-20">
                          <div className="flex flex-col items-center gap-2 opacity-50">
                            <Terminal className="h-6 w-6" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em]">No assets found</span>
                          </div>
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
    </>
  );
}
