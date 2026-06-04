
"use client";

import { useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  ShieldAlert, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Activity,
  ChevronRight,
  Terminal
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, collectionGroup } from "firebase/firestore";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";

export default function AdminDashboard() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "investorProfiles");
  }, [firestore]);

  const { data: users } = useCollection(usersQuery);

  const pendingTxQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Collection Group query for all pending transactions across all users
    return query(
      collectionGroup(firestore, "transactions"),
      where("status", "==", "Pending"),
      orderBy("createdAt", "desc")
    );
  }, [firestore]);

  const { data: pendingTransactions, isLoading: isTxLoading } = useCollection(pendingTxQuery);

  const pendingDeposits = useMemo(() => 
    pendingTransactions?.filter(tx => tx.type === "Deposit") || [], 
    [pendingTransactions]
  );
  
  const pendingWithdrawals = useMemo(() => 
    pendingTransactions?.filter(tx => tx.type === "Withdrawal") || [], 
    [pendingTransactions]
  );

  return (
    <>
      <AppSidebar />
      <SidebarInset className="w-full">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <h1 className="text-xl font-bold flex items-center gap-2 uppercase tracking-widest">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Command Center
            </h1>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-8 w-full max-w-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              <Activity className="h-3.5 w-3.5" />
              Real-Time Network Status
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">System Overview</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              title="Active Investors" 
              value={users?.length.toString() || "0"} 
              icon={Users}
              trendLabel="GLOBAL POOL"
            />
            <MetricCard 
              title="Awaiting Deposits" 
              value={pendingDeposits.length.toString()} 
              icon={ArrowDownLeft}
              variant={pendingDeposits.length > 0 ? "accent" : "default"}
              trendLabel="INBOUND QUEUE"
            />
            <MetricCard 
              title="Awaiting Payouts" 
              value={pendingWithdrawals.length.toString()} 
              icon={ArrowUpRight}
              variant={pendingWithdrawals.length > 0 ? "accent" : "default"}
              trendLabel="OUTBOUND QUEUE"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border bg-card shadow-none border-glow rounded-none">
              <CardHeader className="border-b bg-muted/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">System Sectors</CardTitle>
                <CardDescription className="text-[9px] uppercase mt-1">Direct access to core administrative functions</CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid gap-4">
                <Button asChild variant="outline" className="w-full justify-between h-16 border-border hover:bg-primary/5 hover:text-primary rounded-none transition-all group">
                  <Link href="/admin/users">
                    <div className="flex items-center gap-4 text-left">
                      <Users className="h-6 w-6 opacity-50 group-hover:opacity-100" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Manage Accounts</p>
                        <p className="text-[8px] uppercase tracking-tighter opacity-50 mt-1">Audit balances and manual overrides</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full justify-between h-16 border-border hover:bg-primary/5 hover:text-primary rounded-none transition-all group">
                  <Link href="/admin/deposits">
                    <div className="flex items-center gap-4 text-left">
                      <ArrowDownLeft className="h-6 w-6 opacity-50 group-hover:opacity-100" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Verify Deposits</p>
                        <p className="text-[8px] uppercase tracking-tighter opacity-50 mt-1">Confirm inbound financial flows</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full justify-between h-16 border-border hover:bg-primary/5 hover:text-primary rounded-none transition-all group">
                  <Link href="/admin/withdrawals">
                    <div className="flex items-center gap-4 text-left">
                      <ArrowUpRight className="h-6 w-6 opacity-50 group-hover:opacity-100" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Fulfill Withdrawals</p>
                        <p className="text-[8px] uppercase tracking-tighter opacity-50 mt-1">Execute outbound payout protocols</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-none border-glow flex flex-col justify-center items-center text-center p-12 rounded-none bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.03),transparent_70%)]">
               <Terminal className="h-20 w-20 text-primary/10 mb-6" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/40">Secure Console Active</h3>
               <p className="text-[8px] uppercase tracking-widest opacity-30 mt-6 max-w-xs leading-loose">
                 All administrative actions are logged and encrypted. Ensure all manual overrides are verified against external ledgers.
               </p>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
