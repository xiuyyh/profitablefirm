
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { 
  DollarSign, 
  TrendingUp, 
  Briefcase, 
  Activity, 
  Bell, 
  Search,
  PlusCircle,
  Shield,
  Terminal
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
import { collection, query, limit } from "firebase/firestore";

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const investmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "investorProfiles", user.uid, "investments"),
      limit(5)
    );
  }, [firestore, user?.uid]);

  const { data: investments, isLoading: isInvestmentsLoading } = useCollection(investmentsQuery);

  const totalValue = investments?.reduce((sum, inv) => sum + (inv.currentMarketPricePerUnit * inv.quantity), 0) || 0;
  const totalCost = investments?.reduce((sum, inv) => sum + (inv.purchasePricePerUnit * inv.quantity), 0) || 0;
  const unrealizedPnL = totalValue - totalCost;
  const pnlPercentage = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

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
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <div className="relative w-full max-w-sm hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search instrument identifier..."
                className="h-8 pl-8 bg-background border-border text-xs focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-[10px] uppercase border-primary/30 text-primary bg-primary/5">
              Secure Terminal 2.4.0
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="h-7 w-7 rounded bg-muted flex items-center justify-center text-[10px] font-bold border border-border">
              {user.email?.substring(0, 2).toUpperCase() || "IN"}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Portfolio Overview</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => router.push('/investments')} className="h-8 px-4 text-xs font-bold bg-primary text-primary-foreground uppercase tracking-wider">
                <PlusCircle className="h-3.5 w-3.5 mr-2" /> Execute Order
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="AUM (Total Portfolio)" 
              value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              trend={pnlPercentage !== 0 ? Number(pnlPercentage.toFixed(1)) : undefined} 
              icon={DollarSign}
              variant="default"
            />
            <MetricCard 
              title="Unrealized P&L" 
              value={`${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              trend={pnlPercentage} 
              icon={TrendingUp}
            />
            <MetricCard 
              title="Daily Variance" 
              value="+$0.00" 
              trend={0} 
              icon={Activity}
              trendLabel="T-0"
            />
            <MetricCard 
              title="Total Positions" 
              value={investments?.length.toString() || "0"} 
              icon={Briefcase}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PerformanceChart />
            </div>
            <div className="space-y-6">
              <Card className="border border-border bg-card shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Diversification Matrix</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Equities", value: 100, color: "bg-primary" },
                    { label: "Fixed Income", value: 0, color: "bg-muted-foreground" },
                    { label: "Liquidity", value: 0, color: "bg-primary/40" },
                    { label: "Alternative", value: 0, color: "bg-muted" },
                  ].map((asset) => (
                    <div key={asset.label} className="space-y-1.5">
                      <div className="flex justify-between text-[11px] uppercase tracking-tight">
                        <span className="font-semibold">{asset.label}</span>
                        <span className="text-muted-foreground">{asset.value}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${asset.color}`} 
                          style={{ width: `${asset.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border border-primary/20 bg-primary/5 text-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <Activity className="h-3 w-3" /> System Insight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[13px] font-medium leading-relaxed italic opacity-90">
                    "Live market data synchronization active. Portfolio metrics are being aggregated from Firestore real-time streams."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border border-border bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Primary Positions</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/investments')} className="h-7 text-[10px] uppercase font-bold text-primary">Manage All</Button>
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
                      <TableHead className="text-[10px] uppercase tracking-wider h-10">Identifier</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider h-10">Classification</TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-wider h-10">Fair Value</TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-wider h-10">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments?.map((inv) => (
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
                        <TableCell className="text-right font-mono font-semibold text-sm py-3">
                          ${(inv.currentMarketPricePerUnit * inv.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs py-3">
                          {inv.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!investments?.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs uppercase tracking-widest">
                          No active positions found in terminal
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
