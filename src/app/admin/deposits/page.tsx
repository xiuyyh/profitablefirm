"use client";

import { useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  ArrowDownLeft, 
  Terminal, 
  CheckCircle2, 
  XCircle,
  Clock,
  Wallet
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

export default function PendingDepositsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const pendingDepositsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "transactions"), // Using group query pattern
      where("status", "==", "Pending"),
      where("type", "==", "Deposit"),
      orderBy("createdAt", "desc")
    );
  }, [firestore]);

  const { data: deposits, isLoading } = useCollection(pendingDepositsQuery);

  const handleAction = (deposit: any, status: 'Completed' | 'Failed') => {
    if (!firestore) return;

    // IMPORTANT: transactions is subcollection, but we need the correct path
    // The collectionGroup query items have ID but we need to know the parent.
    // In our schema, transactions are under /investorProfiles/{investorId}/transactions/{transactionId}
    const docRef = doc(firestore, "investorProfiles", deposit.investorId, "transactions", deposit.id);
    
    updateDocumentNonBlocking(docRef, {
      status: status,
      updatedAt: new Date().toISOString(),
    });

    toast({
      title: status === 'Completed' ? "Deposit Approved" : "Deposit Declined",
      description: `The request for $${deposit.amount.toLocaleString()} has been updated.`,
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
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-primary" />
              Pending Deposits
            </h1>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none">
          <Card className="border-border bg-card shadow-none">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Inbound Funding Requests</CardTitle>
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
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Time</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Investor ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Method</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Sender Wallet</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Amount</TableHead>
                      <TableHead className="w-[150px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits?.map((d) => (
                      <TableRow key={d.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString() : 'Processing'}
                        </TableCell>
                        <TableCell className="font-mono text-[10px]">{d.investorId.substring(0, 8)}...</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black border-primary/30 text-primary bg-primary/5">
                            {d.paymentMethod || "UNKNOWN"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                           <div className="flex items-center gap-2">
                             <Wallet className="h-3 w-3 opacity-30 shrink-0" />
                             <span className="text-[9px] font-mono text-muted-foreground truncate" title={d.senderAddress}>{d.senderAddress || "NOT PROVIDED"}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-black text-green-500">
                          ${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2 text-green-500 hover:bg-green-500/10 hover:text-green-500"
                              onClick={() => handleAction(d, 'Completed')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleAction(d, 'Failed')}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Decline
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!deposits?.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-24">
                          <div className="flex flex-col items-center gap-2 opacity-50">
                            <Clock className="h-8 w-8 mb-2" />
                            <span className="text-[10px] uppercase font-black tracking-[0.2em]">Queue is currently empty</span>
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
