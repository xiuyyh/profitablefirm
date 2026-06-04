
"use client";

import { useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  ArrowUpRight, 
  Terminal, 
  CheckCircle2, 
  XCircle,
  Clock,
  ExternalLink
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function PendingWithdrawalsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const pendingWithdrawalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "transactions"),
      where("status", "==", "Pending"),
      where("type", "==", "Withdrawal"),
      orderBy("createdAt", "desc")
    );
  }, [firestore]);

  const { data: withdrawals, isLoading } = useCollection(pendingWithdrawalsQuery);

  const handleAction = (withdrawal: any, status: 'Completed' | 'Failed') => {
    if (!firestore) return;

    const docRef = doc(firestore, "investorProfiles", withdrawal.investorId, "transactions", withdrawal.id);
    
    updateDocumentNonBlocking(docRef, {
      status: status,
      updatedAt: new Date().toISOString(),
    });

    toast({
      title: status === 'Completed' ? "Withdrawal Finalized" : "Withdrawal Rejected",
      description: `The outbound request for $${withdrawal.amount.toLocaleString()} has been updated.`,
    });
  };

  return (
    <>
      <AppSidebar />
      <SidebarInset className="w-full">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <h1 className="text-xl font-bold flex items-center gap-2 uppercase tracking-widest">
              <ArrowUpRight className="h-5 w-5 text-destructive" />
              Payout Audit
            </h1>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none">
          <Card className="border-border bg-card shadow-none rounded-none border-glow">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-destructive">Awaiting Payout Execution</CardTitle>
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
                      <TableHead className="text-[10px] uppercase font-bold tracking-widest h-12 px-6">Timestamp</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-widest h-12">Network</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-widest h-12">Target Address</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-widest h-12">Amount</TableHead>
                      <TableHead className="w-[150px] px-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals?.map((w) => (
                      <TableRow key={w.id} className="border-border hover:bg-muted/30">
                        <TableCell className="px-6 font-mono text-[10px] text-muted-foreground uppercase">
                          {w.createdAt ? new Date(w.createdAt.seconds * 1000).toLocaleString() : 'PENDING SYNC'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest border-destructive/30 text-destructive bg-destructive/5 rounded-none">
                            {w.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                           <div className="flex items-center gap-2">
                             <ExternalLink className="h-3 w-3 opacity-30 shrink-0" />
                             <span className="text-[10px] font-mono text-muted-foreground truncate select-all">{w.destinationAddress || "ERROR: NO ADDR"}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-black text-destructive">
                          -${w.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="px-6">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-9 px-3 text-green-500 hover:bg-green-500/10 hover:text-green-500 uppercase text-[9px] font-black tracking-widest"
                              onClick={() => handleAction(w, 'Completed')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Fulfill
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-9 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive uppercase text-[9px] font-black tracking-widest"
                              onClick={() => handleAction(w, 'Failed')}
                            >
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!withdrawals?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-32">
                          <div className="flex flex-col items-center gap-4 opacity-30">
                            <Clock className="h-10 w-10 mb-2" />
                            <span className="text-[10px] uppercase font-black tracking-[0.5em]">All outbound payout requests cleared</span>
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
