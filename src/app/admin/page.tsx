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
  Terminal,
  ChevronRight
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
import { collection, query, where, orderBy } from "firebase/firestore";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";

export default function AdminDashboard() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "investorProfiles");
  }, [firestore]);

  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);

  const pendingTxQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Note: This requires a Collection Group index for "transactions" on status
    return query(
      collection(firestore, "transactions"), // Using standard query if possible, or collectionGroup if rules permit
      where("status", "==", "Pending"),
      orderBy("createdAt", "desc")
    );
  }, [firestore]);

  // Fallback: If collectionGroup query is blocked or index missing, 
  // in a real app we'd fetch per-user, but for MVP we use the group query.
  // Assuming the user has created the index as instructed previously.
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
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Control Center
            </h1>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-8 w-full max-w-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              <Activity className="h-3.5 w-3.5" />
              Network Overview
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">System Health</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              title="Registered Investors" 
              value={users?.length.toString() || "0"} 
              icon={Users}
              trendLabel="TOTAL USERS"
            />
            <MetricCard 
              title="Pending Deposits" 
              value={pendingDeposits.length.toString()} 
              icon={ArrowDownLeft}
              variant={pendingDeposits.length > 0 ? "accent" : "default"}
              trendLabel="INCOMING FLOW"
            />
            <MetricCard 
              title="Pending Withdrawals" 
              value={pendingWithdrawals.length.toString()} 
              icon={ArrowUpRight}
              variant={pendingWithdrawals.length > 0 ? "accent" : "default"}
              trendLabel="OUTGOING FLOW"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border bg-card shadow-none border-glow">
              <CardHeader className="border-b bg-muted/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Quick Actions</CardTitle>
                <CardDescription className="text-[9px] uppercase tracking-tighter mt-1">Direct access to critical control sectors</CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid gap-4">
                <Button asChild variant="outline" className="w-full justify-between h-14 border-border hover:bg-primary/5 hover:text-primary">
                  <Link href="/admin/users">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5" />
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Manage Users</p>
                        <p className="text-[8px] uppercase tracking-tighter opacity-50 mt-1">Adjust balances and overrides</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full justify-between h-14 border-border hover:bg-primary/5 hover:text-primary">
                  <Link href="/admin/deposits">
                    <div className="flex items-center gap-3">
                      <ArrowDownLeft className="h-5 w-5" />
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Review Deposits</p>
                        <p className="text-[8px] uppercase tracking-tighter opacity-50 mt-1">Verify incoming capital</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full justify-between h-14 border-border hover:bg-primary/5 hover:text-primary">
                  <Link href="/admin/withdrawals">
                    <div className="flex items-center gap-3">
                      <ArrowUpRight className="h-5 w-5" />
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Audit Withdrawals</p>
                        <p className="text-[8px] uppercase tracking-tighter opacity-50 mt-1">Fulfill payout requests</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-none border-glow flex flex-col justify-center items-center text-center p-12">
               <ShieldAlert className="h-16 w-16 text-primary/20 mb-4" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Admin Authority Active</h3>
               <p className="text-[8px] uppercase tracking-widest opacity-30 mt-4 max-w-xs">
                 All actions performed in this terminal are logged and verified. Ensure double-verification of all manual overrides.
               </p>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
