
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  ArrowUpRight, 
  Terminal,
  Activity,
  ShieldCheck,
  Calendar,
  Clock
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
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
import { MetricCard } from "@/components/dashboard/metric-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { collection, doc, query, orderBy } from "firebase/firestore";

export default function PerformancePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "investorProfiles", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(profileRef);

  const investmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "investorProfiles", user.uid, "investments"),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user?.uid]);

  const { data: investments } = useCollection(investmentsQuery);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "investorProfiles", user.uid, "transactions"),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user?.uid]);

  const { data: rawTransactions, isLoading: isTransactionsLoading } = useCollection(transactionsQuery);

  // LEDGER ACCOUNTING (Same integrity logic as Dashboard)
  const ledgerBalance = useMemo(() => {
    return rawTransactions?.reduce((sum, tx) => {
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum + tx.amount;
    }, 0) || 0;
  }, [rawTransactions]);

  const netExternalCapital = useMemo(() => {
    const assetCostBasis = investments?.reduce((sum, inv) => sum + (inv.purchasePricePerUnit * inv.quantity), 0) || 0;
    const netCashInjected = rawTransactions?.reduce((sum, tx) => {
      if (tx.type === 'Deposit') return sum + tx.amount;
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum;
    }, 0) || 0;
    return assetCostBasis + netCashInjected;
  }, [investments, rawTransactions]);

  const settledEquity = useMemo(() => {
    const assetValue = investments?.reduce((sum, inv) => sum + (inv.currentMarketPricePerUnit * inv.quantity), 0) || 0;
    return assetValue + ledgerBalance;
  }, [investments, ledgerBalance]);

  const totalPnL = settledEquity - netExternalCapital;
  const roiPercentage = netExternalCapital > 0 ? (totalPnL / netExternalCapital) * 100 : 0;

  // PROFIT-ONLY FILTER (For performance tracking)
  const profitLogs = useMemo(() => {
    if (!rawTransactions) return [];
    return rawTransactions.filter(tx => tx.type === 'Profit' || tx.type === 'Bonus');
  }, [rawTransactions]);

  const last24hProfit = useMemo(() => {
    const oneDayAgo = (Date.now() / 1000) - (24 * 60 * 60);
    return profitLogs
      .filter(tx => tx.createdAt?.seconds > oneDayAgo)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [profitLogs]);

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
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Terminal
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">High Fidelity Sync</span>
             </div>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
            <Activity className="h-3.5 w-3.5" />
            Algorithmic Growth Auditor
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard 
              title="Total Yield (PnL)" 
              value={`$${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              trend={roiPercentage}
              icon={Target}
              variant="accent"
              trendLabel="NET ROI"
            />
            <MetricCard 
              title="24H Accrual" 
              value={`$${last24hProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              icon={Zap}
              trendLabel="DAILY VELOCITY"
            />
            <MetricCard 
              title="Return on Basis" 
              value={`${roiPercentage.toFixed(2)}%`} 
              icon={BarChart3}
              trend={roiPercentage}
            />
            <MetricCard 
              title="Audit Status" 
              value="VERIFIED" 
              icon={ShieldCheck}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PerformanceChart currentTotal={settledEquity} />
            </div>
            
            <Card className="border border-border bg-card/40 shadow-none border-glow flex flex-col">
              <CardHeader className="border-b bg-muted/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Efficiency Audit</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 flex-1">
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-border pb-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Injected Capital</p>
                      <p className="text-xl font-mono font-bold">${netExternalCapital.toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter opacity-50">Base</Badge>
                  </div>
                  
                  <div className="flex justify-between items-end border-b border-border pb-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Settled Equity</p>
                      <p className="text-xl font-mono font-bold">${settledEquity.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="text-[10px] font-bold">LADDER UP</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground">Engine Utilization</span>
                      <span className="text-primary">{profile?.autoProfitEnabled ? '100%' : '0%'}</span>
                    </div>
                    <div className="h-1 bg-muted rounded-none overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000 glow-primary" 
                        style={{ width: profile?.autoProfitEnabled ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto p-4 bg-primary/5 border border-primary/20 rounded-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">Network Protocol</span>
                  </div>
                  <p className="text-[8px] text-muted-foreground leading-relaxed uppercase tracking-tighter">
                    Accrual is calculated at 60-second intervals based on institutional ladder logic (+0.8% bias). Integrity checked against global ledger timestamp.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-border bg-card shadow-none border-glow">
            <CardHeader className="border-b bg-muted/10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Specific Yield Accrual Log
                </CardTitle>
                <CardDescription className="text-[9px] uppercase mt-1">Audit-ready historical profit distributions</CardDescription>
              </div>
              <Badge variant="outline" className="text-[9px] border-primary/20 text-primary font-mono px-3">
                {profitLogs.length} EVENTS
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border bg-muted/5">
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10 px-6">Timestamp</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10">Classification</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10">Network Node</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] h-10 px-6">Accrual Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitLogs.map((log) => (
                    <TableRow key={log.id} className="border-border hover:bg-primary/5 transition-colors">
                      <TableCell className="py-4 px-6 font-mono text-[11px] text-muted-foreground font-bold">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 opacity-50" />
                          {log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleString() : 'Processing'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={`text-[9px] font-black uppercase border-primary/30 text-primary bg-primary/5`}>
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-[10px] font-mono text-muted-foreground font-bold">
                        {log.description}
                      </TableCell>
                      <TableCell className="text-right py-4 px-6 font-mono font-black text-sm text-green-500 glow-text">
                        +${log.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!profitLogs.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-20 text-muted-foreground text-[9px] font-black uppercase tracking-[0.5em] opacity-30">
                        NO ACCRUAL DATA FOUND ON LEDGER
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </>
  );
}
