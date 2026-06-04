"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  ShieldAlert, 
  Terminal,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  ArrowDownLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { collection, doc, query, where, collectionGroup, serverTimestamp, orderBy } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function PendingDepositsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "investorProfiles", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const pendingDepositsQuery = useMemoFirebase(() => {
    if (!firestore || !profile || profile.role !== "admin") return null;
    return query(
      collectionGroup(firestore, "transactions"), 
      where("status", "==", "Pending"),
      where("type", "==", "Deposit"),
      orderBy("createdAt", "desc")
    );
  }, [firestore, profile?.role]);

  const { data: pendingRequests, isLoading: isPendingLoading } = useCollection(pendingDepositsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
    if (profile && profile.role !== "admin") {
      router.push("/");
    }
  }, [user, isUserLoading, profile, router]);

  const handleApprove = (request: any) => {
    if (!firestore) return;
    const docRef = doc(firestore, "investorProfiles", request.investorId, "transactions", request.id);
    updateDocumentNonBlocking(docRef, {
      status: "Completed",
      updatedAt: serverTimestamp()
    });
    toast({
      title: "Deposit Approved",
      description: `Successfully processed $${request.amount.toLocaleString()}.`,
    });
  };

  const handleDecline = (request: any) => {
    if (!firestore) return;
    const docRef = doc(firestore, "investorProfiles", request.investorId, "transactions", request.id);
    updateDocumentNonBlocking(docRef, {
      status: "Failed",
      updatedAt: serverTimestamp()
    });
    toast({
      variant: "destructive",
      title: "Deposit Declined",
      description: `Rejected $${request.amount.toLocaleString()}.`,
    });
  };

  if (isUserLoading || isProfileLoading || !profile || profile.role !== "admin") {
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
              <ArrowDownLeft className="h-5 w-5 text-green-500" />
              Pending Deposits
            </h1>
          </div>
          <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/5 font-mono text-[10px] uppercase tracking-widest">
            {pendingRequests?.length || 0} Awaiting
          </Badge>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none">
          <Card className="border-border bg-card shadow-none overflow-hidden">
            <CardHeader className="border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Deposit Queue</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground uppercase mt-1">
                    Review and confirm incoming payments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isPendingLoading ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground animate-pulse">
                  <Terminal className="h-6 w-6" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/10 border-border">
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Date</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Amount</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Method</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Sender Address</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests?.map((req) => (
                      <TableRow key={req.id} className="border-border hover:bg-muted/30">
                        <TableCell className="text-[10px] font-mono whitespace-nowrap">
                          {req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-green-500">${req.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold border-primary/30 text-primary">
                            {req.paymentMethod || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground truncate">
                            <Wallet className="h-3 w-3" /> {req.senderAddress || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => handleApprove(req)} className="h-7 px-3 bg-green-600 hover:bg-green-700 text-[9px] font-bold uppercase tracking-widest">
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDecline(req)} className="h-7 px-3 text-[9px] font-bold uppercase tracking-widest">
                              Decline
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!pendingRequests?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 opacity-50">
                          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">No Pending Deposits</span>
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
