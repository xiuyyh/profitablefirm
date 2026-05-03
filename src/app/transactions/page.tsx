
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  History, 
  Terminal, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  ShieldCheck
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
import { collection, query, orderBy } from "firebase/firestore";

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "investorProfiles", user.uid, "transactions"),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user?.uid]);

  const { data: transactions, isLoading } = useCollection(transactionsQuery);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Transaction Ledger
            </h1>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 font-mono text-[10px] uppercase tracking-widest">
            Audit-Ready Records
          </Badge>
        </header>

        <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
            <ShieldCheck className="h-3 w-3" />
            Verified Financial History
          </div>

          <Card className="border-border bg-card shadow-none">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Statement of Activity</CardTitle>
              <CardDescription className="text-[10px] uppercase mt-1">
                Real-time tracking of all deposits, bonuses, and account adjustments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Terminal className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/20 border-border">
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Date</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Type</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Description</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Status</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((tx) => (
                      <TableRow key={tx.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-mono text-[11px] font-bold text-muted-foreground">
                          {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleString() : 'Processing...'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${
                            tx.type === 'Deposit' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 
                            tx.type === 'Bonus' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' : 
                            tx.type === 'Withdrawal' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-primary/30 text-primary bg-primary/5'
                          }`}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-foreground">{tx.description}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase">
                            <ShieldCheck className="h-3 w-3" /> {tx.status}
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm font-bold ${tx.type === 'Withdrawal' ? 'text-red-500' : 'text-green-500'}`}>
                          {tx.type === 'Withdrawal' ? '-' : '+'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!transactions?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-24">
                          <div className="flex flex-col items-center gap-2 opacity-50">
                            <History className="h-8 w-8 mb-2" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Zero Ledger History Found</span>
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
    </div>
  );
}
