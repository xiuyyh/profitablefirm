
"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Globe, 
  Terminal, 
  ShieldAlert,
  Filter,
  Download,
  User as UserIcon
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collectionGroup, doc, query, orderBy } from "firebase/firestore";

export default function GlobalLedgerPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "investorProfiles", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(profileRef);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, "transactions"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: transactions, isLoading } = useCollection(transactionsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
    if (profile && profile.role !== "admin") {
      router.push("/");
    }
  }, [user, isUserLoading, profile, router]);

  if (isUserLoading || !profile || profile.role !== "admin") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Terminal className="h-8 w-8 animate-pulse text-destructive" />
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
              <Globe className="h-5 w-5 text-destructive" />
              Global Financial Ledger
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest">
              <Download className="h-3 w-3 mr-2" /> Export Logs
            </Button>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-destructive/5 border-destructive/20 shadow-none">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Network Throughput</span>
                  <Globe className="h-4 w-4 text-destructive opacity-50" />
                </div>
                <h3 className="text-2xl font-bold mt-2 font-mono">LIVE</h3>
                <p className="text-[9px] text-muted-foreground mt-1 uppercase">Monitoring all transaction nodes</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20 shadow-none">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Active Sessions</span>
                  <UserIcon className="h-4 w-4 text-primary opacity-50" />
                </div>
                <h3 className="text-2xl font-bold mt-2 font-mono">{transactions?.length || 0}</h3>
                <p className="text-[9px] text-muted-foreground mt-1 uppercase">Total historical records</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-none">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Security Level</span>
                  <ShieldAlert className="h-4 w-4 text-yellow-500 opacity-50" />
                </div>
                <h3 className="text-2xl font-bold mt-2 font-mono uppercase">Standard</h3>
                <p className="text-[9px] text-muted-foreground mt-1 uppercase">End-to-end encrypted</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card shadow-none">
            <CardHeader className="border-b bg-muted/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Global Statement of Activity</CardTitle>
                <CardDescription className="text-[10px] uppercase mt-1">Audit-level visibility into all cross-investor activity</CardDescription>
              </div>
              <div className="flex gap-2">
                 <div className="relative">
                    <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Filter entries..." className="h-9 pl-8 text-xs bg-background border-border w-[200px]" />
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Terminal className="h-6 w-6 animate-spin text-destructive" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/20 border-border">
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Timestamp</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Investor ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Type</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Description</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Value (USD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((tx) => (
                      <TableRow key={tx.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-mono text-[10px] font-bold text-muted-foreground">
                          {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleString() : 'PENDING'}
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-mono uppercase bg-muted px-1.5 py-0.5 rounded border border-border">
                            {tx.investorId?.substring(0, 8)}...
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[9px] uppercase font-bold px-2 py-0.5 ${
                            tx.type === 'Deposit' ? 'border-green-500/30 text-green-500' : 
                            tx.type === 'Bonus' ? 'border-yellow-500/30 text-yellow-500' : 
                            tx.type === 'Withdrawal' ? 'border-red-500/30 text-red-500' : 'border-primary/30 text-primary'
                          }`}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-medium text-muted-foreground">{tx.description}</span>
                        </TableCell>
                        <TableCell className={`text-right font-mono text-xs font-bold ${tx.type === 'Withdrawal' ? 'text-red-500' : 'text-green-500'}`}>
                          {tx.type === 'Withdrawal' ? '-' : '+'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!transactions?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-24">
                          <div className="flex flex-col items-center gap-2 opacity-30">
                            <Terminal className="h-10 w-10 mb-2" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.3em]">No transaction records found on network</span>
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
