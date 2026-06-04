"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Users, 
  ShieldAlert, 
  DollarSign, 
  ChevronRight,
  Terminal,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet
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
import { MetricCard } from "@/components/dashboard/metric-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function AdminControlPanel() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "investorProfiles", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // Fetch all users
  const investorsQuery = useMemoFirebase(() => {
    if (!firestore || !profile || profile.role !== "admin") return null;
    return collection(firestore, "investorProfiles");
  }, [firestore, profile?.role]);

  const { data: rawInvestors, isLoading: isInvestorsLoading } = useCollection(investorsQuery);

  /**
   * Pending Transactions Global Auditor
   * Fetches all transactions with 'Pending' status across the entire database.
   * REQUIRED: Composite index on 'transactions' collection group: status (ASC), createdAt (DESC)
   */
  const pendingTransactionsQuery = useMemoFirebase(() => {
    // Only fire the query once we have confirmed the admin profile to avoid permission race conditions
    if (!firestore || !profile || profile.role !== "admin") return null;
    
    return query(
      collectionGroup(firestore, "transactions"), 
      where("status", "==", "Pending"),
      orderBy("createdAt", "desc")
    );
  }, [firestore, profile?.role]);

  const { data: pendingRequests, isLoading: isPendingLoading } = useCollection(pendingTransactionsQuery);

  const investors = useMemo(() => {
    if (!rawInvestors) return null;
    return [...rawInvestors].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawInvestors]);

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
    // We use the investorId from the request to locate the subcollection document
    const docRef = doc(firestore, "investorProfiles", request.investorId, "transactions", request.id);
    updateDocumentNonBlocking(docRef, {
      status: "Completed",
      updatedAt: serverTimestamp()
    });
    toast({
      title: "Request Approved",
      description: `Successfully processed ${request.type} of $${request.amount.toLocaleString()}.`,
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
      title: "Request Declined",
      description: `Rejected ${request.type} of $${request.amount.toLocaleString()}.`,
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
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Admin Control Panel
            </h1>
          </div>
          <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5 font-mono text-[10px] uppercase tracking-widest">
            Admin Access
          </Badge>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              title="Total Users" 
              value={investors?.length.toString() || "0"} 
              icon={Users}
            />
            <MetricCard 
              title="Pending Requests" 
              value={pendingRequests?.length.toString() || "0"} 
              icon={Clock}
              variant="accent"
            />
            <MetricCard 
              title="System Status" 
              value="ACTIVE" 
              icon={Activity}
            />
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="bg-muted/20 border-border p-1">
              <TabsTrigger value="pending" className="text-[10px] font-bold uppercase tracking-widest px-6">Pending Approvals</TabsTrigger>
              <TabsTrigger value="users" className="text-[10px] font-bold uppercase tracking-widest px-6">User Accounts</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-6">
              <Card className="border-border bg-card shadow-none overflow-hidden">
                <CardHeader className="border-b bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">Requests Hub</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground uppercase mt-1">
                        Global queue for deposits and withdrawals
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
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Type</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Amount</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Details</TableHead>
                          <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingRequests?.map((req) => (
                          <TableRow key={req.id} className="border-border hover:bg-muted/30">
                            <TableCell className="text-[10px] font-mono whitespace-nowrap">
                              {req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[9px] uppercase font-bold ${req.type === 'Withdrawal' ? 'border-red-500/30 text-red-500' : 'border-green-500/30 text-green-500'}`}>
                                {req.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-bold">${req.amount.toLocaleString()}</TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase truncate">{req.description}</span>
                                <span className="text-[9px] font-mono text-muted-foreground truncate flex items-center gap-1">
                                  <Wallet className="h-3 w-3" /> {req.senderAddress || req.destinationAddress || 'N/A'}
                                </span>
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
                              <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Queue Empty</span>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="border-border bg-card shadow-none overflow-hidden">
                <CardHeader className="border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">All Accounts</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground uppercase mt-1">
                        Manage user details and settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/10 border-border">
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider">User</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider">Email</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider">Status</TableHead>
                        <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investors?.map((investor) => (
                        <TableRow key={investor.id} className="border-border hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                {investor.firstName?.substring(0, 1).toUpperCase()}
                              </div>
                              <span className="font-bold text-sm tracking-tight">{investor.firstName} {investor.lastName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{investor.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[9px] uppercase font-bold ${investor.role === 'admin' ? 'border-destructive text-destructive' : 'border-green-500/30 text-green-500'}`}>
                              {investor.role || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => router.push(`/admin/investor/${investor.id}`)}
                              className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-primary"
                            >
                              Manage <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </>
  );
}